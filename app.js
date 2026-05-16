// Garage App - Main Application JavaScript







// Data Storage - Firebase



let drivers = [];



let bikes = [];



let users = [];



let currentUser = JSON.parse(localStorage.getItem('garageAppCurrentUser')) || null;



let currentDriverId = null;



let currentBikeId = null;



let currentBikeFilter = 'all';



let currentDriverFilter = 'all';



let currentUserFilter = '';







// Firebase Database Reference



let db = null;



let dbRefs = {};



let isLoadingData = true;







// Initialize Firebase Database connection



function initFirebaseDB() {



    if (window.firebaseDB) {



        db = window.firebaseDB;



        dbRefs.drivers = window.firebaseRef(db, 'drivers');



        dbRefs.bikes = window.firebaseRef(db, 'bikes');



        dbRefs.users = window.firebaseRef(db, 'users');



        dbRefs.settings = window.firebaseRef(db, 'settings');
    dbRefs.logs = window.firebaseRef(db, 'logs');



        return true;



    }



    return false;



}







// Load all data from Firebase



async function loadAllDataFromFirebase() {



    if (!db) {



        console.log('Firebase not initialized, retrying...');



        setTimeout(loadAllDataFromFirebase, 500);



        return;



    }







    try {



        // Load drivers



        const driversSnapshot = await window.firebaseGet(dbRefs.drivers);



        if (driversSnapshot.exists()) {



            drivers = Object.values(driversSnapshot.val()) || [];



        } else {



            drivers = [];



        }







        // Load bikes



        const bikesSnapshot = await window.firebaseGet(dbRefs.bikes);



        if (bikesSnapshot.exists()) {



            bikes = Object.values(bikesSnapshot.val()) || [];



        } else {



            bikes = [];



        }







        // Load users



        const usersSnapshot = await window.firebaseGet(dbRefs.users);



        if (usersSnapshot.exists()) {



            users = Object.values(usersSnapshot.val()) || [];



        } else {



            users = [];



        }







        // Load settings



        const settingsSnapshot = await window.firebaseGet(dbRefs.settings);
        const logsSnapshot = await window.firebaseGet(dbRefs.logs);
        
        if (logsSnapshot.exists()) {
            activityLogs = Object.values(logsSnapshot.val() || {});
            activityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            await cleanupOldLogs();
        }



        if (settingsSnapshot.exists()) {



            const settings = settingsSnapshot.val();



            if (settings.garageAddress) {



                localStorage.setItem('garageAppAddress', settings.garageAddress);



            }



        }







        // Setup real-time listeners



        setupFirebaseListeners();







        // Initialize app after data loaded



        initializeAppAfterDataLoad();







    } catch (error) {



        console.error('Error loading data from Firebase:', error);



        showNotification('Error loading data from cloud', 'error');



    }



}







// Setup real-time listeners for data changes



function setupFirebaseListeners() {



    // Listen for drivers changes



    window.firebaseOnValue(dbRefs.drivers, (snapshot) => {



        if (snapshot.exists()) {



            drivers = Object.values(snapshot.val()) || [];



            renderDrivers();



            updateStatistics();



            if (currentDriverId) {



                const driver = drivers.find(d => d.id === currentDriverId);



                if (driver) {

                    renderMovementHistory(driver);

                    initMovementHistoryCalendar();

                }



            }



        }



    });







    // Listen for bikes changes



    window.firebaseOnValue(dbRefs.bikes, (snapshot) => {



        if (snapshot.exists()) {



            bikes = Object.values(snapshot.val()) || [];



            renderBikes();



            updateStatistics();



        }



    });







    // Listen for users changes



    window.firebaseOnValue(dbRefs.users, (snapshot) => {



        if (snapshot.exists()) {



            users = Object.values(snapshot.val()) || [];



            renderUsers();



        }



    });







    // Listen for settings changes



        window.firebaseOnValue(dbRefs.logs, (snapshot) => {
        if (snapshot.exists()) {
            activityLogs = Object.values(snapshot.val() || {});
            activityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            if (document.getElementById('dashboardView').style.display === 'none') { renderActivityLogs(); }
        } else {
            activityLogs = [];
            renderActivityLogs();
        }
    });

    window.firebaseOnValue(dbRefs.settings, (snapshot) => {



        if (snapshot.exists()) {



            const settings = snapshot.val();



            if (settings.garageAddress) {



                localStorage.setItem('garageAppAddress', settings.garageAddress);



                updateGarageAddress();



            }



        }



    });



}







// Initialize app after data is loaded



async function initializeAppAfterDataLoad() {



    isLoadingData = false;







    // Remove loading overlay if exists



    const loadingOverlay = document.getElementById('loadingOverlay');



    if (loadingOverlay) {



        loadingOverlay.classList.add('hidden');



        setTimeout(() => loadingOverlay.remove(), 300);



    }







    await initializeDefaultUser();



    initAuth();



    initLanguage();



    renderDrivers();



    renderBikes();



    updateStatistics();



    setupEventListeners();



    updateSidebarTime();



    updateSystemInfo();



    updateGarageAddress();







    // Restore saved view or default to dashboard



    const savedView = localStorage.getItem('garageAppCurrentView') || 'dashboard';



    showView(savedView);







    // Setup form listeners



    setupFormListeners();







    // Check for sample data after a short delay



    setTimeout(checkAndLoadSampleData, 1000);







    showNotification('Data loaded from cloud', 'success');



}







// Show loading indicator



function showLoadingIndicator() {



    const overlay = document.createElement('div');



    overlay.id = 'loadingOverlay';



    overlay.className = 'loading-overlay';



    overlay.innerHTML = `



        <div class="loading-spinner">



            <i class="fas fa-cloud-download-alt"></i>



            <span>Loading data from cloud...</span>



        </div>



    `;



    document.body.appendChild(overlay);



}







// Setup form event listeners



function setupFormListeners() {



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







    // Login form



    const loginForm = document.getElementById('loginForm');



    if (loginForm) {



        loginForm.addEventListener('submit', handleLogin);



    }







    // Add user form



    const addUserForm = document.getElementById('addUserForm');



    if (addUserForm) {



        addUserForm.addEventListener('submit', handleAddUser);



    }







    // Edit user form



    const editUserForm = document.getElementById('editUserForm');



    if (editUserForm) {



        editUserForm.addEventListener('submit', handleEditUser);



    }







    // User search



    const userSearchInput = document.getElementById('userSearchInput');



    if (userSearchInput) {



        userSearchInput.addEventListener('input', (e) => {



            renderUsers(e.target.value);



        });



    }



}







// Role definitions


const ROLE_ADMIN = 'admin';
const ROLE_GARAGE_MANAGER = 'garage_manager';
const ROLE_VIEWER = 'viewer';







// Initialize default admin user if no users exist



async function initializeDefaultUser() {



    // Check if anon user exists



    const anonUser = users.find(u => u.username === 'anon');







    if (anonUser) {



        // Ensure anon user has admin role



        if (anonUser.role !== ROLE_ADMIN) {



            anonUser.role = ROLE_ADMIN;



            await saveUsers();



        }



    } else if (users.length === 0) {



        // Create default admin if no users exist



        const defaultAdmin = {



            id: generateId(),



            username: 'anon',



            password: 'anon',



            role: ROLE_ADMIN,



            createdAt: new Date().toISOString()



        };



        users.push(defaultAdmin);



        await saveUsers();



    }



}







// Initialize App



