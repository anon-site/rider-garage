const { onValueCreated, onValueUpdated } = require("firebase-functions/v2/database");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getDatabase();
const messaging = getMessaging();

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getDriverName(driverId) {
  const snap = await db.ref(`drivers/${driverId}/name`).get();
  return snap.val() || driverId;
}

async function getDriverGarageId(driverId) {
  const snap = await db.ref(`drivers/${driverId}/garageId`).get();
  return snap.val() || null;
}

function shouldReceiveGarageNotification(role, userGarageId, driverGarageId) {
  if (role === "admin" || role === "supervisor" || role === "observer") {
    return true;
  }

  if (role === "garage") {
    if (!userGarageId || !driverGarageId) return false;
    return userGarageId === driverGarageId;
  }

  return false;
}

async function collectPushTokensForGarage(driverGarageId) {
  const snap = await db.ref("pushTokens").get();
  if (!snap.exists()) return [];

  const tokens = [];
  snap.forEach((userSnap) => {
    userSnap.forEach((tokenSnap) => {
      const value = tokenSnap.val();
      if (!value?.token) return;
      if (shouldReceiveGarageNotification(value.role, value.garageId, driverGarageId)) {
        tokens.push(value.token);
      }
    });
  });
  return [...new Set(tokens)];
}

async function removeInvalidTokens(tokens, response) {
  if (!response?.responses?.length) return;

  const removals = [];
  response.responses.forEach((result, index) => {
    if (!result.success) {
      const code = result.error?.code;
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        removals.push(tokens[index]);
      }
    }
  });

  if (!removals.length) return;

  const snap = await db.ref("pushTokens").get();
  if (!snap.exists()) return;

  const updates = {};
  snap.forEach((userSnap) => {
    userSnap.forEach((tokenSnap) => {
      const value = tokenSnap.val();
      if (value?.token && removals.includes(value.token)) {
        updates[`pushTokens/${userSnap.key}/${tokenSnap.key}`] = null;
      }
    });
  });

  if (Object.keys(updates).length) {
    await db.ref().update(updates);
  }
}

async function sendAttendancePush({ title, body, tag, type, driverGarageId }) {
  const tokens = await collectPushTokensForGarage(driverGarageId);
  if (!tokens.length) return;

  const response = await messaging.sendEachForMulticast({
    tokens,
    data: {
      title,
      body,
      tag,
      type,
      garageId: driverGarageId || "",
    },
  });

  await removeInvalidTokens(tokens, response);
}

exports.onDriverExitPush = onValueCreated("/attendance/{recordId}", async (event) => {
  const record = event.data.val();
  if (!record?.driverId || !record?.clockIn) return;

  const [driverName, driverGarageId] = await Promise.all([
    getDriverName(record.driverId),
    getDriverGarageId(record.driverId),
  ]);
  const time = formatTime(record.clockIn);
  const body = `${driverName} left the garage at ${time}`;

  await sendAttendancePush({
    title: "Driver left garage",
    body,
    tag: `attendance-exit-${event.params.recordId}`,
    type: "driver_exit",
    driverGarageId,
  });
});

exports.onDriverReturnPush = onValueUpdated("/attendance/{recordId}", async (event) => {
  const before = event.data.before.val();
  const after = event.data.after.val();

  if (!before || !after) return;
  if (before.clockOut || !after.clockOut) return;

  const [driverName, driverGarageId] = await Promise.all([
    getDriverName(after.driverId),
    getDriverGarageId(after.driverId),
  ]);
  const time = formatTime(after.clockOut);
  const body = `${driverName} returned to the garage at ${time}`;

  await sendAttendancePush({
    title: "Driver returned",
    body,
    tag: `attendance-entry-${event.params.recordId}`,
    type: "driver_entry",
    driverGarageId,
  });
});
