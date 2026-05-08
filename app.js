// Garage App - Main Application JavaScript

// Data Storage
let drivers = JSON.parse(localStorage.getItem('garageAppDrivers')) || [];
let bikes = JSON.parse(localStorage.getItem('garageAppBikes')) || [];
let currentDriverId = null;
let currentBikeId = null;
let currentBikeFilter = 'all';
let currentDriverFilter = 'all';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    renderDrivers();
    renderBikes();
    updateStatistics();
    setupEventListeners();

    // Restore saved view or default to drivers
    const savedView = localStorage.getItem('garageAppCurrentView') || 'drivers';
    showView(savedView);

    // Bike search listener
    const bikeSearchInput = document.getElementById('bikeSearchInput');
    if (bikeSearchInput) {
        bikeSearchInput.addEventListener('input', (e) => {
            renderBikes(e.target.value);
        });
    }

    // Add bike form
    const addBikeForm = document.getElementById('addBikeForm');
    if (addBikeForm) {
        addBikeForm.addEventListener('submit', handleAddBike);
    }

    const editBikeForm = document.getElementById('editBikeForm');
    if (editBikeForm) {
        editBikeForm.addEventListener('submit', handleEditBike);
    }
});

// Setup Event Listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderDrivers(e.target.value);
    });

    // Add driver form
    document.getElementById('addDriverForm').addEventListener('submit', handleAddDriver);

    // Movement form
    document.getElementById('movementForm').addEventListener('submit', handleRecordMovement);

    // Edit driver form
    document.getElementById('editDriverForm').addEventListener('submit', handleEditDriver);

    // Edit movement form
    document.getElementById('editMovementForm').addEventListener('submit', handleEditMovement);

    // Edit movement rating input
    const editMovementRatingInput = document.getElementById('editMovementRating');
    if (editMovementRatingInput) {
        editMovementRatingInput.addEventListener('input', updateEditMovementRatingDisplay);
    }

    // Movement rating input
    const movementRatingInput = document.getElementById('movementRating');
    if (movementRatingInput) {
        movementRatingInput.addEventListener('input', updateMovementRatingDisplay);
    }

    // Exit rating input
    const exitRatingInput = document.getElementById('exitRating');
    if (exitRatingInput) {
        exitRatingInput.addEventListener('input', updateExitRatingDisplay);
    }

    // Rating input
    const ratingInput = document.getElementById('rating');
    if (ratingInput) {
        ratingInput.addEventListener('input', updateRatingDisplay);
        // Initialize display
        updateRatingDisplay();
    }

    // Modals only close on close button click (not backdrop click)
    // Removed backdrop click closing for better UX

    // Scroll to top button visibility
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });
    }

    // Initialize datetime display
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