document.addEventListener('DOMContentLoaded', () => {



    // Show loading indicator



    showLoadingIndicator();







    // Initialize Firebase Database



    if (initFirebaseDB()) {



        loadAllDataFromFirebase();



    } else {



        // Retry after a short delay if Firebase isn't ready yet



        setTimeout(() => {



            if (initFirebaseDB()) {



                loadAllDataFromFirebase();



            } else {



                console.error('Failed to initialize Firebase');



                showNotification('Failed to connect to cloud database', 'error');



                // Remove loading overlay



                const loadingOverlay = document.getElementById('loadingOverlay');



                if (loadingOverlay) {



                    loadingOverlay.innerHTML = `



                        <div class="loading-spinner error">



                            <i class="fas fa-exclamation-circle"></i>



                            <span>Failed to connect to cloud database</span>



                            <button onclick="location.reload()" class="btn-retry">Retry</button>



                        </div>



                    `;



                }



            }



        }, 1500);



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







    // Confirm clear form



    const confirmClearForm = document.getElementById('confirmClearForm');



    if (confirmClearForm) {



        confirmClearForm.addEventListener('submit', handleConfirmClearData);



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







// Update System Information



function updateSystemInfo() {



    const lastUpdatedElement = document.getElementById('lastUpdated');



    if (lastUpdatedElement) {



        const now = new Date();



        const options = { year: 'numeric', month: 'short', day: 'numeric' };



        lastUpdatedElement.textContent = now.toLocaleDateString('en-US', options);



    }



}







// Generate unique ID



function generateId() {



    return Date.now().toString(36) + Math.random().toString(36).substr(2);



}







// Save drivers to Firebase



async function saveDrivers() {



    if (!db) return;



    try {



        // Convert array to object with IDs as keys for Firebase



        const driversObj = {};



        drivers.forEach(driver => {



            driversObj[driver.id] = driver;



        });



        await window.firebaseSet(dbRefs.drivers, driversObj);



    } catch (error) {



        console.error('Error saving drivers:', error);



        showNotification('Error saving drivers to cloud', 'error');



    }



}







// Show Add Driver Modal



function showAddDriverModal() {



    if (!isAdmin()) {



        showNotification('View only mode - cannot add drivers', 'error');



        return;



    }



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



                    <button class="btn-primary-subtle" onclick="safeShowDriverDashboard('${driver.id}')">



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







// Safe wrapper for showing driver dashboard



function safeShowDriverDashboard(driverId) {



    try {



        showDriverDashboard(driverId);



    } catch (error) {



        console.error('Critical error opening driver dashboard:', error);



        showNotification('Failed to open driver profile. Please try again.', 'error');



    }



}







// Show Driver Dashboard



function showDriverDashboard(driverId) {



    // Check if data is still loading



    if (isLoadingData) {



        showNotification('Please wait for data to load', 'warning');



        return;



    }







    // Validate driver ID



    if (!driverId) {



        console.error('Driver ID is required');



        showNotification('Invalid driver ID', 'error');



        return;



    }







    currentDriverId = driverId;



    const driver = drivers.find(d => d.id === driverId);







    // Comprehensive driver validation



    if (!driver) {



        console.error('Driver not found:', driverId);



        showNotification('Driver not found in database', 'error');



        return;



    }







    // Validate driver data structure



    if (!driver.name || !driver.driverId) {



        console.error('Invalid driver data structure:', driver);



        showNotification('Invalid driver data', 'error');



        return;



    }







    // Initialize movements array if it doesn't exist



    if (!driver.movements || !Array.isArray(driver.movements)) {



        driver.movements = [];



    }







    // Hide edit button for viewers



    const editBtn = document.querySelector('.profile-edit-btn');



    if (editBtn) {



        editBtn.style.display = isAdmin() ? 'flex' : 'none';



    }







    // Reset current movement when switching drivers



    currentMovement = null;







    // Update dashboard info with null checks



    const nameElement = document.getElementById('dashboardDriverName');



    if (nameElement) {



        nameElement.textContent = driver.name || 'Unknown Driver';



    }







    const bikeNumberEl = document.getElementById('dashboardBikeNumber');



    if (bikeNumberEl) {



        bikeNumberEl.textContent = `${t('bikeNumber')}: ${driver.bikeNumber || 'Not assigned'}`;



        



        if (driver.bikeNumber === 'Waiting') {



            bikeNumberEl.classList.add('waiting-pulse');



        } else {



            bikeNumberEl.classList.remove('waiting-pulse');



        }



    }







    const driverIdElement = document.getElementById('dashboardDriverId');



    if (driverIdElement) {



        driverIdElement.textContent = driver.driverId || '-';



    }







    const phoneElement = document.getElementById('dashboardPhone');



    if (phoneElement) {



        phoneElement.textContent = driver.phone || '-';



    }







    const ratingElement = document.getElementById('dashboardRating');



    if (ratingElement) {



        ratingElement.textContent = `${driver.rating || 100}/100`;



    }







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



    // Initialize calendar with date highlighting

    initMovementHistoryCalendar();







    // Show modal with error handling



    try {



        const modal = document.getElementById('driverDashboardModal');



        if (modal) {



            modal.classList.add('active');



        } else {



            console.error('Driver dashboard modal not found');



            showNotification('Error: Driver profile window not available', 'error');



        }



    } catch (error) {



        console.error('Error showing driver dashboard modal:', error);



        showNotification('Error opening driver profile', 'error');



    }



}







// Close Dashboard Modal



function closeDashboardModal() {



    document.getElementById('driverDashboardModal').classList.remove('active');



    currentDriverId = null;



}







// Update Status Toggle (Display Only)



function updateStatusToggle(status) {



    const toggle = document.getElementById('statusToggle');



    const text = document.getElementById('statusText');



    



    if (!toggle || !text) return;







    // Remove existing status classes



    toggle.classList.remove('status-inside', 'status-outside');



    



    if (status === 'inside') {



        toggle.classList.add('status-inside');



        text.textContent = t('statusInside') || 'Inside';



    } else {



        toggle.classList.add('status-outside');



        text.textContent = t('statusOutside') || 'Outside';



    }



}







// Toggle Driver Status



function toggleDriverStatus() {



    if (!canManageDrivers()) {



        showNotification('View only mode - cannot change status', 'error');



        return;



    }



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



    initMovementHistoryCalendar();







    showNotification(t('movementRecorded'));



}







// Global variable to track current movement



let currentMovement = null;







// Global variables for confirmation modal



let confirmCallback = null;



let confirmActionType = '';







// Show Custom Confirmation Modal



function showConfirmModal(title, message, callback, type = 'default') {



    confirmCallback = callback;



    confirmActionType = type;



    



    const modal = document.getElementById('confirmModal');



    const titleElement = document.getElementById('confirmTitle');



    const messageElement = document.getElementById('confirmMessage');



    const iconElement = document.getElementById('confirmIcon');



    



    // Update content



    titleElement.textContent = title;



    messageElement.textContent = message;



    



    // Update icon based on type



    if (type === 'exit') {



        iconElement.className = 'fas fa-sign-out-alt';



        iconElement.style.color = '#f59e0b';



    } else if (type === 'entry') {



        iconElement.className = 'fas fa-sign-in-alt';



        iconElement.style.color = '#10b981';



    } else if (type === 'delete') {



        iconElement.className = 'fas fa-trash-alt';



        iconElement.style.color = '#ef4444';



    } else if (type === 'logout') {



        iconElement.className = 'fas fa-sign-out-alt';



        iconElement.style.color = '#8b5cf6';



    } else {



        iconElement.className = 'fas fa-question-circle';



        iconElement.style.color = '#3b82f6';



    }



    



    // Show modal



    modal.classList.add('active');



}







// Close Confirmation Modal



function closeConfirmModal() {



    const modal = document.getElementById('confirmModal');



    modal.classList.remove('active');



    confirmCallback = null;



    confirmActionType = '';



}







// Confirm Action



function confirmAction() {



    if (confirmCallback) {



        confirmCallback();



    }



    closeConfirmModal();



}







// Record Exit Function



function recordExit() {



    const driver = drivers.find(d => d.id === currentDriverId);



    if (!driver) return;







    if (driver.bikeNumber === 'Waiting') {



        showNotification("Cannot record exit: No bike assigned", "error");



        return;



    }







    // Show custom confirmation dialog



    showConfirmModal(



        t('confirmRecordExit') || 'Record Exit Confirmation',



        `Are you sure you want to record exit for ${driver.name}?`,



        () => recordExitConfirmed(driver),



        'exit'



    );



}







// Record Exit Confirmed Function

function recordExitConfirmed(driver) {



    // Check if driver is already inside (status: inside) - show exit details form

    if (driver.status === 'inside') {

        // Create a temporary movement object for form display only

        currentMovement = {

            id: generateId(),

            date: new Date().toISOString().split('T')[0],

            exitTime: new Date().toISOString(),

            entryTime: null,

            orders: 0,

            rating: driver.rating,

            timestamp: new Date().toISOString()

        };



        // Update UI to show exit details form

        updateLastRecordedTime(new Date());

        updateButtonStates('exit');

        showExitDetails();



        // Don't save any data yet - wait for saveExitDetails()

        showNotification("Please fill exit details and click Save", 'info');



    } else {

        showNotification("Driver is already outside", "warning");

    }



}







// Record Entry Function



function recordEntry() {



    const driver = drivers.find(d => d.id === currentDriverId);



    if (!driver) return;







    if (driver.bikeNumber === 'Waiting') {



        showNotification("Cannot record entry: No bike assigned", "error");



        return;



    }







    // Show custom confirmation dialog



    showConfirmModal(



        t('confirmRecordEntry') || 'Record Entry Confirmation',



        `Are you sure you want to record entry for ${driver.name}?`,



        () => recordEntryConfirmed(driver),



        'entry'



    );



}







// Record Entry Confirmed Function



function recordEntryConfirmed(driver) {







    // Check if there's a pending exit movement (exit without entry)



    const pendingExitMovement = driver.movements.find(m => m.exitTime && !m.entryTime);







    if (pendingExitMovement) {



        // Set current movement to the pending exit movement for completion



        currentMovement = pendingExitMovement;







        // Update UI to show entry details form



        updateLastRecordedTime(new Date());



        updateButtonStates('entry');



        showEntryDetails();







        // Don't save any data yet - wait for saveEntryDetails()



        showNotification("Please fill entry details and click Save", 'info');







    } else if (driver.status === 'outside') {



        // Create a temporary movement object for form display only



        currentMovement = {



            id: generateId(),



            date: new Date().toISOString().split('T')[0],



            exitTime: null,



            entryTime: new Date().toISOString(),



            orders: 0,



            rating: driver.rating,



            timestamp: new Date().toISOString()



        };







        // Update UI to show entry details form



        updateLastRecordedTime(new Date());



        updateButtonStates('entry');



        showEntryDetails();







        // Don't save any data yet - wait for saveEntryDetails()



        showNotification("Please fill entry details and click Save", 'info');







    } else {



        showNotification("Driver is already inside", "warning");



    }







}







// Save Entry Details Function



function saveEntryDetails() {



    const driver = drivers.find(d => d.id === currentDriverId);



    if (!driver || !currentMovement) return;







    const ordersCount = parseInt(document.getElementById('ordersCount').value) || 0;



    const newRating = parseInt(document.getElementById('movementRating').value) || driver.rating;



    const manualTimeValue = document.getElementById('manualEntryTime').value;



    const entryTime = manualTimeValue ? new Date(manualTimeValue).toISOString() : new Date().toISOString();







    // Update movement with entry details



    currentMovement.entryTime = entryTime;



    currentMovement.orders = ordersCount;



    currentMovement.rating = newRating;







    // Add the movement to driver's movements array (if not already there)



    if (!driver.movements.includes(currentMovement)) {



        driver.movements.unshift(currentMovement);



    }







    // Update driver status, total orders, and rating



    driver.status = 'inside';



    driver.totalOrders += ordersCount;



    driver.rating = newRating;







    // Reset current movement



    currentMovement = null;







    // Update UI



    hideEntryDetails();



    resetMovementForm();







    // Save data and update displays



    saveDrivers();



    renderDrivers();



    updateStatistics();



    updateStatusToggle(driver.status);



    renderMovementHistory(driver);



    initMovementHistoryCalendar();







    showNotification(t('entryRecorded'), 'success');

    logActivity('Record Entry', `Recorded entry for driver: ${driver.name} (ID: ${driver.driverId}), orders: ${ordersCount}`);

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







    // Update movement with exit details



    currentMovement.exitTime = exitTime;



    currentMovement.exitRating = exitRating;



    currentMovement.rating = exitRating;







    // Add the movement to driver's movements array



    driver.movements.unshift(currentMovement);







    // Update driver status and rating



    driver.status = 'outside';



    driver.rating = exitRating;







    // Reset current movement



    currentMovement = null;







    // Update UI



    hideExitDetails();



    resetMovementForm();







    // Save data and update displays



    saveDrivers();



    renderDrivers();



    updateStatistics();



    updateStatusToggle(driver.status);



    renderMovementHistory(driver);







    showNotification(t('exitRecorded'), 'success');

    logActivity('Record Exit', `Recorded exit for driver: ${driver.name} (ID: ${driver.driverId})`);

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



    



    // Check if tbody exists



    if (!tbody) {



        console.error('Movement history table body not found');



        return;



    }







    // Validate driver and movements



    if (!driver) {



        console.error('Driver is null or undefined');



        tbody.innerHTML = `



            <tr class="empty-state">



                <td colspan="6">



                    <i class="fas fa-exclamation-triangle"></i>



                    <p>Error: Driver data not available</p>



                </td>



            </tr>



        `;



        return;



    }







    // Ensure movements array exists



    if (!driver.movements || !Array.isArray(driver.movements)) {



        console.warn('Driver movements array is missing or invalid:', driver.movements);



        driver.movements = [];



    }







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



        // Validate movement object



        if (!movement || typeof movement !== 'object') {



            console.warn('Invalid movement data at index', index, movement);



            return `



                <tr data-movement-id="invalid-${index}" class="error">



                    <td colspan="6">



                        <i class="fas fa-exclamation-triangle"></i>



                        <span>Invalid movement data</span>



                    </td>



                </tr>



            `;



        }







        // Ensure movement has an ID



        if (!movement.id) {



            movement.id = `movement-${Date.now()}-${index}`;



        }







        const exitDate = movement.exitTime ? new Date(movement.exitTime) : null;



        const entryDate = movement.entryTime ? new Date(movement.entryTime) : null;







        // Get current locale with fallback



        const locale = getCurrentLocale();







        // Format date with error handling



        let dateDisplay = 'Invalid Date';



        try {



            const dateObj = new Date(movement.date || Date.now());



            dateDisplay = dateObj.toLocaleDateString(locale, {



                year: 'numeric',



                month: 'short',



                day: 'numeric'



            });



        } catch (error) {



            console.warn('Error formatting date for movement:', movement.date);



        }







        // Orders display



        const ordersCount = movement.orders || 0;
        let ordersColorClass = '';
        if (ordersCount < 25) {
            ordersColorClass = 'orders-red';
        } else if (ordersCount >= 25 && ordersCount < 28) {
            ordersColorClass = 'orders-orange';
        } else if (ordersCount >= 28 && ordersCount < 35) {
            ordersColorClass = 'orders-green';
        }



        const ordersDisplay = ordersCount > 0 ?



            `<span class="orders-count ${ordersColorClass}">${ordersCount}</span>` :



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

// Filter Movement History by Date
function filterMovementHistoryByDate() {
    const dateFilter = document.getElementById('historyDateFilter').value;
    if (!dateFilter) {
        showAllMovementHistory();
        return;
    }

    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    const tbody = document.getElementById('movementHistory');
    if (!tbody) return;

    const filteredDate = new Date(dateFilter);
    const filteredMovements = driver.movements.filter(movement => {
        if (!movement.date) return false;
        const movementDate = new Date(movement.date);
        return movementDate.toDateString() === filteredDate.toDateString();
    });

    if (filteredMovements.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="6">
                    <i class="fas fa-calendar-times"></i>
                    <p>${t('noMovementsOnDate') || 'لا توجد حركات في هذا التاريخ'}</p>
                </td>
            </tr>
        `;
        return;
    }

    renderFilteredMovements(filteredMovements);
}

// Show All Movement History
function showAllMovementHistory() {
    const dateFilter = document.getElementById('historyDateFilter');
    if (dateFilter) {
        dateFilter.value = '';
    }

    const driver = drivers.find(d => d.id === currentDriverId);
    if (driver) {
        renderMovementHistory(driver);
        initMovementHistoryCalendar();
    }
}

// Render Filtered Movements
function renderFilteredMovements(movements) {
    const tbody = document.getElementById('movementHistory');
    if (!tbody) return;

    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return;

    tbody.innerHTML = movements.slice(0, 50).map((movement, index) => {
        if (!movement || typeof movement !== 'object') {
            return `
                <tr data-movement-id="invalid-${index}" class="error">
                    <td colspan="6">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Invalid movement data</span>
                    </td>
                </tr>
            `;
        }

        if (!movement.id) {
            movement.id = `movement-${Date.now()}-${index}`;
        }

        const exitDate = movement.exitTime ? new Date(movement.exitTime) : null;
        const entryDate = movement.entryTime ? new Date(movement.entryTime) : null;
        const locale = getCurrentLocale();

        let dateDisplay = 'Invalid Date';
        try {
            const dateObj = new Date(movement.date || Date.now());
            dateDisplay = dateObj.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.warn('Error formatting date for movement:', movement.date);
        }

        const ordersCount = movement.orders || 0;
        let ordersColorClass = '';
        if (ordersCount < 25) {
            ordersColorClass = 'orders-red';
        } else if (ordersCount >= 25 && ordersCount < 28) {
            ordersColorClass = 'orders-orange';
        } else if (ordersCount >= 28 && ordersCount < 35) {
            ordersColorClass = 'orders-green';
        }
        
        const ordersDisplay = ordersCount > 0 ?
            `<span class="orders-count ${ordersColorClass}">${ordersCount}</span>` :
            '<span class="orders-count zero">-</span>';

        let ratingDisplay = '';
        if (exitDate && entryDate) {
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
            const exitRating = movement.exitRating || driver.rating;
            const exitStatus = exitRating >= 80 ? 'good' : 'warning';

            ratingDisplay = `
                <div class="rating-pill exit ${exitStatus}">
                    <i class="fas fa-arrow-up"></i>
                    <span>${exitRating}</span>
                </div>
            `;
        } else if (entryDate && !exitDate) {
            const entryRating = movement.rating || driver.rating;
            const entryStatus = entryRating >= 80 ? 'good' : 'warning';

            ratingDisplay = `
                <div class="rating-pill entry ${entryStatus}">
                    <i class="fas fa-arrow-down"></i>
                    <span>${entryRating}</span>
                </div>
            `;
        } else {
            const rating = driver.rating;
            const ratingStatus = rating >= 80 ? 'good' : 'warning';

            ratingDisplay = `
                <div class="rating-pill ${ratingStatus}">
                    <i class="fas fa-star"></i>
                    <span>${rating}</span>
                </div>
            `;
        }

        const duration = calculateDuration(movement.exitTime, movement.entryTime);
        const durationDisplay = duration !== '-' ?
            `<span class="duration-badge">
                <i class="fas fa-clock"></i>
                ${duration}
            </span>` :
            '<span class="duration-badge pending">--</span>';

        let movementDisplay = '';
        if (exitDate && entryDate) {
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
            movementDisplay = `
                <div class="empty-movement">
                    <div class="no-time-recorded">
                        <i class="fas fa-question-circle"></i>
                        <span>${t('noTimeRecorded') || 'لم يُسجل وقت'}</span>
                    </div>
                </div>
            `;
        }

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

// Initialize Flatpickr Calendar with Date Highlighting
function initMovementHistoryCalendar() {
    const dateInput = document.getElementById('historyDateFilter');
    if (!dateInput) return;

    // Get dates with movement data and order counts
    const driver = drivers.find(d => d.id === currentDriverId);
    const datesWithData = new Map();

    if (driver && driver.movements) {
        driver.movements.forEach(movement => {
            if (movement.date) {
                const dateObj = new Date(movement.date);
                const dateStr = dateObj.toDateString();
                const ordersCount = movement.orders || 0;
                
                if (datesWithData.has(dateStr)) {
                    datesWithData.set(dateStr, datesWithData.get(dateStr) + ordersCount);
                } else {
                    datesWithData.set(dateStr, ordersCount);
                }
            }
        });
    }

    // Initialize Flatpickr
    flatpickr(dateInput, {
        dateFormat: 'Y-m-d',
        onChange: function(selectedDates, dateStr, instance) {
            filterMovementHistoryByDate();
        },
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            const dateStr = dayElem.dateObj.toDateString();
            if (datesWithData.has(dateStr)) {
                const ordersCount = datesWithData.get(dateStr);
                dayElem.classList.add('has-data');
                
                // Add color class based on orders count
                if (ordersCount < 25) {
                    dayElem.classList.add('orders-red');
                } else if (ordersCount >= 25 && ordersCount < 28) {
                    dayElem.classList.add('orders-orange');
                } else if (ordersCount >= 28 && ordersCount < 35) {
                    dayElem.classList.add('orders-green');
                }
            }
        }
    });
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



    logActivity('Edit Movement', `Edited movement for driver: ${driver.name} (ID: ${driver.driverId}), orders changed from ${oldOrders} to ${newOrders}`);





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



    if (!isAdmin()) {



        showNotification('View only mode - cannot delete drivers', 'error');



        return;



    }



    



    const driver = drivers.find(d => d.id === driverId);



    if (!driver) return;



    



    // Show custom confirmation dialog



    showConfirmModal(



        t('confirmDeleteDriver') || 'Delete Driver',



        `Are you sure you want to delete driver "${driver.name}"? This action cannot be undone.`,



        () => deleteDriverConfirmed(driverId),



        'delete'



    );



}







// Delete Driver Confirmed Function



function deleteDriverConfirmed(driverId) {







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







// Sample data functions removed - app starts with empty database







// Sample data loading disabled - app starts with empty database



async function checkAndLoadSampleData() {



    // Do nothing - no sample data loaded



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







    document.querySelectorAll('.sidebar-link').forEach(link => {



        link.classList.remove('active');



    });







    const targetView = document.getElementById(viewName + 'View');



    if (targetView) {



        targetView.style.display = 'block';



        targetView.classList.add('active');



    }







    // Scroll to top when changing views



    window.scrollTo({ top: 0, behavior: 'smooth' });







    // Update page indicator



    updatePageIndicator(viewName);







    const sidebarLink = document.querySelector(`.sidebar-link[href="#${viewName}"]`);



    if (sidebarLink) {



        sidebarLink.classList.add('active');



    }







    if (viewName === 'dashboard') {



        renderHomeDashboard();



    } else if (viewName === 'users') {



        renderUsers();



    }



}







// Save bikes to Firebase



async function saveBikes() {



    if (!db) return;



    try {



        const bikesObj = {};



        bikes.forEach(bike => {



            bikesObj[bike.id] = bike;



        });



        await window.firebaseSet(dbRefs.bikes, bikesObj);



    } catch (error) {



        console.error('Error saving bikes:', error);



        showNotification('Error saving bikes to cloud', 'error');



    }



}







// Save users to Firebase



async function saveUsers() {



    if (!db) return;



    try {



        const usersObj = {};



        users.forEach(user => {



            usersObj[user.id] = user;



        });



        await window.firebaseSet(dbRefs.users, usersObj);



    } catch (error) {



        console.error('Error saving users:', error);



        showNotification('Error saving users to cloud', 'error');



    }



}







// Save settings to Firebase



async function saveSettingsToFirebase(settings) {



    if (!db) return;



    try {



        await window.firebaseSet(dbRefs.settings, settings);



    } catch (error) {



        console.error('Error saving settings:', error);



    }



}







// ===== Authentication System =====







function initAuth() {



    if (!currentUser) {



        showLoginModal();



    } else {



        hideLoginModal();



        updateUserDisplay();



        applyRoleRestrictions();



        renderUsers();



    }



}







function showLoginModal() {



    const modal = document.getElementById('loginModal');



    if (modal) {



        modal.classList.add('active');



        document.body.style.overflow = 'hidden';



    }



}







function hideLoginModal() {



    const modal = document.getElementById('loginModal');



    if (modal) {



        modal.classList.remove('active');



        document.body.style.overflow = '';



    }



}







function handleLogin(e) {



    e.preventDefault();



    const username = document.getElementById('loginUsername').value.trim();



    const password = document.getElementById('loginPassword').value;







    const user = users.find(u => u.username === username && u.password === password);







    if (user) {



        currentUser = user;



        localStorage.setItem('garageAppCurrentUser', JSON.stringify(user));



        hideLoginModal();



        updateUserDisplay();



        applyRoleRestrictions();



        showNotification(`Welcome, ${user.username}!`, 'success');



        renderUsers();



    } else {



        showNotification('Invalid username or password', 'error');



    }



}







function logout() {



    // Show custom confirmation dialog



    showConfirmModal(



        t('confirmLogout') || 'Logout Confirmation',



        'Are you sure you want to logout? Any unsaved changes will be lost.',



        () => logoutConfirmed(),



        'logout'



    );



}







// Logout Confirmed Function



function logoutConfirmed() {



        if(currentUser) logActivity('Logout', `User ${currentUser.username} logged out of the system.`);
currentUser = null;



    localStorage.removeItem('garageAppCurrentUser');



    location.reload();



}







function updateUserDisplay() {



    if (!currentUser) return;







    const userNameEl = document.getElementById('headerUserName');



    const userRoleEl = document.getElementById('headerUserRole');







    if (userNameEl) {



        userNameEl.textContent = currentUser.username;



    }







    if (userRoleEl) {



        let roleText = 'User';
        let roleClass = 'user';
        
        if (currentUser.role === ROLE_ADMIN) {
            roleText = 'Admin';
            roleClass = 'admin';
        } else if (currentUser.role === ROLE_GARAGE_MANAGER) {
            roleText = 'Garage Manager';
            roleClass = 'garage-manager';
        } else if (currentUser.role === ROLE_VIEWER) {
            roleText = 'Viewer';
            roleClass = 'viewer';
        }
        
        userRoleEl.textContent = roleText;
        userRoleEl.className = 'user-role ' + roleClass;



    }



}







function applyRoleRestrictions() {



    if (!currentUser) return;



    // Remove all role classes first
    document.body.classList.remove('is-admin', 'is-garage-manager', 'is-viewer');



    // Add appropriate class based on role
    if (currentUser.role === ROLE_ADMIN) {
        document.body.classList.add('is-admin');
    } else if (currentUser.role === ROLE_GARAGE_MANAGER) {
        document.body.classList.add('is-garage-manager');
    } else if (currentUser.role === ROLE_VIEWER) {
        document.body.classList.add('is-viewer');
    }

}







function isAdmin() {



    return currentUser && currentUser.role === ROLE_ADMIN;



}

function isGarageManager() {



    return currentUser && currentUser.role === ROLE_GARAGE_MANAGER;



}

function isViewer() {



    return currentUser && currentUser.role === ROLE_VIEWER;



}

function canManageUsers() {



    return isAdmin();



}

function canManageDrivers() {



    return isAdmin() || isGarageManager();



}

function canManageBikes() {



    return isAdmin();



}

function canRecordMovements() {



    return isAdmin() || isGarageManager();



}

function canViewOnly() {



    return isViewer();



}







function requireAdmin() {



    if (!isAdmin()) {



        showNotification('Admin privileges required', 'error');



        return false;



    }



    return true;



}







function showAddBikeModal() {



    if (!canManageBikes()) {



        showNotification('View only mode - cannot add bikes', 'error');



        return;



    }



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



    logActivity('Add Bike', `Added bike: ${bike.number} (Status: ${bike.status}, Battery: ${bike.batteryLife}%)`);

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



    logActivity('Edit Bike', `Updated bike: ${bike.number} (Status: ${bike.status}, Battery: ${bike.batteryLife}%)`);

}







function deleteBike(id) {



    if (!isAdmin()) {



        showNotification('View only mode - cannot delete bikes', 'error');



        return;



    }



    



    const bike = bikes.find(b => b.id === id);



    if (!bike) return;



    



    // Show custom confirmation dialog



    showConfirmModal(



        t('confirmDeleteBike') || 'Delete Bike',



        `Are you sure you want to delete bike "${bike.number}"? This action cannot be undone.`,



        () => deleteBikeConfirmed(id),



        'delete'



    );



}







// Delete Bike Confirmed Function



function deleteBikeConfirmed(id) {



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



    logActivity('Delete Bike', `Deleted bike with ID: ${id}`);

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







    // 5. Total Orders Summary



    const totalOrders = drivers.reduce((sum, d) => sum + (parseInt(d.totalOrders) || 0), 0);



    animateNumber('dashboardTotalOrders', totalOrders);







    // 6. Fleet Distribution Chart



    updateFleetDistributionChart();







    // 7. Top Performing Drivers



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







    const sortedDrivers = [...drivers].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5);







    if (sortedDrivers.length === 0) {



        list.innerHTML = `<p style="text-align:center; color:var(--gray-400); padding:20px;">No driver data available</p>`;



        return;



    }







    const medalClass = (i) => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';







    list.innerHTML = sortedDrivers.map((d, index) => `



        <div class="db-rank-item">



            <div class="db-rank-medal ${medalClass(index)}">${index + 1}</div>



            <div class="db-rank-info">



                <span class="db-rank-name">${escapeHtml(d.name)}</span>



                <span class="db-rank-orders"><i class="fas fa-shopping-bag"></i> ${d.totalOrders} Orders</span>



            </div>



            <span class="db-rank-badge ${d.status}">${t(d.status)}</span>



        </div>



    `).join('');



}







function renderRecentActivity() {



    const list = document.getElementById('homeRecentActivity');



    if (!list) return;







    let allMovements = [];



    drivers.forEach(d => {



        if (d.movements) {



            d.movements.forEach(m => {



                allMovements.push({ driverName: d.name, ...m });



            });



        }



    });







    allMovements.sort((a, b) => new Date(b.exitTime || b.timestamp) - new Date(a.exitTime || a.timestamp));



    const recent = allMovements.slice(0, 6);







    if (recent.length === 0) {



        list.innerHTML = `<p style="text-align:center; color:var(--gray-400); padding:20px;">No recent activity</p>`;



        return;



    }







    list.innerHTML = recent.map(m => {



        const isExit = m.type === 'exit' || (m.exitTime && !m.entryTime);



        const time = new Date(m.exitTime || m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });







        return `



            <div class="db-activity-item">



                <div class="db-activity-icon ${isExit ? 'exit' : 'entry'}">



                    <i class="fas fa-sign-${isExit ? 'out' : 'in'}-alt"></i>



                </div>



                <div class="db-activity-body">



                    <div class="db-activity-title">${escapeHtml(m.driverName)} <span>${isExit ? 'Left' : 'Returned'}</span></div>



                    <div class="db-activity-time">${time}</div>



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







// ===== Sidebar Functions =====



function toggleSidebar() {



    const sidebar = document.getElementById('sidebar');



    const overlay = document.getElementById('sidebarOverlay');



    const toggle = document.getElementById('sidebarToggle');







    if (sidebar && overlay) {



        sidebar.classList.toggle('open');



        overlay.classList.toggle('active');







        if (toggle) {



            toggle.classList.toggle('hidden', sidebar.classList.contains('open'));



        }







        // Prevent body scroll when sidebar is open



        if (sidebar.classList.contains('open')) {



            document.body.style.overflow = 'hidden';



        } else {



            document.body.style.overflow = '';



        }



    }



}







function updateSidebarTime() {



    const sidebarTime = document.getElementById('sidebarTime');



    if (sidebarTime) {



        const now = new Date();



        const hours = String(now.getHours()).padStart(2, '0');



        const minutes = String(now.getMinutes()).padStart(2, '0');



        sidebarTime.textContent = `${hours}:${minutes}`;



    }



}







// Update sidebar time every minute



setInterval(updateSidebarTime, 60000);







// Close sidebar when pressing Escape key



document.addEventListener('keydown', (e) => {



    if (e.key === 'Escape') {



        const sidebar = document.getElementById('sidebar');



        if (sidebar && sidebar.classList.contains('open')) {



            toggleSidebar();



        }



    }



});







// Update page indicator in header



function updatePageIndicator(viewName) {



    const indicator = document.getElementById('pageIndicator');



    if (!indicator) return;







    const pageData = {



        'drivers': { icon: 'fa-users', key: 'drivers', text: 'Drivers' },



        'bikes': { icon: 'fa-motorcycle', key: 'bikes', text: 'Bikes' },



        'dashboard': { icon: 'fa-chart-pie', key: 'dashboard', text: 'Dashboard' },



        'settings': { icon: 'fa-cog', key: 'settings', text: 'Settings' },



        'users': { icon: 'fa-user-shield', key: 'users', text: 'User Management' }



    };







    const page = pageData[viewName];



    if (page) {



        const currentLang = localStorage.getItem('garageAppLanguage') || 'en';



        const text = currentLang === 'en' ? page.text : t(page.key);



        indicator.innerHTML = `<i class="fas ${page.icon}"></i><span>${text}</span>`;



    }



}







// ===== User Management Functions =====







function renderUsers(searchTerm = '') {



    const grid = document.getElementById('usersGrid');



    if (!grid) return;







    const filteredUsers = users.filter(user => {



        if (!searchTerm) return true;



        return user.username.toLowerCase().includes(searchTerm.toLowerCase());



    });







    if (filteredUsers.length === 0) {



        grid.innerHTML = `



            <div class="empty-state" style="grid-column: 1 / -1;">



                <i class="fas fa-users-slash"></i>



                <h3>No Users</h3>



                <p>Add a new user to get started</p>



            </div>



        `;



        return;



    }







    grid.innerHTML = filteredUsers.map(user => {



        const isCurrentUser = currentUser && currentUser.id === user.id;



        const isDefaultAdmin = user.username === 'anon' && user.password === 'anon';







        return `



            <div class="user-card">



                <div class="user-card-header">



                    <div class="user-card-avatar">



                        <i class="fas fa-user"></i>



                    </div>



                    <div class="user-card-info">



                        <h4>${escapeHtml(user.username)} ${isCurrentUser ? '<small>(You)</small>' : ''} ${isDefaultAdmin ? '<small>(Default)</small>' : ''}</h4>



                        <span class="user-card-role ${user.role}">



                            <i class="fas fa-${getRoleIcon(user.role)}"></i>



                            ${getRoleLabel(user.role)}



                        </span>



                    </div>



                </div>



                <div class="user-card-footer">



                    <button class="btn-edit" onclick="showEditUserModal('${user.id}')">



                        <i class="fas fa-edit"></i> Edit



                    </button>



                    ${!isDefaultAdmin ? `



                    <button class="btn-delete" onclick="deleteUser('${user.id}')">



                        <i class="fas fa-trash-alt"></i> Delete



                    </button>



                    ` : '<button class="btn-delete" disabled style="opacity: 0.5; cursor: not-allowed;"><i class="fas fa-lock"></i> Protected</button>'}



                </div>



            </div>



        `;



    }).join('');



}







function showAddUserModal() {



    if (!requireAdmin()) return;



    document.getElementById('addUserModal').classList.add('active');



    document.getElementById('newUsername').focus();



}







function closeAddUserModal() {



    document.getElementById('addUserModal').classList.remove('active');



    document.getElementById('addUserForm').reset();



    document.getElementById('newUserRole').value = ROLE_ADMIN;



    document.getElementById('selectedUserRole').textContent = 'Admin';



}







function handleAddUser(e) {



    e.preventDefault();



    if (!requireAdmin()) return;







    const username = document.getElementById('newUsername').value.trim();



    const password = document.getElementById('newUserPassword').value;



    const role = document.getElementById('newUserRole').value;







    if (!username || !password) {



        showNotification('Username and password are required', 'error');



        return;



    }







    if (users.some(u => u.username === username)) {



        showNotification('Username already exists', 'error');



        return;



    }







    const newUser = {



        id: generateId(),



        username: username,



        password: password,



        role: role,



        createdAt: new Date().toISOString()



    };







    users.push(newUser);



    saveUsers();



    renderUsers();



    closeAddUserModal();



    showNotification(`User "${username}" created successfully`);

    logActivity('Add User', `Added user: ${username} with role: ${role}`);

}







function showEditUserModal(userId) {



    if (!requireAdmin()) return;







    const user = users.find(u => u.id === userId);



    if (!user) return;







    document.getElementById('editUserId').value = user.id;



    document.getElementById('editUsername').value = user.username;



    document.getElementById('editUserPassword').value = '';



    document.getElementById('editUserRole').value = user.role;



    document.getElementById('selectedEditUserRole').textContent = getRoleLabel(user.role);







    document.getElementById('editUserModal').classList.add('active');



}







function closeEditUserModal() {



    document.getElementById('editUserModal').classList.remove('active');



    document.getElementById('editUserForm').reset();



}







function handleEditUser(e) {



    e.preventDefault();



    if (!requireAdmin()) return;







    const userId = document.getElementById('editUserId').value;



    const user = users.find(u => u.id === userId);



    if (!user) return;







    const newUsername = document.getElementById('editUsername').value.trim();



    const newPassword = document.getElementById('editUserPassword').value;



    const newRole = document.getElementById('editUserRole').value;







    if (!newUsername) {



        showNotification('Username is required', 'error');



        return;



    }







    if (newUsername !== user.username && users.some(u => u.username === newUsername)) {



        showNotification('Username already exists', 'error');



        return;



    }







    user.username = newUsername;



    user.role = newRole;



    if (newPassword) {



        user.password = newPassword;



    }







    saveUsers();







    // Update current user display if editing self



    if (currentUser && currentUser.id === userId) {



        currentUser = user;



        localStorage.setItem('garageAppCurrentUser', JSON.stringify(user));



        updateUserDisplay();



        applyRoleRestrictions();



    }







    renderUsers();



    closeEditUserModal();



    showNotification(`User "${newUsername}" updated successfully`);

    logActivity('Edit User', `Updated user: ${user.username} to ${newUsername}, role changed to ${newRole}`);

}







function deleteUser(userId) {



    if (!requireAdmin()) return;







    const user = users.find(u => u.id === userId);



    if (!user) return;







    // Prevent deleting admin users



    if (user.role === 'admin') {



        showNotification('Cannot delete admin users', 'error');



        return;

    }





    // Prevent self-deletion



    if (currentUser && currentUser.id === userId) {



        showNotification('Cannot delete yourself', 'error');



        return;



    }







    // Show custom confirmation dialog



    showConfirmModal(



        t('confirmDeleteUser') || 'Delete User',



        `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`,



        () => deleteUserConfirmed(userId),



        'delete'



    );



}







// Delete User Confirmed Function
function deleteUserConfirmed(userId) {

    const user = users.find(u => u.id === userId);
    const username = user ? user.username : 'Unknown';

    users = users.filter(u => u.id !== userId);

    saveUsers();

    renderUsers();

    showNotification(`User "${username}" deleted successfully`);

    logActivity('Delete User', `Deleted user: ${username}`);

}




function toggleUserRoleDropdown() {



    const menu = document.getElementById('userRoleMenu');



    menu.classList.toggle('active');



}







function getRoleIcon(role) {
    if (role === ROLE_ADMIN) return 'user-shield';
    if (role === ROLE_GARAGE_MANAGER) return 'clipboard-check';
    if (role === ROLE_VIEWER) return 'eye';
    return 'user';
}

function getRoleLabel(role) {
    if (role === ROLE_ADMIN) return 'Admin';
    if (role === ROLE_GARAGE_MANAGER) return 'Garage Manager';
    if (role === ROLE_VIEWER) return 'Viewer';
    return 'User';
}

function selectUserRole(value, label) {



    document.getElementById('newUserRole').value = value;



    document.getElementById('selectedUserRole').textContent = label;



    document.getElementById('userRoleMenu').classList.remove('active');







    const infoText = document.getElementById('roleInfoText');



    if (value === ROLE_ADMIN) {



        infoText.textContent = 'Admin users can add, edit, and delete all records including managing other users.';



    } else if (value === ROLE_GARAGE_MANAGER) {



        infoText.textContent = 'Garage Manager users can record driver entry/exit movements only. Cannot manage users, bikes, or delete data.';



    } else if (value === ROLE_VIEWER) {



        infoText.textContent = 'Viewer accounts can only view data and cannot make any changes.';



    } else {



        infoText.textContent = 'User accounts can only view data and cannot make any changes.';



    }



}







function toggleEditUserRoleDropdown() {



    const menu = document.getElementById('editUserRoleMenu');



    menu.classList.toggle('active');



}







function selectEditUserRole(value, label) {



    document.getElementById('editUserRole').value = value;



    document.getElementById('selectedEditUserRole').textContent = label;



    document.getElementById('editUserRoleMenu').classList.remove('active');



}







function toggleEditUserPasswordVisibility() {



    const passwordInput = document.getElementById('editUserPassword');



    const icon = document.getElementById('editUserPasswordIcon');







    if (passwordInput.type === 'password') {



        passwordInput.type = 'text';



        icon.className = 'fas fa-eye-slash';



    } else {



        passwordInput.type = 'password';



        icon.className = 'fas fa-eye';



    }



}







function toggleLoginPasswordVisibility() {



    const passwordInput = document.getElementById('loginPassword');



    const icon = document.getElementById('loginPasswordIcon');







    if (passwordInput.type === 'password') {



        passwordInput.type = 'text';



        icon.className = 'fas fa-eye-slash';



    } else {



        passwordInput.type = 'password';



        icon.className = 'fas fa-eye';



    }



}







function toggleNewUserPasswordVisibility() {



    const passwordInput = document.getElementById('newUserPassword');



    const icon = document.getElementById('newUserPasswordIcon');







    if (passwordInput.type === 'password') {



        passwordInput.type = 'text';



        icon.className = 'fas fa-eye-slash';



    } else {



        passwordInput.type = 'password';



        icon.className = 'fas fa-eye';



    }



}







// ===== Data Import/Export Functions =====







function exportData() {



    if (!isAdmin()) {



        showNotification('Admin privileges required', 'error');



        return;



    }



    const data = {



        exportDate: new Date().toISOString(),



        version: '1.0',



        users: users,



        drivers: drivers,



        bikes: bikes



    };







    const dataStr = JSON.stringify(data, null, 2);



    const blob = new Blob([dataStr], { type: 'application/json' });



    const url = URL.createObjectURL(blob);







    const link = document.createElement('a');



    link.href = url;



    link.download = `garage-tft-backup-${new Date().toISOString().split('T')[0]}.json`;



    document.body.appendChild(link);



    link.click();



    document.body.removeChild(link);



    URL.revokeObjectURL(url);







    showNotification('Data exported successfully');



}







async function importData(input) {



    if (!isAdmin()) {



        showNotification('Admin privileges required', 'error');



        return;



    }



    const file = input.files[0];



    if (!file) return;







    const reader = new FileReader();



    reader.onload = async function(e) {



        try {



            const data = JSON.parse(e.target.result);







            if (!confirm('This will replace all current data. Are you sure you want to continue?')) {



                input.value = '';



                return;



            }







            // Validate data structure and update arrays



            if (data.users && Array.isArray(data.users)) {



                users = data.users;



            }



            if (data.drivers && Array.isArray(data.drivers)) {



                drivers = data.drivers;



            }



            if (data.bikes && Array.isArray(data.bikes)) {



                bikes = data.bikes;



            }







            // Save to Firebase



            await saveUsers();



            await saveDrivers();



            await saveBikes();







            // Re-initialize default user if no users exist



            initializeDefaultUser();







            // Refresh displays



            renderDrivers();



            renderBikes();



            renderUsers();



            updateStatistics();







            showNotification('Data imported successfully to cloud');



        } catch (error) {



            showNotification('Invalid file format', 'error');



            console.error('Import error:', error);



        }



        input.value = '';



    };



    reader.readAsText(file);



}







function clearAllData() {



    if (!isAdmin()) {



        showNotification('Admin privileges required', 'error');



        return;



    }



    



    // Show password confirmation modal instead of simple confirm



    showClearDataModal();



}







// Show Clear Data Modal



function showClearDataModal() {



    document.getElementById('clearDataModal').classList.add('active');



    document.getElementById('confirmPassword').focus();



}







// Close Clear Data Modal



function closeClearDataModal() {



    document.getElementById('clearDataModal').classList.remove('active');



    document.getElementById('confirmClearForm').reset();



}







// Handle Confirm Clear Data Form



function handleConfirmClearData(e) {



    e.preventDefault();



    



    const password = document.getElementById('confirmPassword').value;



    



    // Validate password



    if (password !== 'anon') {



        showNotification('Incorrect password. Access denied.', 'error');



        document.getElementById('confirmPassword').value = '';



        document.getElementById('confirmPassword').focus();



        return;



    }



    



    // Password is correct, proceed with data clearing



    performDataClearing();



    closeClearDataModal();



}







// Perform the actual data clearing



async function performDataClearing() {



    // Clear all data from Firebase



    if (db) {



        try {



                        logActivity('Delete All Data', `Admin cleared all system data.`);
await window.firebaseRemove(dbRefs.drivers);



            await window.firebaseRemove(dbRefs.bikes);



            await window.firebaseRemove(dbRefs.users);
        await window.firebaseRemove(dbRefs.logs);



        } catch (error) {



            console.error('Error clearing Firebase data:', error);



        }



    }







    // Also clear localStorage backup



    localStorage.removeItem('garageAppDrivers');



    localStorage.removeItem('garageAppBikes');



    localStorage.removeItem('garageAppUsers');







    // Reset arrays



    drivers = [];



    bikes = [];



    users = [];







    // Re-initialize default user



    initializeDefaultUser();







    // Refresh displays



    renderDrivers();



    renderBikes();



    renderUsers();



    updateStatistics();







    showNotification('All data has been cleared');



}







// Garage Address Functions



function showEditAddressModal() {



    if (!isAdmin()) {



        showNotification('Admin privileges required', 'error');



        return;



    }







    const currentAddress = localStorage.getItem('garageAppAddress') || 'Aristomenous 69';



    document.getElementById('garageAddressInput').value = currentAddress;



    document.getElementById('editAddressModal').classList.add('active');



}







function closeEditAddressModal() {



    document.getElementById('editAddressModal').classList.remove('active');



    document.getElementById('editAddressForm').reset();



}







async function handleEditAddress(e) {



    e.preventDefault();



    if (!isAdmin()) {



        showNotification('Admin privileges required', 'error');



        return;



    }







    const newAddress = document.getElementById('garageAddressInput').value.trim();



    if (!newAddress) {



        showNotification('Address is required', 'error');



        return;



    }







    // Save to localStorage for immediate use



    localStorage.setItem('garageAppAddress', newAddress);







    // Save to Firebase



    await saveSettingsToFirebase({ garageAddress: newAddress });
        logActivity('Edit Settings', `Updated garage address to: ${newAddress}`);







    updateGarageAddress();



    closeEditAddressModal();



    showNotification('Garage address updated successfully');



}







function updateGarageAddress() {



    const address = localStorage.getItem('garageAppAddress') || 'Aristomenous 69';



    const addressElement = document.querySelector('.garage-address span');



    if (addressElement) {



        addressElement.textContent = address;



    }



}







// Initialize garage address on page load



document.addEventListener('DOMContentLoaded', () => {



    updateGarageAddress();



});







// Add event listener for edit address form



document.addEventListener('DOMContentLoaded', () => {



    const editAddressForm = document.getElementById('editAddressForm');



    if (editAddressForm) {



        editAddressForm.addEventListener('submit', handleEditAddress);



    }



});






// --- Activity Logging System ---
async function logActivity(action, details) {
    if (!currentUser) return; // Don't log if not logged in

    const logEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        username: currentUser.username || 'System',
        role: currentUser.role || 'system',
        action: action,
        details: details
    };

    activityLogs.unshift(logEntry); // Add to beginning
    cleanupOldLogs();
    
    // Save to Firebase
    try {
        const logsObj = {};
        activityLogs.forEach(log => {
            logsObj[log.id] = log;
        });
        await window.firebaseSet(dbRefs.logs, logsObj);
        renderActivityLogs();
    } catch (error) {
        console.error('Error saving activity log:', error);
    }
}


async function cleanupOldLogs() {
    if (!activityLogs || activityLogs.length === 0) return;
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const initialLength = activityLogs.length;
    
    activityLogs = activityLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= threeMonthsAgo;
    });
    
    if (activityLogs.length !== initialLength) {
        try {
            const logsObj = {};
            activityLogs.forEach(log => {
                logsObj[log.id] = log;
            });
            await window.firebaseSet(dbRefs.logs, logsObj);
            console.log(`Cleaned up ${initialLength - activityLogs.length} old activity logs.`);
            renderActivityLogs();
        } catch (error) {
            console.error('Error cleaning up logs:', error);
        }
    }
}

function renderActivityLogs() {
    const tbody = document.getElementById('activityLogTableBody');
    const noLogsMsg = document.getElementById('noLogsMessage');
    const searchInput = document.getElementById('logSearchInput');
    const dateFilter = document.getElementById('logDateFilter');
    
    if (!tbody) return; // Element not ready

    const searchTerm = (searchInput ? searchInput.value.toLowerCase() : '');
    const filterDate = (dateFilter ? dateFilter.value : '');

    let filteredLogs = activityLogs.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(searchTerm) || 
                              log.details.toLowerCase().includes(searchTerm) ||
                              log.username.toLowerCase().includes(searchTerm);
        
        let matchesDate = true;
        if (filterDate) {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            matchesDate = (logDate === filterDate);
        }

        return matchesSearch && matchesDate;
    });

    if (filteredLogs.length === 0) {
        tbody.innerHTML = '';
        if (noLogsMsg) noLogsMsg.style.display = 'block';
    } else {
        if (noLogsMsg) noLogsMsg.style.display = 'none';
        tbody.innerHTML = filteredLogs.map(log => {
            const dateObj = new Date(log.timestamp);
            const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            let actionColor = 'var(--text-primary)';
            if (log.action.includes('Delete') || log.action.includes('Clear') || log.action.includes('Remove')) actionColor = 'var(--danger-color)';
            else if (log.action.includes('Add') || log.action.includes('Create') || log.action.includes('Import')) actionColor = 'var(--success-color)';
            else if (log.action.includes('Edit') || log.action.includes('Update')) actionColor = 'var(--warning-color)';
            else if (log.action.includes('Login') || log.action.includes('Logout')) actionColor = 'var(--accent-color)';


            let actionBg = 'rgba(255,255,255,0.05)';
            let actionIcon = 'fa-info-circle';
            
            if (log.action.includes('Delete') || log.action.includes('Clear') || log.action.includes('Remove')) {
                actionColor = '#ef4444'; // Red
                actionBg = 'rgba(239, 68, 68, 0.1)';
                actionIcon = 'fa-trash-alt';
            }
            else if (log.action.includes('Add') || log.action.includes('Create') || log.action.includes('Import')) {
                actionColor = '#10b981'; // Green
                actionBg = 'rgba(16, 185, 129, 0.1)';
                actionIcon = 'fa-plus-circle';
            }
            else if (log.action.includes('Edit') || log.action.includes('Update')) {
                actionColor = '#f59e0b'; // Yellow
                actionBg = 'rgba(245, 158, 11, 0.1)';
                actionIcon = 'fa-edit';
            }
            else if (log.action.includes('Login') || log.action.includes('Logout')) {
                actionColor = '#3b82f6'; // Blue
                actionBg = 'rgba(59, 130, 246, 0.1)';
                actionIcon = log.action.includes('Login') ? 'fa-sign-in-alt' : 'fa-sign-out-alt';
            }

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.03)'; this.style.transform='scale(1.002)';" onmouseout="this.style.background='transparent'; this.style.transform='scale(1)';">
                    <td style="padding: 18px 20px; white-space: nowrap;">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="color: var(--text-primary); font-weight: 500; font-size: 0.95rem;">${dateObj.toLocaleDateString()}</span>
                            <span style="color: var(--text-secondary); font-size: 0.8rem;"><i class="far fa-clock" style="margin-right: 4px;"></i>${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </td>
                    <td style="padding: 18px 20px;">
                        <span style="display: inline-flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">
                            <i class="fas ${log.role === 'admin' ? 'fa-user-shield' : 'fa-user'}" style="color: ${log.role === 'admin' ? '#c084fc' : '#9ca3af'}; font-size: 0.9rem;"></i>
                            ${log.username}
                        </span>
                    </td>
                    <td style="padding: 18px 20px;">
                        <span style="display: inline-flex; align-items: center; gap: 8px; background: ${actionBg}; color: ${actionColor}; padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.3px;">
                            <i class="fas ${actionIcon}" style="font-size: 0.9rem;"></i>
                            ${log.action}
                        </span>
                    </td>
                    <td style="padding: 18px 20px; color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5; max-width: 300px;">
                        ${log.details}
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function filterActivityLogs() {
    renderActivityLogs();
}

function clearActivityLogsFilter() {
    const searchInput = document.getElementById('logSearchInput');
    const dateFilter = document.getElementById('logDateFilter');
    if (searchInput) searchInput.value = '';
    if (dateFilter) dateFilter.value = '';
    renderActivityLogs();
}

function openDeleteLogsPasswordModal() {
    document.getElementById('deleteLogsPasswordModal').classList.add('active');
    document.getElementById('deleteLogsPassword').value = '';
    document.getElementById('deleteLogsPassword').focus();
}

function closeDeleteLogsPasswordModal() {
    document.getElementById('deleteLogsPasswordModal').classList.remove('active');
}

async function confirmDeleteLogs() {
    const password = document.getElementById('deleteLogsPassword').value;

    if (password !== 'anon') {
        showNotification('Incorrect password. Access denied.', 'error');
        document.getElementById('deleteLogsPassword').value = '';
        document.getElementById('deleteLogsPassword').focus();
        return;
    }

    // Close password modal
    closeDeleteLogsPasswordModal();

    // Show confirmation modal
    const result = await showConfirmationDialog(
        '🗑️ Delete All Activity Logs',
        'Are you sure you want to delete all activity logs? This action cannot be undone.',
        'Delete',
        'Cancel',
        'danger'
    );

    if (!result) {
        return;
    }

    try {
        // Clear local array
        activityLogs = [];

        // Clear from Firebase
        await window.firebaseSet(dbRefs.logs, {});

        // Update UI
        renderActivityLogs();
        showNotification('✅ All activity logs deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting activity logs:', error);
        showNotification('Error deleting activity logs', 'error');
    }
}

async function showConfirmationDialog(title, message, confirmText, cancelText, type = 'primary') {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease;
        `;

        const iconColor = type === 'danger' ? '#ef4444' : '#6366f1';

        modal.innerHTML = `
            <div style="text-align: center;">
                <div style="
                    font-size: 48px;
                    margin-bottom: 16px;
                    color: ${iconColor};
                ">${type === 'danger' ? '⚠️' : 'ℹ️'}</div>
                <h2 style="
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0 0 12px 0;
                ">${title}</h2>
                <p style="
                    font-size: 16px;
                    color: #6b7280;
                    margin: 0 0 24px 0;
                    line-height: 1.5;
                ">${message}</p>
                <div style="
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                ">
                    <button id="cancelBtn" style="
                        padding: 12px 24px;
                        border: 2px solid #e5e7eb;
                        background: white;
                        color: #374151;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">${cancelText}</button>
                    <button id="confirmBtn" style="
                        padding: 12px 24px;
                        border: none;
                        background: ${type === 'danger' ? '#ef4444' : '#6366f1'};
                        color: white;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">${confirmText}</button>
                </div>
            </div>
        `;

        // Add styles for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .confirmation-modal button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            .confirmation-modal button:active {
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add event listeners
        const confirmBtn = modal.querySelector('#confirmBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');

        confirmBtn.addEventListener('click', () => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.head.removeChild(style);
                resolve(true);
            }, 300);
        });

        cancelBtn.addEventListener('click', () => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.head.removeChild(style);
                resolve(false);
            }, 300);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    document.head.removeChild(style);
                    resolve(false);
                }, 300);
            }
        });

        // Add fadeOut animation
        style.textContent += `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
    });
}

async function deleteAllActivityLogs() {
    openDeleteLogsPasswordModal();
}

// Call renderActivityLogs when showing users view
const originalShowView = window.showView;
if (!window._activityLogsPatched) {
    window._activityLogsPatched = true;
    window.showView = function(viewId) {
        if (originalShowView) originalShowView(viewId);
        
        // Also run standard behavior since showView might be local
        document.querySelectorAll('.app-view').forEach(view => {
            if (view) view.style.display = 'none';
        });
        document.querySelectorAll('.sidebar-link').forEach(link => {
            if (link) link.classList.remove('active');
        });
        
        const view = document.getElementById(viewId + 'View');
        if (view) {
            view.style.display = 'block';
            
            // Add animation class
            view.classList.remove('fade-in');
            void view.offsetWidth; // Trigger reflow
            view.classList.add('fade-in');
        }
        
        const link = document.querySelector(`.sidebar-link[href="#${viewId}"]`);
        if (link) {
            link.classList.add('active');
            
            const textEl = link.querySelector('span[data-key]') || link.querySelector('span');
            if (textEl && document.getElementById('pageIndicator')) {
                const indicatorText = document.getElementById('pageIndicator').querySelector('span');
                const indicatorIcon = document.getElementById('pageIndicator').querySelector('i');
                const linkIcon = link.querySelector('i');
                
                if (indicatorText && indicatorIcon && linkIcon) {
                    indicatorText.textContent = textEl.textContent;
                    if (textEl.hasAttribute('data-key')) {
                        indicatorText.setAttribute('data-key', textEl.getAttribute('data-key'));
                    } else {
                        indicatorText.removeAttribute('data-key');
                    }
                    indicatorIcon.className = linkIcon.className;
                }
            }
        }
        
        if (viewId === 'users') {
            renderActivityLogs();
        }
    };
}
