// Translations for Garage App - English Only
const translations = {
    en: {
        selectLanguage: "Select Language",
        appTitle: "Garage TFT",
        garageAddress: "Aristomenous 69",
        drivers: "Drivers",
        statistics: "Statistics",
        calendar: "Calendar",
        reports: "Reports",
        monthlyReport: "Monthly Report",
        bikes: "Bikes List",
        bikeNumber: "Bike Number",
        bikeStatus: "Bike Status",
        batteryLife: "Battery Life (Hours)",
        notes: "Notes",
        assignedDriver: "Assigned Driver",
        noDriver: "No Driver",
        active: "Active",
        maintenance: "Maintenance",
        outOfService: "Out of Service",
        addBike: "Add New Bike",
        bikeAdded: "Bike added successfully",
        bikeUpdated: "Bike updated successfully",
        bikeDeleted: "Bike deleted successfully",
        confirmDeleteBike: "Are you sure you want to delete this bike?",
        search: "Search",
        searchPlaceholder: "Search by driver name or bike number...",
        addDriver: "Add New Driver",
        totalDrivers: "Total Drivers",
        outside: "Outside",
        inside: "Inside",
        totalOrders: "Total Orders",
        totalBikes: "Total Bikes",
        activeBikes: "Active",
        brokenBikes: "Broken / Maintenance",
        bikesWithDriver: "With Driver",
        bikesWithoutDriver: "Without Driver",
        driversList: "Drivers List",
        addNewDriver: "Add New Driver",
        driverName: "Driver Name",
        driverId: "ID Number",
        phoneNumber: "Phone Number",
        bikeNumber: "Bike Number",
        rating: "Rating",
        save: "Save",
        movementEntry: "Record Movement",
        exitTime: "Exit Time",
        entryTime: "Entry Time",
        ordersCount: "Orders Count",
        recordMovement: "Record Movement",
        movementHistory: "Movement History",
        date: "Date",
        duration: "Duration",
        statusInside: "Inside",
        statusOutside: "Outside",
        orders: "Orders",
        dashboard: "Dashboard",
        edit: "Edit",
        delete: "Delete",
        noDrivers: "No Drivers",
        addDriverFirst: "Add a new driver to get started",
        driverAdded: "Driver added successfully",
        movementRecorded: "Movement recorded successfully",
        driverDeleted: "Driver deleted successfully",
        confirmDelete: "Are you sure you want to delete this driver?",
        yes: "Yes",
        no: "No",
        cancel: "Cancel",
        close: "Close",
        driverProfile: "Driver Profile",
        editDriverInfo: "Edit Driver Info",
        saveChanges: "Save Changes",
        driverUpdated: "Driver updated successfully",
        editMovement: "Edit Movement",
        movementUpdated: "Movement updated successfully",
        movementDeleted: "Movement deleted successfully",
        confirmDeleteMovement: "Are you sure you want to delete this movement?",
        actions: "Actions",
        ratingWarning: "Warning: Low rating (less than 80). Driver performance needs review!",
        ratingGood: "Good",
        ratingAlert: "⚠️ Warning",
        pending: "--",
        waitingEntry: "Waiting",
        enterExitTime: "Enter exit time",
        invalidTime: "Invalid time",
        lessThanMinute: "Less than 1 min",
        hour: "hour",
        hours: "hours",
        minute: "min",
        minutes: "min",
        today: "Today",
        sun: "Sun",
        mon: "Mon",
        tue: "Tue",
        wed: "Wed",
        thu: "Thu",
        fri: "Fri",
        sat: "Sat",
        january: "January",
        february: "February",
        march: "March",
        april: "April",
        may: "May",
        june: "June",
        july: "July",
        august: "August",
        september: "September",
        october: "October",
        november: "November",
        december: "December",
        movementDetails: "Movement Details",
        noMovements: "No movements recorded",
        exit: "Exit",
        entry: "Entry",
        ongoing: "Ongoing",
        noTimeRecorded: "No time recorded",
        recordExit: "Record Exit",
        recordEntry: "Record Entry",
        lastRecorded: "Last Recorded",
        entryDetails: "Entry Details",
        saveEntryDetails: "Save Entry Details",
        saveExitDetails: "Save Exit Details",
        exitDetails: "Exit Details",
        exitRecorded: "Exit recorded successfully",
        entryRecorded: "Entry recorded - please enter details",
        entryRequiredFirst: "Must record entry first before recording exit",
        home: "Home Dashboard",
        welcomeBack: "Operations Overview",
        dashboardSummary: "Real-time status of your fleet and team",
        activeEfficiency: "Active Efficiency",
        fleetReadiness: "Fleet Readiness",
        maintenanceAlerts: "Maintenance",
        fleetDistribution: "Fleet Distribution",
        topPerforming: "Top Drivers by Orders",
        recentActivity: "Recent Fleet Activity",
        footerTagline: "Manage your fleet with ease",
        copyright: "© 2026 Garage TFT. All rights reserved."
    }
};

// RTL Languages (Empty now)
const rtlLanguages = [];

// Current language
let currentLang = 'en';

// Function to get translation
function t(key) {
    return translations[currentLang][key] || key;
}

// Function to set language
function setLanguage(lang) {
    currentLang = 'en'; // Force English

    // Update document direction
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
    document.body.dir = 'ltr';

    // Update all translatable elements
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (translations['en'][key]) {
            el.textContent = translations['en'][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-placeholder]').forEach(el => {
        const key = el.dataset.placeholder;
        if (translations['en'][key]) {
            el.placeholder = translations['en'][key];
        }
    });

    // Save preference
    localStorage.setItem('garageAppLanguage', 'en');

    // Refresh drivers display
    if (typeof renderDrivers === 'function') {
        renderDrivers();
    }
}

// Initialize language
function initLanguage() {
    setLanguage('en');
}

// Get month name
function getMonthName(monthIndex) {
    const months = [
        t('january'), t('february'), t('march'), t('april'),
        t('may'), t('june'), t('july'), t('august'),
        t('september'), t('october'), t('november'), t('december')
    ];
    return months[monthIndex];
}

// Get weekday names
function getWeekdayNames() {
    return [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
}