// Update DateTime Display
function updateDateTime() {
    const now = new Date();

    // Format time: HH:MM:SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    // Format date: dd/mm/yyyy
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateString = `${day}/${month}/${year}`;

    // Update DOM
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');

    if (timeElement) timeElement.textContent = timeString;
    if (dateElement) dateElement.textContent = dateString;
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Save drivers to localStorage
function saveDrivers() {
    localStorage.setItem('garageAppDrivers', JSON.stringify(drivers));
}

// Show Add Driver Modal
function showAddDriverModal() {
    document.getElementById('addDriverModal').classList.add('active');
    document.getElementById('driverName').focus();
    populateAvailableBikesDropdown();
}

// Close Add Driver Modal
function closeAddDriverModal() {
    document.getElementById('addDriverModal').classList.remove('active');
    document.getElementById('addDriverForm').reset();
}

// Handle Add Driver
function handleAddDriver(e) {
    e.preventDefault();

    const bikeNumber = document.getElementById('bikeNumber').value;
    if (!bikeNumber) {
        showNotification("Please select an available bike", "error");
        return;
    }

    const driverId = generateId();
    const driver = {
        id: driverId,
        name: document.getElementById('driverName').value,
        driverId: document.getElementById('driverId').value,
        phone: document.getElementById('phoneNumber').value,
        bikeNumber: bikeNumber,
        rating: parseInt(document.getElementById('rating').value) || 100,
        status: 'inside',
        totalOrders: 0,
        movements: [],
        createdAt: new Date().toISOString()
    };

    // Update Bike with Driver Assignment
    const bike = bikes.find(b => b.number === bikeNumber);
    if (bike) {
        bike.driverId = driverId;
        saveBikes();
    }

    drivers.push(driver);
    saveDrivers();
    renderDrivers();
    renderBikes();
    updateStatistics();
    closeAddDriverModal();
    showNotification(`${t('driverAdded')} - Bike ${bikeNumber} assigned to ${driver.name}`);
}

// Update Rating Display
function updateRatingDisplay() {
    const ratingInput = document.getElementById('rating');
    const ratingValue = document.getElementById('ratingValue');
    const ratingFill = document.getElementById('ratingFill');

    if (ratingInput && ratingValue && ratingFill) {
        const value = parseInt(ratingInput.value) || 50;
        ratingValue.textContent = value;
        ratingFill.style.width = value + '%';
    }
}

// Check Rating Status (Good >= 80, Warning < 80)
function getRatingStatus(rating) {
    return rating >= 80 ? 'good' : 'warning';
}

// Calculate Duration Automatically
function calculateMovementDuration() {
    const exitTimeInput = document.getElementById('exitTime');
    const entryTimeInput = document.getElementById('entryTime');
    const durationDisplay = document.getElementById('durationDisplay');
    const durationValue = document.getElementById('durationValue');

    const exitTime = exitTimeInput.value ? new Date(exitTimeInput.value) : null;
    const entryTime = entryTimeInput.value ? new Date(entryTimeInput.value) : null;

    // Reset display
    durationDisplay.classList.remove('calculated', 'error');

    if (!exitTime && !entryTime) {
        durationValue.textContent = '--';
        return;
    }

    if (exitTime && !entryTime) {
        durationValue.textContent = t('waitingEntry');
        durationDisplay.classList.add('calculated');
        return;
    }

    if (!exitTime && entryTime) {
        durationValue.textContent = t('enterExitTime') || 'Enter exit time';
        durationDisplay.classList.add('error');
        return;
    }

    // Both times are present
    const diffMs = entryTime - exitTime;

    if (diffMs < 0) {
        durationValue.textContent = t('invalidTime') || 'Invalid time';
        durationDisplay.classList.add('error');
        return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Format duration using translations
    let durationText = '';
    if (hours > 0) {
        const hourText = hours === 1 ? t('hour') : t('hours');
        const minuteText = minutes === 1 ? t('minute') : t('minutes');
        durationText = `${hours} ${hourText}${minutes > 0 ? ' ' + minutes + ' ' + minuteText : ''}`;
    } else if (minutes > 0) {
        const minuteText = minutes === 1 ? t('minute') : t('minutes');
        durationText = `${minutes} ${minuteText}`;
    } else {
        durationText = t('lessThanMinute');
    }

    durationValue.textContent = durationText;
    durationDisplay.classList.add('calculated');
}

// Update Movement Rating Display with Status
function updateMovementRatingDisplay() {
    const ratingInput = document.getElementById('movementRating');
    const ratingValue = document.getElementById('movementRatingValue');
    const ratingFill = document.getElementById('movementRatingFill');
    const ratingBar = document.querySelector('.rating-bar.small');
    const ratingAlert = document.getElementById('ratingAlert');

    if (ratingInput && ratingValue && ratingFill) {
        const value = parseInt(ratingInput.value) || 50;
        ratingValue.textContent = value;
        ratingFill.style.width = value + '%';

        // Update color based on rating
        const status = getRatingStatus(value);
        if (ratingBar) {
            ratingBar.classList.remove('good', 'warning');
            ratingBar.classList.add(status);
        }

        // Show/hide warning alert
        if (ratingAlert) {
            if (status === 'warning') {
                ratingAlert.classList.add('active');
            } else {
                ratingAlert.classList.remove('active');
            }
        }
    }
}

// Populate Movement Form with current driver rating
function populateMovementRating(driver) {
    const ratingInput = document.getElementById('movementRating');
    if (ratingInput) {
        ratingInput.value = driver.rating;
        updateMovementRatingDisplay();
    }
}

// Legacy function for backward compatibility
function updateRatingStars() {
    updateRatingDisplay();
}

// Render Drivers
function renderDrivers(searchTerm = '') {
    const grid = document.getElementById('driversGrid');
    const searchLower = searchTerm.toLowerCase().trim();

    const filteredDrivers = drivers.filter(driver => {
        // Filter by stat category
        if (currentDriverFilter === 'inside' && driver.status !== 'inside') return false;
        if (currentDriverFilter === 'outside' && driver.status !== 'outside') return false;

        const nameMatch = driver.name.toLowerCase().includes(searchLower);
        const bikeMatch = driver.bikeNumber.toLowerCase().includes(searchLower);
        const idMatch = driver.driverId.toLowerCase().includes(searchLower);
        return nameMatch || bikeMatch || idMatch;
    });

    if (filteredDrivers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-users-slash"></i>
                <h3>${t('noDrivers')}</h3>
                <p>${t('addDriverFirst')}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredDrivers.map(driver => {
        return `
            <div class="driver-card ${driver.status} ${driver.rating < 80 ? 'rating-warning' : ''}">
                <div class="driver-profile">
                    <div class="driver-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="driver-main-info">
                        <h3>${escapeHtml(driver.name)}</h3>
                        <div class="driver-status-inline">
                            <span class="status-badge ${driver.status}">
                                <i class="fas fa-${driver.status === 'inside' ? 'warehouse' : 'motorcycle'}"></i>
                                ${driver.status === 'inside' ? t('statusInside') : t('statusOutside')}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="driver-stats-minimal">
                    <div class="stat-item">
                        <span class="stat-label">${t('bikeNumber')}</span>
                        <span class="stat-value ${driver.bikeNumber === 'Waiting' ? 'waiting-pulse' : ''}">${escapeHtml(driver.bikeNumber)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">${t('driverId')}</span>
                        <span class="stat-value">${escapeHtml(driver.driverId)}</span>
                    </div>
                </div>

                <div class="driver-rating-section">
                    <div class="rating-header">
                        <span class="rating-label">${t('rating')}</span>
                        <span class="rating-percentage">${driver.rating}%</span>
                    </div>
                    <div class="rating-progress">
                        <div class="rating-fill ${driver.rating >= 80 ? 'good' : 'warning'}" style="width: ${driver.rating}%"></div>
                    </div>
                </div>

                <div class="driver-card-footer" onclick="event.stopPropagation()">
                    <button class="btn-primary-subtle" onclick="showDriverDashboard('${driver.id}')">
                        <i class="fas fa-external-link-alt"></i>
                        ${t('dashboard')}
                    </button>
                    <button class="btn-danger-subtle" onclick="deleteDriver('${driver.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Render Stars HTML
function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show Driver Dashboard
function showDriverDashboard(driverId) {
    currentDriverId = driverId;
    const driver = drivers.find(d => d.id === driverId);

    if (!driver) return;

    // Reset current movement when switching drivers
    currentMovement = null;

    // Update dashboard info
    document.getElementById('dashboardDriverName').textContent = driver.name;
    const bikeNumberEl = document.getElementById('dashboardBikeNumber');
    bikeNumberEl.textContent = `${t('bikeNumber')}: ${driver.bikeNumber}`;

    if (driver.bikeNumber === 'Waiting') {
        bikeNumberEl.classList.add('waiting-pulse');
    } else {
        bikeNumberEl.classList.remove('waiting-pulse');
    }
    document.getElementById('dashboardDriverId').textContent = driver.driverId;
    document.getElementById('dashboardPhone').textContent = driver.phone;
    document.getElementById('dashboardRating').textContent = `${driver.rating}/100`;

    // Update Rating Icon
    updateRatingIcon(driver.rating);

    // Populate edit form
    populateEditForm(driver);

    // Populate movement rating with current driver rating
    populateMovementRating(driver);

    // Update rating status display
    updateMovementRatingDisplay();

    // Update status toggle
    updateStatusToggle(driver.status);

    // Reset movement form
    resetMovementForm();
    hideEntryDetails();
    hideExitDetails();

    // Render movement history
    renderMovementHistory(driver);

    // Show modal
    document.getElementById('driverDashboardModal').classList.add('active');
}

// Close Dashboard Modal
function closeDashboardModal() {
    document.getElementById('driverDashboardModal').classList.remove('active');
    currentDriverId = null;
}

// Update Status Toggle
function updateStatusToggle(status) {
    const toggle = document.getElementById('statusToggle');
    const text = document.getElementById('statusText');
    const icon = toggle.querySelector('i');

    if (status === 'inside') {
        toggle.classList.add('active');
        icon.className = 'fas fa-warehouse';
        text.textContent = t('statusInside');
        toggle.style.background = 'rgba(16, 185, 129, 0.3)';
        toggle.style.borderColor = '#10b981';
    } else {
        toggle.classList.remove('active');
        icon.className = 'fas fa-motorcycle';
        text.textContent = t('statusOutside');
        toggle.style.background = 'rgba(245, 158, 11, 0.3)';
        toggle.style.borderColor = '#f59e0b';
    }
}

// Toggle Driver Status
function toggleDriverStatus() {
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    if (driver.bikeNumber === 'Waiting') {
        showNotification("Cannot record movement: Driver is waiting for a bike", "error");
        return;
    }

    driver.status = driver.status === 'inside' ? 'outside' : 'inside';

    // Add automatic movement record
    const now = new Date();
    const movement = {
        id: generateId(),
        date: now.toISOString().split('T')[0],
        exitTime: driver.status === 'outside' ? now.toISOString() : null,
        entryTime: driver.status === 'inside' ? now.toISOString() : null,
        orders: 0,
        timestamp: now.toISOString()
    };

    driver.movements.unshift(movement);

    saveDrivers();
    updateStatusToggle(driver.status);
    renderDrivers();
    updateStatistics();
    renderMovementHistory(driver);

    showNotification(t('movementRecorded'));
}

// Global variable to track current movement
let currentMovement = null;

// Record Exit Function
function recordExit() {
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    if (driver.bikeNumber === 'Waiting') {
        showNotification("Cannot record exit: No bike assigned", "error");
        return;
    }

    const now = new Date();

    // Check if driver is already inside (status: inside) - create pending exit
    if (driver.status === 'inside') {
        // Create a pending movement with exit time only
        currentMovement = {
            id: generateId(),
            date: now.toISOString().split('T')[0],
            exitTime: now.toISOString(),
            entryTime: null,
            orders: 0,
            rating: driver.rating,
            timestamp: now.toISOString()
        };

        // Add the pending movement to driver's movements
        driver.movements.unshift(currentMovement);

        // Update driver status
        driver.status = 'outside';

        // Update UI
        updateLastRecordedTime(now);
        updateButtonStates('exit');
        hideEntryDetails();
        showExitDetails();

        saveDrivers();
        renderDrivers();
        updateStatistics();
        updateStatusToggle(driver.status);
        renderMovementHistory(driver);

        showNotification(t('exitRecorded'));
        return;
    }

    // For drivers outside, check if there's an entry without exit
    if (!currentMovement || !currentMovement.entryTime) {
        showNotification(t('entryRequiredFirst'), 'error');
        return;
    }

    // Update current movement with exit time
    currentMovement.exitTime = now.toISOString();

    // Add the completed movement to driver's movements
    driver.movements.unshift(currentMovement);

    // Update driver status
    driver.status = 'outside';

    // Update UI
    updateLastRecordedTime(now);
    updateButtonStates('exit');
    hideEntryDetails();

    // Reset current movement
    currentMovement = null;

    saveDrivers();
    renderDrivers();
    updateStatistics();
    updateStatusToggle(driver.status);
    renderMovementHistory(driver);

    showNotification(t('exitRecorded'));
}

// Record Entry Function
function recordEntry() {
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    if (driver.bikeNumber === 'Waiting') {
        showNotification("Cannot record entry: No bike assigned", "error");
        return;
    }

    const now = new Date();

    // Check if there's a pending exit movement (exit without entry)
    const pendingExitMovement = driver.movements.find(m => m.exitTime && !m.entryTime);

    if (pendingExitMovement) {
        // Complete the pending movement with entry time
        pendingExitMovement.entryTime = now.toISOString();
        currentMovement = pendingExitMovement;

        // Update driver status
        driver.status = 'inside';

        // Update UI
        updateLastRecordedTime(now);
        updateButtonStates('entry');
        showEntryDetails();

        saveDrivers();
        renderDrivers();
        updateStatistics();
        updateStatusToggle(driver.status);
        renderMovementHistory(driver);

        showNotification(t('entryRecorded'));
        return;
    }

    // Create new movement if no pending exit
    if (!currentMovement) {
        currentMovement = {
            id: generateId(),
            date: now.toISOString().split('T')[0],
            exitTime: null,
            entryTime: now.toISOString(),
            orders: 0,
            rating: driver.rating,
            timestamp: now.toISOString()
        };

        // Add to movements
        driver.movements.unshift(currentMovement);
    } else {
        currentMovement.entryTime = now.toISOString();
    }

    // Update driver status
    driver.status = 'inside';

    // Update UI
    updateLastRecordedTime(now);
    updateButtonStates('entry');
    showEntryDetails();

    saveDrivers();
    renderDrivers();
    updateStatistics();
    updateStatusToggle(driver.status);
    renderMovementHistory(driver);

    showNotification(t('entryRecorded'));
}

// Save Entry Details Function
function saveEntryDetails() {
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver || !currentMovement) return;

    const ordersCount = parseInt(document.getElementById('ordersCount').value) || 0;
    const newRating = parseInt(document.getElementById('movementRating').value) || driver.rating;
    const manualTimeValue = document.getElementById('manualEntryTime').value;
    const entryTime = manualTimeValue ? new Date(manualTimeValue).toISOString() : new Date().toISOString();

    // Update movement with details
    currentMovement.entryTime = entryTime;
    currentMovement.orders = ordersCount;
    currentMovement.rating = newRating;

    // Update driver's total orders and rating
    driver.totalOrders += ordersCount;
    driver.rating = newRating;

    // Reset current movement
    currentMovement = null;

    // Update UI
    hideEntryDetails();
    resetMovementForm();

    saveDrivers();
    renderDrivers();
    updateStatistics();
    updateStatusToggle(driver.status);
    renderMovementHistory(driver);

    showNotification(t('movementRecorded'));
}

// Update Last Recorded Time Display
function updateLastRecordedTime(time) {
    const timeValue = document.getElementById('lastTimeValue');
    const locale = getCurrentLocale();
    const timeStr = time.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    timeValue.textContent = timeStr;
}

// Update Button States
function updateButtonStates(lastAction) {
    const exitBtn = document.getElementById('recordExitBtn');
    const entryBtn = document.getElementById('recordEntryBtn');
    const driver = drivers.find(d => d.id === currentDriverId);

    if (!driver) return;

    // Exit button should be enabled when:
    // 1. Driver is inside garage (can exit immediately)
    // 2. There's an entry without exit (current movement with entry)
    const driverIsInside = driver.status === 'inside';
    const hasEntryWithoutExit = currentMovement && currentMovement.entryTime && !currentMovement.exitTime;

    if (lastAction === 'exit') {
        exitBtn.disabled = true;
        entryBtn.disabled = false;
    } else if (lastAction === 'entry') {
        exitBtn.disabled = false;
        entryBtn.disabled = true;
    } else {
        exitBtn.disabled = !(driverIsInside || hasEntryWithoutExit);
        entryBtn.disabled = false;
    }
}

// Show Entry Details Section
function showEntryDetails() {
    const section = document.getElementById('entryDetailsSection');
    section.style.display = 'block';

    // Pre-fill manual time with current time
    const now = new Date();
    document.getElementById('manualEntryTime').value = formatDateTimeForInput(now);

    // Focus on orders input
    setTimeout(() => {
        document.getElementById('ordersCount').focus();
    }, 100);
}

// Hide Entry Details Section
function hideEntryDetails() {
    const section = document.getElementById('entryDetailsSection');
    section.style.display = 'none';
}

// Show Exit Details Section
function showExitDetails() {
    const section = document.getElementById('exitDetailsSection');
    section.style.display = 'block';

    // Pre-fill manual time with current time
    const now = new Date();
    document.getElementById('manualExitTime').value = formatDateTimeForInput(now);

    // Focus on exit rating input
    setTimeout(() => {
        document.getElementById('exitRating').focus();
    }, 100);
}

// Hide Exit Details Section
function hideExitDetails() {
    const section = document.getElementById('exitDetailsSection');
    section.style.display = 'none';
}

// Save Exit Details Function
function saveExitDetails() {
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver || !currentMovement) return;

    const exitRating = parseInt(document.getElementById('exitRating').value) || driver.rating;
    const manualTimeValue = document.getElementById('manualExitTime').value;
    const exitTime = manualTimeValue ? new Date(manualTimeValue).toISOString() : new Date().toISOString();

    // Update movement with exit rating (store as exitRating)
    currentMovement.exitTime = exitTime;
    currentMovement.exitRating = exitRating;

    // Update driver rating to exit rating
    driver.rating = exitRating;

    // Reset current movement
    currentMovement = null;

    // Update UI
    hideExitDetails();
    resetMovementForm();

    saveDrivers();
    renderDrivers();
    updateStatistics();
    updateStatusToggle(driver.status);
    renderMovementHistory(driver);

    showNotification(t('exitRecorded'));
}

// Reset Movement Form
function resetMovementForm() {
    document.getElementById('ordersCount').value = '0';
    const driver = drivers.find(d => d.id === currentDriverId);
    if (driver) {
        populateMovementRating(driver);
        // Reset exit rating to driver rating
        const exitRatingInput = document.getElementById('exitRating');
        if (exitRatingInput) {
            exitRatingInput.value = driver.rating;
            updateExitRatingDisplay();
        }
    }
    updateButtonStates();
    document.getElementById('lastTimeValue').textContent = '--:--';
}

// Handle Record Movement (Legacy function for compatibility)
function handleRecordMovement(e) {
    e.preventDefault();
    // This function is no longer used but kept for compatibility
    console.log('Legacy handleRecordMovement called - use recordExit/recordEntry instead');
}

// Render Movement History - Complete Movements in Single Cards
function renderMovementHistory(driver) {
    const tbody = document.getElementById('movementHistory');

    if (driver.movements.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="6">
                    <i class="fas fa-clipboard-list"></i>
                    <p>${t('noMovements') || 'لا توجد حركات مسجلة'}</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = driver.movements.slice(0, 50).map((movement, index) => {
        const exitDate = movement.exitTime ? new Date(movement.exitTime) : null;
        const entryDate = movement.entryTime ? new Date(movement.entryTime) : null;

        // Get current locale
        const locale = getCurrentLocale();

        // Format date
        const dateObj = new Date(movement.date);
        const dateDisplay = dateObj.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Orders display
        const ordersCount = movement.orders || 0;
        const ordersDisplay = ordersCount > 0 ?
            `<span class="orders-count">${ordersCount}</span>` :
            '<span class="orders-count zero">-</span>';

        // Rating display - show both exit and entry ratings if available
        let ratingDisplay = '';

        if (exitDate && entryDate) {
            // Complete movement - show both ratings
            const exitRating = movement.exitRating || driver.rating;
            const entryRating = movement.rating || driver.rating;
            const exitStatus = exitRating >= 80 ? 'good' : 'warning';
            const entryStatus = entryRating >= 80 ? 'good' : 'warning';

            ratingDisplay = `
                <div class="rating-pill-container">
                    <div class="rating-pill exit ${exitStatus}">
                        <i class="fas fa-arrow-up"></i>
                        <span>${exitRating}</span>
                    </div>
                    <div class="rating-pill-connector">
                        <i class="fas fa-chevron-left"></i>
                    </div>
                    <div class="rating-pill entry ${entryStatus}">
                        <i class="fas fa-arrow-down"></i>
                        <span>${entryRating}</span>
                    </div>
                </div>
            `;
        } else if (exitDate && !entryDate) {
            // Only exit - show exit rating
            const exitRating = movement.exitRating || driver.rating;
            const exitStatus = exitRating >= 80 ? 'good' : 'warning';

            ratingDisplay = `
                <div class="rating-pill exit ${exitStatus}">
                    <i class="fas fa-arrow-up"></i>
                    <span>${exitRating}</span>
                </div>
            `;
        } else if (entryDate && !exitDate) {
            // Only entry - show entry rating
            const entryRating = movement.rating || driver.rating;
            const entryStatus = entryRating >= 80 ? 'good' : 'warning';

            ratingDisplay = `
                <div class="rating-pill entry ${entryStatus}">
                    <i class="fas fa-arrow-down"></i>
                    <span>${entryRating}</span>
                </div>
            `;
        } else {
            // No times recorded - show driver's current rating
            const rating = driver.rating;
            const ratingStatus = rating >= 80 ? 'good' : 'warning';

            ratingDisplay = `
                <div class="rating-pill ${ratingStatus}">
                    <i class="fas fa-star"></i>
                    <span>${rating}</span>
                </div>
            `;
        }

        // Calculate duration
        const duration = calculateDuration(movement.exitTime, movement.entryTime);
        const durationDisplay = duration !== '-' ?
            `<span class="duration-badge">
                <i class="fas fa-clock"></i>
                ${duration}
            </span>` :
            '<span class="duration-badge pending">--</span>';

        // Create movement display based on available times
        let movementDisplay = '';

        if (exitDate && entryDate) {
            // Complete movement - show both exit and entry times
            const exitTimeStr = exitDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            const entryTimeStr = entryDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

            movementDisplay = `
                <div class="complete-movement">
                    <div class="movement-times">
                        <div class="time-pair">
                            <div class="time-item exit-time">
                                <i class="fas fa-sign-out-alt"></i>
                                <span class="time-label">${t('exit') || 'خروج'}</span>
                                <span class="time-value">${exitTimeStr}</span>
                            </div>
                            <div class="time-arrow">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                            <div class="time-item entry-time">
                                <i class="fas fa-sign-in-alt"></i>
                                <span class="time-label">${t('entry') || 'دخول'}</span>
                                <span class="time-value">${entryTimeStr}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (exitDate && !entryDate) {
            // Only exit - ongoing movement
            const exitTimeStr = exitDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

            movementDisplay = `
                <div class="ongoing-movement">
                    <div class="movement-times">
                        <div class="time-pair">
                            <div class="time-item exit-time">
                                <i class="fas fa-sign-out-alt"></i>
                                <span class="time-label">${t('exit') || 'خروج'}</span>
                                <span class="time-value">${exitTimeStr}</span>
                            </div>
                            <div class="time-arrow pending">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="time-item entry-time pending">
                                <i class="fas fa-sign-in-alt"></i>
                                <span class="time-label">${t('entry') || 'دخول'}</span>
                                <span class="time-value">--:--</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (entryDate && !exitDate) {
            // Only entry - incomplete movement
            const entryTimeStr = entryDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

            movementDisplay = `
                <div class="incomplete-movement">
                    <div class="movement-times">
                        <div class="time-pair">
                            <div class="time-item exit-time pending">
                                <i class="fas fa-sign-out-alt"></i>
                                <span class="time-label">${t('exit') || 'خروج'}</span>
                                <span class="time-value">--:--</span>
                            </div>
                            <div class="time-arrow pending">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="time-item entry-time">
                                <i class="fas fa-sign-in-alt"></i>
                                <span class="time-label">${t('entry') || 'دخول'}</span>
                                <span class="time-value">${entryTimeStr}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // No times recorded
            movementDisplay = `
                <div class="empty-movement">
                    <div class="no-time-recorded">
                        <i class="fas fa-question-circle"></i>
                        <span>${t('noTimeRecorded') || 'لم يُسجل وقت'}</span>
                    </div>
                </div>
            `;
        }

        // Row status class
        const rowClass = movement.entryTime && movement.exitTime ? 'completed' :
            movement.exitTime && !movement.entryTime ? 'ongoing' :
                movement.entryTime && !movement.exitTime ? 'incomplete' : 'empty';

        return `
            <tr data-movement-id="${movement.id}" class="${rowClass}">
                <td class="date-cell">${dateDisplay}</td>
                <td class="movement-cell">${movementDisplay}</td>
                <td class="orders-cell">${ordersDisplay}</td>
                <td class="rating-cell">${ratingDisplay}</td>
                <td class="duration-cell">${durationDisplay}</td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="btn-icon edit" onclick="editMovement('${movement.id}')" title="${t('edit') || 'تعديل'}">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteMovement('${movement.id}')" title="${t('delete') || 'حذف'}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update Exit Rating Display
function updateExitRatingDisplay() {
    const ratingInput = document.getElementById('exitRating');
    const ratingValue = document.getElementById('exitRatingValue');
    const ratingFill = document.getElementById('exitRatingFill');
    const ratingBar = document.querySelector('#exitDetailsSection .rating-bar.small');
    const ratingAlert = document.getElementById('exitRatingAlert');

    if (ratingInput && ratingValue && ratingFill) {
        const value = parseInt(ratingInput.value) || 50;
        ratingValue.textContent = value;
        ratingFill.style.width = value + '%';

        // Update color based on rating
        const status = getRatingStatus(value);
        if (ratingBar) {
            ratingBar.classList.remove('good', 'warning');
            ratingBar.classList.add(status);
        }

        // Show/hide warning alert
        if (ratingAlert) {
            if (status === 'warning') {
                ratingAlert.classList.add('active');
            } else {
                ratingAlert.classList.remove('active');
            }
        }
    }
}

// Update Edit Movement Rating Display
function updateEditMovementRatingDisplay() {
    const ratingInput = document.getElementById('editMovementRating');
    const ratingValue = document.getElementById('editMovementRatingValue');
    const ratingFill = document.getElementById('editMovementRatingFill');
    const ratingBar = document.querySelector('#editMovementModal .rating-bar.small');

    if (ratingInput && ratingValue && ratingFill) {
        const value = parseInt(ratingInput.value) || 50;
        ratingValue.textContent = value;
        ratingFill.style.width = value + '%';

        // Update color based on rating
        const status = getRatingStatus(value);
        if (ratingBar) {
            ratingBar.classList.remove('good', 'warning');
            ratingBar.classList.add(status);
        }
    }
}

// Edit Movement
function editMovement(movementId) {
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    const movement = driver.movements.find(m => m.id === movementId);
    if (!movement) return;

    // Populate edit form
    document.getElementById('editMovementId').value = movementId;
    document.getElementById('editMovementDate').value = movement.date;
    document.getElementById('editMovementExitTime').value = movement.exitTime ? movement.exitTime.slice(0, 16) : '';
    document.getElementById('editMovementEntryTime').value = movement.entryTime ? movement.entryTime.slice(0, 16) : '';
    document.getElementById('editMovementOrders').value = movement.orders || 0;
    document.getElementById('editMovementRating').value = movement.rating || driver.rating;

    updateEditMovementRatingDisplay();

    // Show modal
    document.getElementById('editMovementModal').classList.add('active');
}

// Close Edit Movement Modal
function closeEditMovementModal() {
    document.getElementById('editMovementModal').classList.remove('active');
    document.getElementById('editMovementForm').reset();
}

// Handle Edit Movement
function handleEditMovement(e) {
    e.preventDefault();

    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    const movementId = document.getElementById('editMovementId').value;
    const movement = driver.movements.find(m => m.id === movementId);
    if (!movement) return;

    // Calculate old orders difference
    const oldOrders = movement.orders || 0;

    // Update movement data
    movement.date = document.getElementById('editMovementDate').value;
    movement.exitTime = document.getElementById('editMovementExitTime').value ?
        new Date(document.getElementById('editMovementExitTime').value).toISOString() : null;
    movement.entryTime = document.getElementById('editMovementEntryTime').value ?
        new Date(document.getElementById('editMovementEntryTime').value).toISOString() : null;

    const newOrders = parseInt(document.getElementById('editMovementOrders').value) || 0;
    movement.orders = newOrders;
    movement.rating = parseInt(document.getElementById('editMovementRating').value) || driver.rating;

    // Update driver's total orders
    driver.totalOrders = driver.totalOrders - oldOrders + newOrders;

    // Update driver rating if this is the most recent completed movement
    if (movement.entryTime && driver.movements[0].id === movementId) {
        driver.rating = movement.rating;
    }

    saveDrivers();
    renderDrivers();
    updateStatistics();
    renderMovementHistory(driver);
    closeEditMovementModal();

    showNotification(t('movementUpdated'));
}

// Delete Movement
function deleteMovement(movementId) {
    if (!confirm(t('confirmDeleteMovement'))) return;

    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    const movementIndex = driver.movements.findIndex(m => m.id === movementId);
    if (movementIndex === -1) return;

    const movement = driver.movements[movementIndex];

    // Subtract orders from total
    driver.totalOrders -= (movement.orders || 0);
    if (driver.totalOrders < 0) driver.totalOrders = 0;

    // Remove movement
    driver.movements.splice(movementIndex, 1);

    // Update driver rating to the most recent movement's rating if available
    if (driver.movements.length > 0 && driver.movements[0].rating) {
        driver.rating = driver.movements[0].rating;
    }

    saveDrivers();
    renderDrivers();
    updateStatistics();
    renderMovementHistory(driver);

    showNotification(t('movementDeleted'));
}

// Get current locale based on selected language
function getCurrentLocale() {
    return currentLang === 'ar' ? 'ar-SA' : currentLang === 'el' ? 'el-GR' : 'en-US';
}

// Show Edit Driver Modal
function openEditDriverModal() {
    document.getElementById('editDriverModal').classList.add('active');
}

// Close Edit Driver Modal
function closeEditDriverModal() {
    document.getElementById('editDriverModal').classList.remove('active');
}

// Update Rating Icon Logic
function updateRatingIcon(rating) {
    const iconElement = document.getElementById('dashboardRatingIcon');
    if (!iconElement) return;

    let iconClass = 'fas fa-thumbs-up';
    let statusClass = '';

    if (rating >= 90) {
        statusClass = 'rating-gold';
    } else if (rating >= 80) {
        statusClass = 'rating-green';
    } else {
        statusClass = 'rating-red';
        iconClass = 'fas fa-thumbs-down'; // Optional: thumbs down for low rating
    }

    iconElement.innerHTML = `<i class="${iconClass}"></i>`;
    iconElement.className = `rating-status-icon ${statusClass}`;
}

// Format Date Time
function formatDateTime(date) {
    return date.toLocaleString(getCurrentLocale(), {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format Date for Input (datetime-local)
function formatDateTimeForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Calculate Duration
function calculateDuration(exitTime, entryTime) {
    if (!exitTime || !entryTime) return '-';

    const exit = new Date(exitTime);
    const entry = new Date(entryTime);
    const diffMs = entry - exit;

    if (diffMs < 0) return '-';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// Update Statistics
function updateStatistics() {
    // Driver Stats
    const total = drivers.length;
    const outside = drivers.filter(d => d.status === 'outside').length;
    const inside = drivers.filter(d => d.status === 'inside').length;
    const totalOrders = drivers.reduce((sum, d) => sum + (parseInt(d.totalOrders) || 0), 0);

    // Bike Stats
    const totalBikesCount = bikes.length;
    const activeBikesCount = bikes.filter(b => b.status === 'active').length;
    const brokenBikesCount = bikes.filter(b => b.status === 'maintenance' || b.status === 'outOfService').length;
    const withDriverCount = bikes.filter(b => b.driverId && b.driverId !== "").length;
    const withoutDriverCount = bikes.filter(b => !b.driverId || b.driverId === "").length;

    // Animate numbers
    animateNumber('totalDrivers', total);
    animateNumber('outsideDrivers', outside);
    animateNumber('insideDrivers', inside);
    animateNumber('totalOrders', totalOrders);

    // Animate Bike numbers if elements exist
    if (document.getElementById('totalBikesCount')) animateNumber('totalBikesCount', totalBikesCount);
    if (document.getElementById('activeBikesCount')) animateNumber('activeBikesCount', activeBikesCount);
    if (document.getElementById('brokenBikesCount')) animateNumber('brokenBikesCount', brokenBikesCount);
    if (document.getElementById('withDriverCount')) animateNumber('withDriverCount', withDriverCount);
    if (document.getElementById('withoutDriverCount')) animateNumber('withoutDriverCount', withoutDriverCount);

    // Update Home Dashboard if visible
    const homeView = document.getElementById('homeView');
    if (homeView && homeView.classList.contains('active')) {
        renderHomeDashboard();
    }
}

// Animate Number
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = parseInt(element.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startValue + (targetValue - startValue) * easeProgress);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Delete Driver
function deleteDriver(driverId) {
    if (!confirm(t('confirmDelete'))) return;

    // Release assigned bike
    const bike = bikes.find(b => b.driverId === driverId);
    if (bike) {
        bike.driverId = "";
        saveBikes();
    }

    drivers = drivers.filter(d => d.id !== driverId);
    saveDrivers();
    renderDrivers();
    renderBikes(); // Refresh bikes view
    updateStatistics();
    showNotification(t('driverDeleted'));
}

// Language Dropdown Functions
function toggleLanguageDropdown() {
    const menu = document.getElementById('langDropdownMenu');
    const btn = document.getElementById('langDropdownBtn');
    menu.classList.toggle('active');
    btn.classList.toggle('active');
}

function closeLanguageDropdown() {
    const menu = document.getElementById('langDropdownMenu');
    const btn = document.getElementById('langDropdownBtn');
    menu.classList.remove('active');
    btn.classList.remove('active');
}

function selectLanguage(lang) {
    setLanguage(lang);
    updateLanguageDropdownUI();
    closeLanguageDropdown();
}

function updateLanguageDropdownUI() {
    const flag = document.getElementById('currentFlag');
    const name = document.getElementById('currentLangName');

    const langData = {
        ar: { flag: '🇸🇦', name: 'العربية' },
        en: { flag: '🇬🇧', name: 'English' },
        el: { flag: '🇬🇷', name: 'Ελληνικά' }
    };

    if (flag && name) {
        flag.textContent = langData[currentLang].flag;
        name.textContent = langData[currentLang].name;
    }

    // Update active state in dropdown
    document.querySelectorAll('.lang-option').forEach(option => {
        option.classList.toggle('active', option.dataset.lang === currentLang);
    });
}



// Populate Edit Form
function populateEditForm(driver) {
    document.getElementById('editDriverName').value = driver.name;
    document.getElementById('editDriverId').value = driver.driverId;
    document.getElementById('editPhoneNumber').value = driver.phone;
    document.getElementById('editDriverBikeNumber').value = driver.bikeNumber;

    // Initialize Bike Dropdown
    populateEditAvailableBikesDropdown(driver.bikeNumber);
}

// Handle Edit Driver
function handleEditDriver(e) {
    e.preventDefault();

    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    const oldBikeNumber = driver.bikeNumber;
    const newBikeNumber = document.getElementById('editDriverBikeNumber').value;

    // Update driver data
    driver.name = document.getElementById('editDriverName').value;
    driver.driverId = document.getElementById('editDriverId').value;
    driver.phone = document.getElementById('editPhoneNumber').value;
    driver.bikeNumber = newBikeNumber;

    // Handle Bike Reassignment
    if (oldBikeNumber !== newBikeNumber) {
        // Unlink old bike from this driver
        const oldBike = bikes.find(b => b.number === oldBikeNumber);
        if (oldBike) oldBike.driverId = "";

        // Link new bike to this driver
        const newBike = bikes.find(b => b.number === newBikeNumber);
        if (newBike) newBike.driverId = driver.id;

        saveBikes();
    }

    saveDrivers();
    renderDrivers();
    renderBikes();
    updateStatistics();

    // Update dashboard display
    document.getElementById('dashboardDriverName').textContent = driver.name;
    const bikeNumberEl = document.getElementById('dashboardBikeNumber');
    bikeNumberEl.textContent = `${t('bikeNumber')}: ${driver.bikeNumber}`;

    // Update Waiting pulse effect in dashboard live
    if (driver.bikeNumber === 'Waiting') {
        bikeNumberEl.classList.add('waiting-pulse');
    } else {
        bikeNumberEl.classList.remove('waiting-pulse');
    }

    document.getElementById('dashboardDriverId').textContent = driver.driverId;
    document.getElementById('dashboardPhone').textContent = driver.phone;

    closeEditDriverModal();
    showNotification(t('driverUpdated'));
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const text = document.getElementById('notificationText');
    const icon = notification.querySelector('i');

    text.textContent = message;

    if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
        icon.style.color = 'var(--danger-color)';
    } else {
        icon.className = 'fas fa-check-circle';
        icon.style.color = 'var(--success-color)';
    }

    notification.classList.add('active');

    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// Sample Data for Demo
function loadSampleData() {
    if (drivers.length === 0) {
        const sampleDrivers = [
            {
                id: generateId(),
                name: 'أحمد محمد',
                driverId: '123456789',
                phone: '0501234567',
                bikeNumber: 'ABC123',
                rating: 95,
                status: 'inside',
                totalOrders: 45,
                movements: [
                    {
                        id: generateId(),
                        date: new Date().toISOString().split('T')[0],
                        exitTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                        entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        orders: 8,
                        timestamp: new Date().toISOString()
                    },
                    {
                        id: generateId(),
                        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                        exitTime: new Date(Date.now() - 86400000 - 6 * 60 * 60 * 1000).toISOString(),
                        entryTime: new Date(Date.now() - 86400000 - 2 * 60 * 60 * 1000).toISOString(),
                        orders: 12,
                        timestamp: new Date(Date.now() - 86400000).toISOString()
                    }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'خالد العلي',
                driverId: '987654321',
                phone: '0559876543',
                bikeNumber: 'XYZ789',
                rating: 80,
                status: 'outside',
                totalOrders: 32,
                movements: [
                    {
                        id: generateId(),
                        date: new Date().toISOString().split('T')[0],
                        exitTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                        entryTime: null,
                        orders: 0,
                        timestamp: new Date().toISOString()
                    }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'محمد أحمد',
                driverId: '456789123',
                phone: '0567891234',
                bikeNumber: 'DEF456',
                rating: 95,
                status: 'inside',
                totalOrders: 67,
                movements: [
                    {
                        id: generateId(),
                        date: new Date().toISOString().split('T')[0],
                        exitTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                        entryTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                        orders: 15,
                        timestamp: new Date().toISOString()
                    },
                    {
                        id: generateId(),
                        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                        exitTime: new Date(Date.now() - 86400000 - 8 * 60 * 60 * 1000).toISOString(),
                        entryTime: new Date(Date.now() - 86400000 - 3 * 60 * 60 * 1000).toISOString(),
                        orders: 18,
                        timestamp: new Date(Date.now() - 86400000).toISOString()
                    },
                    {
                        id: generateId(),
                        date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
                        exitTime: new Date(Date.now() - 2 * 86400000 - 7 * 60 * 60 * 1000).toISOString(),
                        entryTime: new Date(Date.now() - 2 * 86400000 - 2 * 60 * 60 * 1000).toISOString(),
                        orders: 22,
                        timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
                    }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'عمر حسن',
                driverId: '789123456',
                phone: '0571234567',
                bikeNumber: 'GHI321',
                rating: 65,
                status: 'outside',
                totalOrders: 28,
                movements: [
                    {
                        id: generateId(),
                        date: new Date().toISOString().split('T')[0],
                        exitTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        entryTime: null,
                        orders: 0,
                        timestamp: new Date().toISOString()
                    }
                ],
                createdAt: new Date().toISOString()
            }
        ];

        drivers = sampleDrivers;
        saveDrivers();
        renderDrivers();
        updateStatistics();
    }
}

// Load sample data on first visit
if (localStorage.getItem('garageAppVisited') === null) {
    loadSampleData();
    localStorage.setItem('garageAppVisited', 'true');
}

// ===== Reports System Logic =====

// Show Monthly Report Section
function showMonthlyReport() {
    const section = document.getElementById("reportSection");
    section.style.display = "block";

    // Initialize Month Selector
    populateMonthSelector();

    // Generate Initial Report
    generateReport();

    // Scroll to section
    section.scrollIntoView({ behavior: "smooth" });
}

// Hide Report Section
function hideReport() {
    document.getElementById("reportSection").style.display = "none";
}

// Populate Month Selector
function populateMonthSelector() {
    const select = document.getElementById("reportMonthSelect");
    select.innerHTML = "";

    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    // Get all unique months from movements
    const months = new Set();
    driver.movements.forEach(m => {
        const date = new Date(m.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        months.add(monthYear);
    });

    // If no movements, add current month
    if (months.size === 0) {
        const now = new Date();
        months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    }

    const sortedMonths = Array.from(months).sort().reverse();

    sortedMonths.forEach(my => {
        const [year, month] = my.split("-");
        const date = new Date(year, month - 1);
        const label = date.toLocaleDateString(getCurrentLocale(), { month: "long", year: "numeric" });
        const option = document.createElement("option");
        option.value = my;
        option.textContent = label;
        select.appendChild(option);
    });
}

// Generate Monthly Report
function generateReport() {
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    const monthYear = document.getElementById("reportMonthSelect").value;
    if (!monthYear) return;

    const [year, month] = monthYear.split("-").map(Number);

    // Filter movements for selected month
    const monthlyMovements = driver.movements.filter(m => {
        const d = new Date(m.date);
        return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    // Calculate Stats
    const totalOrders = monthlyMovements.reduce((sum, m) => sum + (m.orders || 0), 0);
    const avgRating = monthlyMovements.length > 0 ?
        Math.round(monthlyMovements.reduce((sum, m) => sum + (m.rating || driver.rating), 0) / monthlyMovements.length) :
        driver.rating;
    const totalExits = monthlyMovements.filter(m => m.exitTime).length;

    // Calculate total duration
    let totalMinutes = 0;
    monthlyMovements.forEach(m => {
        if (m.exitTime && m.entryTime) {
            const diff = new Date(m.entryTime) - new Date(m.exitTime);
            if (diff > 0) totalMinutes += Math.floor(diff / 60000);
        }
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const durationStr = `${hours}h ${mins}m`;

    // Render Report Content
    const container = document.getElementById("reportContent");
    container.innerHTML = `
        <div class="report-grid">
            <div class="report-stat-card">
                <span class="label">${t("totalOrders") || "?????? ???????"}</span>
                <span class="value">${totalOrders}</span>
            </div>
            <div class="report-stat-card">
                <span class="label">${t("averageRating") || "????? ???????"}</span>
                <span class="value">${avgRating}%</span>
            </div>
            <div class="report-stat-card">
                <span class="label">${t("totalExits") || "???? ??????"}</span>
                <span class="value">${totalExits}</span>
            </div>
            <div class="report-stat-card">
                <span class="label">${t("totalDuration") || "?????? ????? ?????"}</span>
                <span class="value">${durationStr}</span>
            </div>
        </div>
        
        <div class="report-chart-container">
            <h4 class="report-chart-title">${t("dailyOrdersTrend") || "Daily Orders Trend"}</h4>
            <div class="report-bar-chart">
                ${generateBarChart(monthlyMovements, year, month)}
            </div>
        </div>
        
        <div class="report-summary-text">
            <strong>${t("executiveSummary") || "Executive Summary"}:</strong><br>
            ${generateSummaryText(driver, totalOrders, avgRating, totalExits)}
        </div>
    `;
}

// Generate Simple Bar Chart HTML
function generateBarChart(movements, year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyData = {};

    // Aggregate by day
    movements.forEach(m => {
        const day = new Date(m.date).getDate();
        dailyData[day] = (dailyData[day] || 0) + (m.orders || 0);
    });

    const maxOrders = Math.max(...Object.values(dailyData), 1);
    let html = "";

    for (let day = 1; day <= daysInMonth; day++) {
        const orders = dailyData[day] || 0;
        const height = (orders / maxOrders) * 100;
        html += `
            <div class="chart-bar-wrapper">
                <div class="chart-bar-fill" style="height: ${height}%" data-value="${orders}"></div>
                <span class="chart-bar-label">${day}</span>
            </div>
        `;
    }

    return html;
}

// Generate Summary Text
function generateSummaryText(driver, totalOrders, avgRating, totalExits) {
    if (totalExits === 0) return "No movements recorded for this month.";

    const performance = avgRating >= 90 ? "Excellent" : avgRating >= 80 ? "Good" : "Needs Improvement";
    return `During this month, the driver ${driver.name} completed ${totalExits} shifts with a total of ${totalOrders} orders. 
            The average performance rating was ${avgRating}%, which is considered ${performance}. 
            ${avgRating < 80 ? "Closer supervision or training is recommended." : "Continue maintaining this level of performance."}`;
}

// Print Report
function printReport() {
    window.print();
}


// View Switching
function showView(viewName) {
    // Save current view to localStorage
    localStorage.setItem('garageAppCurrentView', viewName);

    document.querySelectorAll('.app-view').forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const targetView = document.getElementById(viewName + 'View');
    if (targetView) {
        targetView.style.display = 'block';
        targetView.classList.add('active');
    }

    const targetLink = document.querySelector(`.nav-link[href="#${viewName}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    if (viewName === 'home') {
        renderHomeDashboard();
    }
}

// Bike CRUD Operations
function saveBikes() {
    localStorage.setItem('garageAppBikes', JSON.stringify(bikes));
}

function showAddBikeModal() {
    const modal = document.getElementById('addBikeModal');
    modal.classList.add('active');

    // Reset selection
    document.getElementById('newBikeDriver').value = "";
    document.getElementById('selectedDriverName').textContent = t('noDriver');
    document.getElementById('customDriverSearch').value = "";

    // Populate custom dropdown list
    const list = document.getElementById('customDriverList');
    list.innerHTML = `
        <li class="dropdown-item" onclick="selectCustomDriver('', '${t('noDriver')}')">
            <i class="fas fa-user-slash"></i>
            <span>${t('noDriver')}</span>
        </li>
    `;

    drivers.sort((a, b) => a.name.localeCompare(b.name)).forEach(driver => {
        const li = document.createElement('li');
        li.className = 'dropdown-item';
        li.onclick = () => selectCustomDriver(driver.id, driver.name);
        li.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${driver.name}</span>
        </li>`;
        list.appendChild(li);
    });
}

function toggleCustomDropdown() {
    const menu = document.getElementById('bikeDriverMenu');
    menu.classList.toggle('active');
    // Close other menus
    document.getElementById('bikeStatusMenu').classList.remove('active');
    if (menu.classList.contains('active')) {
        document.getElementById('customDriverSearch').focus();
    }
}

function toggleStatusDropdown() {
    const menu = document.getElementById('bikeStatusMenu');
    menu.classList.toggle('active');
    // Close other menus
    document.getElementById('bikeDriverMenu').classList.remove('active');
}

function selectCustomStatus(value, label) {
    document.getElementById('newBikeStatus').value = value;
    document.getElementById('selectedStatusName').textContent = label;
    document.getElementById('selectedStatusName').dataset.key = value;
    document.getElementById('bikeStatusMenu').classList.remove('active');
}

function selectCustomDriver(id, name) {
    document.getElementById('newBikeDriver').value = id;
    document.getElementById('selectedDriverName').textContent = name;
    document.getElementById('bikeDriverMenu').classList.remove('active');
}

function toggleEditStatusDropdown() {
    const menu = document.getElementById('editBikeStatusMenu');
    menu.classList.toggle('active');
    document.getElementById('editBikeDriverMenu').classList.remove('active');
}

function selectEditCustomStatus(value, label) {
    document.getElementById('editBikeStatus').value = value;
    document.getElementById('selectedEditStatusName').textContent = label;
    document.getElementById('selectedEditStatusName').dataset.key = value;
    document.getElementById('editBikeStatusMenu').classList.remove('active');
}

function toggleEditDriverDropdown() {
    const menu = document.getElementById('editBikeDriverMenu');
    menu.classList.toggle('active');
    document.getElementById('editBikeStatusMenu').classList.remove('active');
    if (menu.classList.contains('active')) {
        document.getElementById('editCustomDriverSearch').focus();
    }
}

function selectEditCustomDriver(id, name) {
    document.getElementById('editBikeDriver').value = id;
    document.getElementById('selectedEditDriverName').textContent = name;
    document.getElementById('editBikeDriverMenu').classList.remove('active');
}

function filterCustomDropdown() {
    const search = document.getElementById('customDriverSearch').value.toLowerCase();
    const items = document.querySelectorAll('#customDriverList .dropdown-item');

    items.forEach(item => {
        const text = item.querySelector('span').textContent.toLowerCase();
        item.style.display = text.includes(search) ? "flex" : "none";
    });
}

function filterEditCustomDropdown() {
    const search = document.getElementById('editCustomDriverSearch').value.toLowerCase();
    const items = document.querySelectorAll('#editCustomDriverList .dropdown-item');

    items.forEach(item => {
        const text = item.querySelector('span').textContent.toLowerCase();
        item.style.display = text.includes(search) ? "flex" : "none";
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const driverDropdown = document.getElementById('bikeDriverDropdown');
    const statusDropdown = document.getElementById('bikeStatusDropdown');
    const editDriverDropdown = document.getElementById('editBikeDriverDropdown');
    const editStatusDropdown = document.getElementById('editBikeStatusDropdown');

    if (driverDropdown && !driverDropdown.contains(e.target)) {
        document.getElementById('bikeDriverMenu').classList.remove('active');
    }
    if (statusDropdown && !statusDropdown.contains(e.target)) {
        document.getElementById('bikeStatusMenu').classList.remove('active');
    }
    if (editDriverDropdown && !editDriverDropdown.contains(e.target)) {
        document.getElementById('editBikeDriverMenu').classList.remove('active');
    }
    if (editStatusDropdown && !editStatusDropdown.contains(e.target)) {
        document.getElementById('editBikeStatusMenu').classList.remove('active');
    }

    const driverBikeDropdown = document.getElementById('driverBikeDropdown');
    if (driverBikeDropdown && !driverBikeDropdown.contains(e.target)) {
        document.getElementById('driverBikeMenu').classList.remove('active');
    }

    const editDriverBikeDropdown = document.getElementById('editDriverBikeDropdown');
    if (editDriverBikeDropdown && !editDriverBikeDropdown.contains(e.target)) {
        document.getElementById('editDriverBikeMenu').classList.remove('active');
    }
});

function closeAddBikeModal() {
    document.getElementById('addBikeModal').classList.remove('active');
    document.getElementById('addBikeForm').reset();
}

function showEditBikeModal(id) {
    const bike = bikes.find(b => b.id === id);
    if (!bike) return;

    currentBikeId = id;
    const modal = document.getElementById('editBikeModal');
    modal.classList.add('active');

    // Populate fields
    document.getElementById('editBikeId').value = bike.id;
    document.getElementById('editBikeModalNumber').value = bike.number;
    document.getElementById('editBatteryLife').value = bike.batteryLife;
    document.getElementById('editBikeNotes').value = bike.notes || "";

    // Status Dropdown
    document.getElementById('editBikeStatus').value = bike.status;
    document.getElementById('selectedEditStatusName').textContent = t(bike.status);
    document.getElementById('selectedEditStatusName').dataset.key = bike.status;

    // Driver Dropdown
    const driver = drivers.find(d => d.id === bike.driverId);
    document.getElementById('editBikeDriver').value = bike.driverId || "";
    document.getElementById('selectedEditDriverName').textContent = driver ? driver.name : t('noDriver');
    document.getElementById('selectedEditDriverName').dataset.key = driver ? "" : "noDriver";

    // Populate edit driver list
    const list = document.getElementById('editCustomDriverList');
    list.innerHTML = `
        <li class="dropdown-item" onclick="selectEditCustomDriver('', '${t('noDriver')}')">
            <i class="fas fa-user-slash"></i>
            <span>${t('noDriver')}</span>
        </li>
    `;

    drivers.sort((a, b) => a.name.localeCompare(b.name)).forEach(d => {
        const li = document.createElement('li');
        li.className = 'dropdown-item';
        li.onclick = () => selectEditCustomDriver(d.id, d.name);
        li.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${d.name}</span>
        </li>`;
        list.appendChild(li);
    });
}

function closeEditBikeModal() {
    document.getElementById('editBikeModal').classList.remove('active');
    document.getElementById('editBikeForm').reset();
}

function handleAddBike(e) {
    e.preventDefault();

    const bike = {
        id: generateId(),
        number: document.getElementById('newBikeNumber').value,
        status: document.getElementById('newBikeStatus').value,
        batteryLife: document.getElementById('newBatteryLife').value,
        driverId: document.getElementById('newBikeDriver').value,
        notes: document.getElementById('newBikeNotes').value,
        createdAt: new Date().toISOString()
    };

    bikes.push(bike);
    saveBikes();
    renderBikes();
    updateStatistics(); // Update dashboard
    closeAddBikeModal();
    showNotification(t('bikeAdded'));
}

function handleEditBike(e) {
    e.preventDefault();

    const bike = bikes.find(b => b.id === currentBikeId);
    if (!bike) return;

    const oldDriverId = bike.driverId;
    const newDriverId = document.getElementById('editBikeDriver').value;

    bike.number = document.getElementById('editBikeModalNumber').value;
    bike.status = document.getElementById('editBikeStatus').value;
    bike.batteryLife = document.getElementById('editBatteryLife').value;
    bike.driverId = newDriverId;
    bike.notes = document.getElementById('editBikeNotes').value;

    // Sync Driver Assignment
    if (oldDriverId !== newDriverId) {
        // Clear old driver
        const oldDriver = drivers.find(d => d.id === oldDriverId);
        if (oldDriver) oldDriver.bikeNumber = "";

        // Update new driver
        const newDriver = drivers.find(d => d.id === newDriverId);
        if (newDriver) newDriver.bikeNumber = bike.number;

        saveDrivers();
        renderDrivers();
    }

    saveBikes();
    renderBikes();
    updateStatistics(); // Update dashboard
    closeEditBikeModal();
    showNotification(t('bikeUpdated'));
}

function deleteBike(id) {
    if (confirm(t('confirmDeleteBike'))) {
        const bike = bikes.find(b => b.id === id);
        if (bike && bike.driverId) {
            const driver = drivers.find(d => d.id === bike.driverId);
            if (driver) driver.bikeNumber = "";
            saveDrivers();
            renderDrivers();
        }

        bikes = bikes.filter(b => b.id !== id);
        saveBikes();
        renderBikes();
        updateStatistics(); // Update dashboard
        showNotification(t('bikeDeleted'));
    }
}

function filterBikesByStat(filter) {
    currentBikeFilter = filter;

    // Update active UI state
    document.querySelectorAll('.bike-stats-overview .stat-card').forEach(card => {
        card.classList.remove('active');
    });

    const activeCard = document.querySelector(`.bike-stats-overview .stat-card[onclick*="'${filter}'"]`);
    if (activeCard) {
        activeCard.classList.add('active');
    }

    renderBikes(document.getElementById('bikeSearchInput').value);
}

function renderBikes(searchTerm = "") {
    const grid = document.getElementById('bikesGrid');
    if (!grid) return;

    grid.innerHTML = "";

    let filteredBikes = bikes.filter(bike => {
        const driver = drivers.find(d => d.id === bike.driverId);
        const driverName = driver ? driver.name.toLowerCase() : "";
        const search = searchTerm.toLowerCase();
        const matchesSearch = bike.number.toLowerCase().includes(search) ||
            driverName.includes(search) ||
            bike.status.toLowerCase().includes(search);

        if (!matchesSearch) return false;

        // Stat Filter
        if (currentBikeFilter === 'all') return true;
        if (currentBikeFilter === 'active') return bike.status === 'active';
        if (currentBikeFilter === 'broken') return bike.status === 'maintenance' || bike.status === 'outOfService';
        if (currentBikeFilter === 'withDriver') return bike.driverId && bike.driverId !== "";
        if (currentBikeFilter === 'withoutDriver') return !bike.driverId || bike.driverId === "";

        return true;
    });

    if (filteredBikes.length === 0) {
        grid.innerHTML = `<div class="no-data">${t('noData') || 'No bikes found'}</div>`;
        return;
    }

    filteredBikes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(bike => {
        const driver = drivers.find(d => d.id === bike.driverId);
        const card = document.createElement('div');
        card.className = `bike-card-modern status-${bike.status}`;

        card.innerHTML = `
            <div class="bike-card-inner">
                <div class="bike-card-header">
                    <div class="bike-id-badge">
                        <i class="fas fa-motorcycle"></i>
                        <span>${bike.number}</span>
                    </div>
                    <div class="bike-status-dot-wrapper">
                        <span class="status-label">${t(bike.status)}</span>
                        <span class="status-dot"></span>
                    </div>
                </div>
                
                <div class="bike-card-body">
                    <div class="bike-stats-row">
                        <div class="bike-stat">
                            <i class="fas fa-battery-three-quarters"></i>
                            <div class="stat-content">
                                <span class="stat-value">${bike.batteryLife}</span>
                                <span class="stat-unit">Hrs</span>
                            </div>
                        </div>
                        <div class="bike-stat">
                            <i class="fas fa-user-circle"></i>
                            <div class="stat-content">
                                <span class="stat-value">${driver ? driver.name : t('noDriver')}</span>
                                <span class="stat-unit">Driver</span>
                            </div>
                        </div>
                    </div>
                    
                    ${bike.notes ? `
                    <div class="bike-notes-mini">
                        <i class="fas fa-quote-left"></i>
                        <p>${bike.notes}</p>
                    </div>` : ''}
                </div>
                
                <div class="bike-card-footer">
                    <button class="bike-action-btn edit" onclick="showEditBikeModal('${bike.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="bike-action-btn delete" onclick="deleteBike('${bike.id}')" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}


// Driver Bike Dropdown Logic
function toggleDriverBikeDropdown() {
    const menu = document.getElementById('driverBikeMenu');
    menu.classList.toggle('active');
    if (menu.classList.contains('active')) {
        document.getElementById('driverBikeSearch').focus();
    }
}

function selectDriverBike(number) {
    document.getElementById('bikeNumber').value = number;
    document.getElementById('selectedDriverBikeName').textContent = number;
    document.getElementById('driverBikeMenu').classList.remove('active');
}

function filterDriverBikeDropdown() {
    const search = document.getElementById('driverBikeSearch').value.toLowerCase();
    const items = document.querySelectorAll('#driverBikeList .dropdown-item');

    items.forEach(item => {
        const text = item.querySelector('span').textContent.toLowerCase();
        item.style.display = text.includes(search) ? "flex" : "none";
    });
}

function populateAvailableBikesDropdown() {
    const list = document.getElementById('driverBikeList');
    const selectedSpan = document.getElementById('selectedDriverBikeName');
    const hiddenInput = document.getElementById('bikeNumber');

    // Reset selection
    selectedSpan.textContent = t('selectBike') || "Select Available Bike";
    hiddenInput.value = "";

    // Get available active bikes
    const availableBikes = bikes.filter(b => b.status === 'active' && (!b.driverId || b.driverId === ""));

    let html = `
        <li class="dropdown-item status-waiting" onclick="selectDriverBike('Waiting')">
            <i class="fas fa-clock"></i>
            <span>Waiting</span>
        </li>
    `;

    if (availableBikes.length === 0) {
        list.innerHTML = html + `<li class="dropdown-item disabled" style="opacity: 0.5; cursor: not-allowed;">
            <i class="fas fa-exclamation-circle"></i>
            <span>No other available bikes</span>
        </li>`;
        return;
    }

    html += availableBikes.map(bike => `
        <li class="dropdown-item" onclick="selectDriverBike('${bike.number}')">
            <i class="fas fa-motorcycle"></i>
            <span>${bike.number}</span>
        </li>
    `).join('');

    list.innerHTML = html;
}

// Edit Driver Bike Dropdown Logic
function toggleEditDriverBikeDropdown() {
    const menu = document.getElementById('editDriverBikeMenu');
    menu.classList.toggle('active');
    if (menu.classList.contains('active')) {
        document.getElementById('editDriverBikeSearch').focus();
    }
}

function selectEditDriverBike(number) {
    document.getElementById('editDriverBikeNumber').value = number;
    document.getElementById('selectedEditDriverBikeName').textContent = number;
    document.getElementById('editDriverBikeMenu').classList.remove('active');
}

function filterEditDriverBikeDropdown() {
    const search = document.getElementById('editDriverBikeSearch').value.toLowerCase();
    const items = document.querySelectorAll('#editDriverBikeList .dropdown-item');

    items.forEach(item => {
        const text = item.querySelector('span').textContent.toLowerCase();
        item.style.display = text.includes(search) ? "flex" : "none";
    });
}

function populateEditAvailableBikesDropdown(currentBikeNumber) {
    const list = document.getElementById('editDriverBikeList');
    const selectedSpan = document.getElementById('selectedEditDriverBikeName');
    const hiddenInput = document.getElementById('editDriverBikeNumber');

    // Set current selection
    selectedSpan.textContent = currentBikeNumber || t('selectBike');
    hiddenInput.value = currentBikeNumber || "";

    // Get available active bikes + current bike
    const availableBikes = bikes.filter(b =>
        b.status === 'active' && (!b.driverId || b.driverId === "" || b.number === currentBikeNumber)
    );

    let html = `
        <li class="dropdown-item status-waiting ${currentBikeNumber === 'Waiting' ? 'selected' : ''}" 
            onclick="selectEditDriverBike('Waiting')">
            <i class="fas fa-clock"></i>
            <span>Waiting</span>
        </li>
    `;

    if (availableBikes.length === 0) {
        list.innerHTML = html;
        return;
    }

    html += availableBikes.map(bike => `
        <li class="dropdown-item ${bike.number === currentBikeNumber ? 'selected' : ''}" 
            onclick="selectEditDriverBike('${bike.number}')">
            <i class="fas fa-motorcycle"></i>
            <span>${bike.number} ${bike.number === currentBikeNumber ? `(${t('current') || 'Current'})` : ''}</span>
        </li>
    `).join('');

    list.innerHTML = html;
}

// Driver Statistics Filtering
function filterDriversByStat(type) {
    currentDriverFilter = type;

    // Update UI highlights
    document.querySelectorAll('.stats-overview .stat-card').forEach(card => {
        card.classList.remove('active');
    });

    const activeCard = document.getElementById(`stat-${type === 'all' ? 'total' : type}`);
    if (activeCard) activeCard.classList.add('active');

    renderDrivers(document.getElementById('searchInput').value);
}
// Home Dashboard Rendering
function renderHomeDashboard() {
    // 1. Current Date
    const dateEl = document.getElementById('currentDateDisplay');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', options);
    }

    // 2. Efficiency Metric (Drivers Outside / Total Drivers)
    const totalDriversCount = drivers.length;
    const outsideDriversCount = drivers.filter(d => d.status === 'outside').length;
    const efficiency = totalDriversCount > 0 ? Math.round((outsideDriversCount / totalDriversCount) * 100) : 0;

    const effVal = document.getElementById('efficiencyValue');
    const effBar = document.getElementById('efficiencyBar');
    if (effVal) animateNumber('efficiencyValue', efficiency, '%');
    if (effBar) effBar.style.width = efficiency + '%';

    // 3. Fleet Readiness (Bikes with drivers / Total Bikes)
    const totalBikesCount = bikes.length;
    const bikesWithDrivers = bikes.filter(b => b.driverId).length;
    const readinessVal = document.getElementById('readinessValue');
    if (readinessVal) readinessVal.textContent = `${bikesWithDrivers}/${totalBikesCount}`;

    // 4. Maintenance Alerts
    const maintenanceCount = bikes.filter(b => b.status === 'maintenance' || b.status === 'outOfService').length;
    const maintenanceVal = document.getElementById('maintenanceValue');
    if (maintenanceVal) animateNumber('maintenanceValue', maintenanceCount);

    // 5. Fleet Distribution Chart
    updateFleetDistributionChart();

    // 6. Top Performing Drivers
    renderTopDrivers();

    // 7. Recent Activity
    renderRecentActivity();
}

function updateFleetDistributionChart() {
    const total = bikes.length;
    if (total === 0) return;

    const outside = bikes.filter(b => {
        const driver = drivers.find(d => d.id === b.driverId);
        return driver && driver.status === 'outside';
    }).length;
    const inside = bikes.filter(b => {
        const driver = drivers.find(d => d.id === b.driverId);
        return (driver && driver.status === 'inside') || (!driver && b.status === 'active');
    }).length;
    const broken = bikes.filter(b => b.status === 'maintenance' || b.status === 'outOfService').length;

    const pOutside = (outside / total) * 100;
    const pInside = (inside / total) * 100;
    const pBroken = (broken / total) * 100;

    const chartOutside = document.getElementById('distChartOutside');
    const chartInside = document.getElementById('distChartInside');
    const chartBroken = document.getElementById('distChartBroken');
    const totalText = document.getElementById('fleetTotalText');

    if (chartOutside) chartOutside.setAttribute('stroke-dasharray', `${pOutside}, 100`);
    if (chartInside) {
        chartInside.setAttribute('stroke-dasharray', `${pInside}, 100`);
        chartInside.setAttribute('stroke-dashoffset', `-${pOutside}`);
    }
    if (chartBroken) {
        chartBroken.setAttribute('stroke-dasharray', `${pBroken}, 100`);
        chartBroken.setAttribute('stroke-dashoffset', `-${pOutside + pInside}`);
    }
    if (totalText) totalText.textContent = total;

    // Legend counts
    if (document.getElementById('countOutside')) document.getElementById('countOutside').textContent = outside;
    if (document.getElementById('countInside')) document.getElementById('countInside').textContent = inside;
    if (document.getElementById('countBroken')) document.getElementById('countBroken').textContent = broken;
}

function renderTopDrivers() {
    const list = document.getElementById('homeTopDrivers');
    if (!list) return;

    const sortedDrivers = [...drivers].sort((a, b) => b.rating - a.rating).slice(0, 4);

    if (sortedDrivers.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:var(--text-light); padding:20px;">No driver data available</p>`;
        return;
    }

    list.innerHTML = sortedDrivers.map((d, index) => `
        <div class="top-driver-item">
            <div class="top-driver-rank">${index + 1}</div>
            <div class="top-driver-info">
                <span class="top-driver-name">${escapeHtml(d.name)}</span>
                <span class="top-driver-rating"><i class="fas fa-star"></i> ${d.rating}/100</span>
            </div>
            <div class="top-driver-status">
                <span class="status-badge-mini ${d.status}">${t(d.status)}</span>
            </div>
        </div>
    `).join('');
}

function renderRecentActivity() {
    const list = document.getElementById('homeRecentActivity');
    if (!list) return;

    // Get all movements from all drivers
    let allMovements = [];
    drivers.forEach(d => {
        if (d.movements) {
            d.movements.forEach(m => {
                allMovements.push({
                    driverName: d.name,
                    ...m
                });
            });
        }
    });

    // Sort by date (newest first)
    allMovements.sort((a, b) => new Date(b.exitTime || b.timestamp) - new Date(a.exitTime || a.timestamp));
    const recent = allMovements.slice(0, 5);

    if (recent.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:var(--text-light); padding:20px;">No recent activity</p>`;
        return;
    }

    list.innerHTML = recent.map(m => {
        const isExit = m.type === 'exit' || (m.exitTime && !m.entryTime);
        const time = new Date(m.exitTime || m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="activity-item">
                <div class="activity-icon ${isExit ? 'exit' : 'entry'}">
                    <i class="fas fa-sign-${isExit ? 'out' : 'in'}-alt"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${escapeHtml(m.driverName)} - ${isExit ? 'Departure' : 'Arrival'}</div>
                    <div class="activity-time">${time}</div>
                </div>
                <div class="activity-meta">
                    ${m.orderNumber ? `#${m.orderNumber}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Enhanced animateNumber to support suffixes
function animateNumber(elementId, targetValue, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    const startValue = parseInt(element.textContent) || 0;
    const duration = 800;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startValue + (targetValue - startValue) * easeProgress);
        element.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// Scroll to Top Function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
