// Loading Screen Management
class LoadingManager {
    constructor() {
        this.progress = 0;
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.currentLanguage = 'en';
        this.init();
    }

    init() {
        this.detectLanguage();
        this.simulateLoading();
    }

    detectLanguage() {
        // Detect language from HTML dir attribute or browser language
        const htmlDir = document.documentElement.getAttribute('dir');
        if (htmlDir === 'rtl') {
            this.currentLanguage = 'ar';
        } else {
            const browserLang = navigator.language || navigator.userLanguage;
            this.currentLanguage = browserLang.startsWith('ar') ? 'ar' : 'en';
        }
    }

    getText(english, arabic) {
        return this.currentLanguage === 'en' ? english : arabic;
    }

    simulateLoading() {
        const loadingSteps = [
            { 
                progress: 20, 
                messageEn: 'Initializing...',
                messageAr: 'جاري التهيئة...'
            },
            { 
                progress: 40, 
                messageEn: 'Loading data...',
                messageAr: 'جاري تحميل البيانات...'
            },
            { 
                progress: 60, 
                messageEn: 'Setting up interface...',
                messageAr: 'جاري إعداد الواجهة...'
            },
            { 
                progress: 80, 
                messageEn: 'Almost ready...',
                messageAr: 'تقريباً جاهز...'
            },
            { 
                progress: 100, 
                messageEn: 'Complete!',
                messageAr: 'مكتمل!'
            }
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < loadingSteps.length) {
                const step = loadingSteps[currentStep];
                const message = this.getText(step.messageEn, step.messageAr);
                this.updateProgress(step.progress, message);
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    this.hideLoadingScreen();
                }, 500);
            }
        }, 800);
    }

    updateProgress(progress, message) {
        this.progress = progress;
        if (this.progressFill) {
            this.progressFill.style.width = `${progress}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = `${progress}%`;
        }
    }

    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                // Trigger a custom event when loading is complete
                document.dispatchEvent(new CustomEvent('loadingComplete'));
            }, 500);
        }
    }
}

// Application State
class WorkManagerApp {
    constructor() {
        this.currentLanguage = 'en';
        this.currentTheme = 'light';
        this.lastFocusedElement = null;
        this.modalKeydownHandler = null;
        this.authUser = null;
        
        // Calendar state
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        
        this.data = {
            workEntries: [],
            expenses: [],
            debts: [],
            workSchedule: {
                monday: { isWorkDay: true, start: '09:00', end: '17:00' },
                tuesday: { isWorkDay: true, start: '09:00', end: '17:00' },
                wednesday: { isWorkDay: true, start: '09:00', end: '17:00' },
                thursday: { isWorkDay: true, start: '09:00', end: '17:00' },
                friday: { isWorkDay: true, start: '09:00', end: '17:00' },
                saturday: { isWorkDay: false, start: '09:00', end: '17:00' },
                sunday: { isWorkDay: false, start: '09:00', end: '17:00' }
            },
            dailySchedules: {}, // For specific date schedules
            holidays: [],
            settings: {
                hourlyRate: 10.00,
                currency: 'EUR',
                rateMode: 'hourly',
                monthlySalary: 0,
                workHoursPerDay: 8,
                workDaysPerWeek: 5,
                weeksPerMonth: 4.33,
                companyName: '',
                account: {
                    username: 'admin',
                    password: 'admin'
                }
            }
        };
        this.loadingManager = new LoadingManager();
        this.init();
    }

    init() {
        // Enforce auth before initializing the app
        this.guardAuthentication();
        // Wait for loading to complete before initializing the app
        document.addEventListener('loadingComplete', () => {
            this.loadData();
            this.loadSettingsToForms();
            this.setupEventListeners();
            this.updateDashboard();
            this.updateAllTables();
            this.applyTheme();
            this.setDefaultDates();
            this.initWorkSchedule();
            
            // Add a subtle entrance animation to the main content
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.opacity = '0';
                mainContent.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    mainContent.style.transition = 'all 0.6s ease-out';
                    mainContent.style.opacity = '1';
                    mainContent.style.transform = 'translateY(0)';
                }, 100);
            }
        });
    }



    // Data Management
    saveData() {
        localStorage.setItem('workManagerData', JSON.stringify(this.data));
    }

    loadData() {
        const saved = localStorage.getItem('workManagerData');
        if (saved) {
            this.data = { ...this.data, ...JSON.parse(saved) };
        }
    }

    loadSettingsToForms() {
        // Load salary settings
        if (this.data.settings) {
            // General -> company name
            const companyInput = document.getElementById('company-name');
            if (companyInput && typeof this.data.settings.companyName === 'string') {
                companyInput.value = this.data.settings.companyName;
            }
            // Rate mode
            const rateModeSelect = document.getElementById('rate-mode');
            if (rateModeSelect && this.data.settings.rateMode) {
                rateModeSelect.value = this.data.settings.rateMode;
            }

            // Monthly settings
            const monthlySalaryInput = document.getElementById('monthly-salary');
            const hoursPerDayInput = document.getElementById('work-hours-per-day');
            const daysPerWeekInput = document.getElementById('work-days-per-week');
            const weeksPerMonthInput = document.getElementById('weeks-per-month');
            if (monthlySalaryInput && this.data.settings.monthlySalary != null) {
                monthlySalaryInput.value = this.data.settings.monthlySalary;
            }
            if (hoursPerDayInput && this.data.settings.workHoursPerDay != null) {
                hoursPerDayInput.value = this.data.settings.workHoursPerDay;
            }
            if (daysPerWeekInput && this.data.settings.workDaysPerWeek != null) {
                daysPerWeekInput.value = this.data.settings.workDaysPerWeek;
            }
            if (weeksPerMonthInput && this.data.settings.weeksPerMonth != null) {
                weeksPerMonthInput.value = this.data.settings.weeksPerMonth;
            }

            // Set hourly rate
            const hourlyRateInput = document.getElementById('default-hourly-rate');
            if (hourlyRateInput && this.data.settings.hourlyRate) {
                hourlyRateInput.value = this.data.settings.hourlyRate;
            }

            // Set currency
            const currencySelect = document.getElementById('currency');
            if (currencySelect && this.data.settings.currency) {
                currencySelect.value = this.data.settings.currency;
            }

            // Set theme
            const themeSelect = document.getElementById('theme');
            if (themeSelect && this.data.settings.theme) {
                themeSelect.value = this.data.settings.theme;
                this.currentTheme = this.data.settings.theme;
            }

            // Set colors
            const primaryColorInput = document.getElementById('primary-color');
            const accentColorInput = document.getElementById('accent-color');
            if (primaryColorInput && this.data.settings.primaryColor) {
                primaryColorInput.value = this.data.settings.primaryColor;
            }
            if (accentColorInput && this.data.settings.accentColor) {
                accentColorInput.value = this.data.settings.accentColor;
            }

            // Set font size
            const fontSizeSelect = document.getElementById('font-size');
            if (fontSizeSelect && this.data.settings.fontSize) {
                fontSizeSelect.value = this.data.settings.fontSize;
            }

            // Account settings
            const accountUsername = document.getElementById('account-username');
            if (accountUsername && this.data.settings.account?.username) {
                accountUsername.value = this.data.settings.account.username;
            }
        }
    }

    // Navigation
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(e.target.closest('.nav-link').getAttribute('href').substring(1));
            });
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        // Language toggle
        document.getElementById('language-toggle').addEventListener('click', () => {
            this.toggleLanguage();
        });

        // Logout
        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Work entry form
        document.getElementById('work-entry-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addWorkEntry();
        });

        // Expense form
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Debt form
        document.getElementById('debt-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addDebt();
        });

        // Settings forms
        const generalForm = document.getElementById('general-settings-form');
        if (generalForm) {
            generalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveGeneralSettings();
            });
        }
        const accountForm = document.getElementById('account-settings-form');
        if (accountForm) {
            accountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAccountSettings();
            });
        }
        document.getElementById('salary-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSalarySettings();
        });

        // Dynamic UI for rate mode
        const rateModeSelect = document.getElementById('rate-mode');
        const monthlyGroup = document.getElementById('monthly-settings-group');
        const monthlyGroup2 = document.getElementById('monthly-settings-group-2');
        const calculatedGroup = document.getElementById('calculated-rates-group');
        const hourlyInput = document.getElementById('default-hourly-rate');
        const toggleMonthlyGroups = () => {
            const useMonthly = rateModeSelect.value === 'monthly';
            monthlyGroup?.classList.toggle('hidden', !useMonthly);
            monthlyGroup2?.classList.toggle('hidden', !useMonthly);
            calculatedGroup?.classList.toggle('hidden', !useMonthly);
            hourlyInput.parentElement?.classList.toggle('hidden', useMonthly);
            if (useMonthly) this.calculateRatesFromMonthly();
        };
        rateModeSelect?.addEventListener('change', toggleMonthlyGroups);
        // Initial state
        toggleMonthlyGroups();

        // Recalculate on inputs
        ['monthly-salary','work-hours-per-day','work-days-per-week','weeks-per-month']
            .forEach(id => document.getElementById(id)?.addEventListener('input', () => this.calculateRatesFromMonthly()));

        document.getElementById('appearance-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAppearanceSettings();
        });

        // Data management
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        // Export PDF
        const exportPdfBtn = document.getElementById('export-pdf');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportPDF());
        }

        document.getElementById('import-data').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.importData(e);
        });

        document.getElementById('clear-data').addEventListener('click', () => {
            this.showConfirmModal(
                this.getText('Clear All Data', 'مسح جميع البيانات'),
                this.getText('Are you sure you want to clear all data? This action cannot be undone.', 'هل أنت متأكد من أنك تريد مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.'),
                () => this.clearAllData()
            );
        });

        document.getElementById('reset-settings').addEventListener('click', () => {
            this.showConfirmModal(
                this.getText('Reset Settings to Default', 'إعادة تعيين الإعدادات للافتراضي'),
                this.getText('Are you sure you want to reset all settings to their default values? This will not affect your work data, expenses, or debts.', 'هل أنت متأكد من أنك تريد إعادة تعيين جميع الإعدادات إلى قيمها الافتراضية؟ لن يؤثر هذا على بيانات عملك أو مصاريفك أو ديونك.'),
                () => this.resetSettingsToDefault()
            );
        });

        // Modal
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal-overlay')) {
                // Don't close modal when clicking overlay - only close button
                return;
            }
        });

        // Work entry calculations
        document.getElementById('start-time').addEventListener('change', () => this.calculateWorkHours());
        document.getElementById('end-time').addEventListener('change', () => this.calculateWorkHours());

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar') && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });

    }

    // Authentication
    guardAuthentication() {
        try {
            const item = localStorage.getItem('authUser');
            this.authUser = item ? JSON.parse(item) : null;
        } catch (_) {
            this.authUser = null;
        }

        const onLoginPage = /login\.html$/i.test(location.pathname) || location.pathname.endsWith('/') && location.search.includes('login');
        if (!this.authUser) {
            // If not logged in, redirect to login unless already there
            if (!onLoginPage) {
                window.location.replace('login.html');
            }
        } else {
            // Show logout button
            const logoutBtn = document.getElementById('logout-button');
            if (logoutBtn) logoutBtn.style.display = '';
        }
    }

    logout() {
        try { localStorage.removeItem('authUser'); } catch (_) {}
        window.location.replace('login.html');
    }

    saveGeneralSettings() {
        const name = document.getElementById('company-name')?.value || '';
        this.data.settings.companyName = name.trim();
        this.saveData();
        this.showSuccessMessage(this.getText('General settings saved!', 'تم حفظ الإعدادات العامة!'));
    }

    navigateToSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

        // Show section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        // Close mobile menu
        const navMenu = document.getElementById('nav-menu');
        const menuToggle = document.getElementById('menu-toggle');
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    }

    // Language Management
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'ar' : 'en';
        document.documentElement.setAttribute('dir', this.currentLanguage === 'ar' ? 'rtl' : 'ltr');
        this.updateLanguageUI();
        this.updateClock(); // Update clock with new language
        this.saveData();
    }

    updateLanguageUI() {
        document.querySelectorAll('[data-en][data-ar]').forEach(element => {
            element.textContent = this.getText(element.getAttribute('data-en'), element.getAttribute('data-ar'));
        });

        // Update language toggle button
        const toggleBtn = document.getElementById('language-toggle');
        const span = toggleBtn.querySelector('span');
        span.textContent = this.getText('العربية', 'English');
        
        // Update modal title if modal is open
        const modalTitle = document.getElementById('edit-modal-title');
        if (modalTitle && modalTitle.getAttribute('data-en')) {
            modalTitle.textContent = this.getText(
                modalTitle.getAttribute('data-en'), 
                modalTitle.getAttribute('data-ar')
            );
        }
    }

    getText(english, arabic) {
        return this.currentLanguage === 'en' ? english : arabic;
    }

    // Work Entry Management
    addWorkEntry() {
        const form = document.getElementById('work-entry-form');
        const formData = new FormData(form);
        
        const workEntry = {
            id: Date.now(),
            date: formData.get('work-date'),
            startTime: formData.get('start-time'),
            endTime: formData.get('end-time'),
            totalHours: parseFloat(formData.get('total-hours')),
            hourlyRate: this.getEffectiveHourlyRate(),
            totalSalary: parseFloat(formData.get('total-salary-calc')),
            notes: formData.get('work-notes'),
            createdAt: new Date().toISOString()
        };

        this.data.workEntries.unshift(workEntry);
        this.saveData();
        this.updateDashboard();
        this.updateWorkHistoryTable();
        this.addActivity('work', workEntry);
        
        form.reset();
        this.setDefaultDates();
        this.showSuccessMessage(this.getText('Work entry added successfully!', 'تم إضافة إدخال العمل بنجاح!'));
    }

    calculateWorkHours() {
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const hourlyRate = this.getEffectiveHourlyRate();

        if (startTime && endTime) {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            
            if (end < start) {
                end.setDate(end.getDate() + 1); // Next day
            }
            
            const diffMs = end - start;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            document.getElementById('total-hours').value = diffHours.toFixed(2);
            document.getElementById('total-salary-calc').value = (diffHours * hourlyRate).toFixed(2);
        }
    }

    getEffectiveHourlyRate() {
        const s = this.data.settings || {};
        if (s.rateMode === 'monthly') {
            // hours per month = weeksPerMonth * workDaysPerWeek * workHoursPerDay
            const hoursPerMonth = (Number(s.weeksPerMonth) || 4.33) * (Number(s.workDaysPerWeek) || 5) * (Number(s.workHoursPerDay) || 8);
            if (hoursPerMonth > 0) return (Number(s.monthlySalary) || 0) / hoursPerMonth;
        }
        return Number(s.hourlyRate) || 10.0;
    }

    calculateRatesFromMonthly() {
        const monthly = Number(document.getElementById('monthly-salary')?.value || 0);
        const hoursPerDay = Number(document.getElementById('work-hours-per-day')?.value || 8);
        const daysPerWeek = Number(document.getElementById('work-days-per-week')?.value || 5);
        const weeksPerMonth = Number(document.getElementById('weeks-per-month')?.value || 4.33);

        const weeklyRate = monthly / (weeksPerMonth || 4.33);
        const dailyRate = weeklyRate / (daysPerWeek || 5);
        const hourlyRate = dailyRate / (hoursPerDay || 8);

        const weeklyEl = document.getElementById('calculated-weekly-rate');
        const dailyEl = document.getElementById('calculated-daily-rate');
        const hourlyEl = document.getElementById('calculated-hourly-rate');
        if (weeklyEl) weeklyEl.value = isFinite(weeklyRate) ? weeklyRate.toFixed(2) : '0.00';
        if (dailyEl) dailyEl.value = isFinite(dailyRate) ? dailyRate.toFixed(2) : '0.00';
        if (hourlyEl) hourlyEl.value = isFinite(hourlyRate) ? hourlyRate.toFixed(2) : '0.00';
    }

    // Expense Management
    addExpense() {
        const form = document.getElementById('expense-form');
        const formData = new FormData(form);
        
        const expense = {
            id: Date.now(),
            date: formData.get('expense-date'),
            amount: parseFloat(formData.get('expense-amount')),
            category: formData.get('expense-category'),
            description: formData.get('expense-description'),
            createdAt: new Date().toISOString()
        };

        this.data.expenses.unshift(expense);
        this.saveData();
        this.updateDashboard();
        this.updateExpensesTable();
        this.addActivity('expense', expense);
        
        form.reset();
        this.setDefaultDates();
        this.showSuccessMessage(this.getText('Expense added successfully!', 'تم إضافة المصروف بنجاح!'));
    }

    // Debt Management
    addDebt() {
        const form = document.getElementById('debt-form');
        const formData = new FormData(form);
        
        const debt = {
            id: Date.now(),
            date: formData.get('debt-date'),
            amount: parseFloat(formData.get('debt-amount')),
            type: formData.get('debt-type'),
            description: formData.get('debt-description'),
            status: formData.get('debt-status'),
            dueDate: formData.get('debt-due-date'),
            createdAt: new Date().toISOString()
        };

        this.data.debts.unshift(debt);
        this.saveData();
        this.updateDashboard();
        this.updateDebtsTable();
        this.addActivity('debt', debt);
        
        form.reset();
        this.setDefaultDates();
        this.showSuccessMessage(this.getText('Debt added successfully!', 'تم إضافة الدين بنجاح!'));
    }

    // Dashboard Updates
    updateDashboard() {
        const stats = this.calculateStats();
        
        document.getElementById('work-days').textContent = stats.workDays;
        document.getElementById('work-hours').textContent = stats.workHours.toFixed(2);
        document.getElementById('total-salary').textContent = `€${stats.totalSalary.toFixed(2)}`;
        document.getElementById('withdrawn-amount').textContent = `€${stats.withdrawnAmount.toFixed(2)}`;
        document.getElementById('total-expenses').textContent = `€${stats.totalExpenses.toFixed(2)}`;
        document.getElementById('total-debts').textContent = `€${stats.totalDebts.toFixed(2)}`;
        document.getElementById('remaining-balance').textContent = `€${stats.remainingBalance.toFixed(2)}`;

        // Update summary cards
        document.getElementById('total-expenses-summary').textContent = `€${stats.totalExpenses.toFixed(2)}`;
        document.getElementById('monthly-expenses').textContent = `€${stats.monthlyExpenses.toFixed(2)}`;
        document.getElementById('total-debts-summary').textContent = `€${stats.totalDebts.toFixed(2)}`;
        document.getElementById('active-debts').textContent = `€${stats.pendingDebts.toFixed(2)}`;
        document.getElementById('paid-debts').textContent = `€${stats.completedDebts.toFixed(2)}`;

        this.updateRecentActivity();
        

    }

    calculateStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const workDays = this.data.workEntries.length;
        const workHours = this.data.workEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
        const totalSalary = this.data.workEntries.reduce((sum, entry) => sum + entry.totalSalary, 0);
        
        const withdrawnAmount = this.data.expenses
            .filter(expense => expense.category === 'withdrawal')
            .reduce((sum, expense) => sum + expense.amount, 0);
        
        const totalExpenses = this.data.expenses
            .filter(expense => expense.category !== 'withdrawal')
            .reduce((sum, expense) => sum + expense.amount, 0);
        
        const monthlyExpenses = this.data.expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === currentMonth && 
                       expenseDate.getFullYear() === currentYear &&
                       expense.category !== 'withdrawal';
            })
            .reduce((sum, expense) => sum + expense.amount, 0);
        
        const totalDebts = this.data.debts.reduce((sum, debt) => sum + debt.amount, 0);
        const pendingDebts = this.data.debts
            .filter(debt => debt.status === 'pending')
            .reduce((sum, debt) => sum + debt.amount, 0);
        const completedDebts = this.data.debts
            .filter(debt => debt.status === 'completed')
            .reduce((sum, debt) => sum + debt.amount, 0);
        
        const remainingBalance = totalSalary - withdrawnAmount - totalExpenses - pendingDebts;

        return {
            workDays,
            workHours,
            totalSalary,
            withdrawnAmount,
            totalExpenses,
            monthlyExpenses,
            totalDebts,
            pendingDebts,
            completedDebts,
            remainingBalance
        };
    }

    // Table Updates
    updateAllTables() {
        this.updateWorkHistoryTable();
        this.updateExpensesTable();
        this.updateDebtsTable();
    }

    updateWorkHistoryTable() {
        const tbody = document.getElementById('work-history-body');
        tbody.innerHTML = '';

        this.data.workEntries.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(entry.date)}</td>
                <td>${entry.startTime}</td>
                <td>${entry.endTime}</td>
                <td>${entry.totalHours.toFixed(2)}</td>
                <td>€${entry.hourlyRate.toFixed(2)}</td>
                <td>€${entry.totalSalary.toFixed(2)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="app.editWorkEntry(${entry.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteWorkEntry(${entry.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateExpensesTable() {
        const tbody = document.getElementById('expenses-body');
        tbody.innerHTML = '';

        this.data.expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(expense.date)}</td>
                <td><span class="category-badge">${this.getCategoryText(expense.category)}</span></td>
                <td>${expense.description}</td>
                <td>€${expense.amount.toFixed(2)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="app.editExpense(${expense.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteExpense(${expense.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateDebtsTable() {
        const tbody = document.getElementById('debts-body');
        tbody.innerHTML = '';

        this.data.debts.forEach(debt => {
            const row = document.createElement('tr');
            const statusButton = debt.status === 'pending' 
                ? `<button class="btn btn-sm btn-success" onclick="app.toggleDebtStatus(${debt.id})" title="${this.getText('Mark as Done', 'تحديد كتم')}">
                     <i class="fas fa-check"></i>
                   </button>`
                : `<button class="btn btn-sm btn-warning" onclick="app.toggleDebtStatus(${debt.id})" title="${this.getText('Mark as Not Done', 'تحديد كلم يتم')}">
                     <i class="fas fa-undo"></i>
                   </button>`;
            
            row.innerHTML = `
                <td>${this.formatDate(debt.date)}</td>
                <td>${this.getDebtTypeText(debt.type)}</td>
                <td>${debt.description}</td>
                <td>€${debt.amount.toFixed(2)}</td>
                <td><span class="status-badge status-${debt.status}">${this.getStatusText(debt.status)}</span></td>
                <td>${debt.dueDate ? this.formatDate(debt.dueDate) : '-'}</td>
                <td>
                    <div class="action-buttons">
                        ${statusButton}
                        <button class="btn btn-sm btn-secondary" onclick="app.editDebt(${debt.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteDebt(${debt.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Activity Management
    addActivity(type, item) {
        const activity = {
            id: Date.now(),
            type,
            item,
            timestamp: new Date().toISOString()
        };

        // Keep only last 10 activities
        if (!this.data.activities) this.data.activities = [];
        this.data.activities.unshift(activity);
        this.data.activities = this.data.activities.slice(0, 10);
        
        this.saveData();
    }

    updateRecentActivity() {
        const container = document.getElementById('recent-activity-list');
        container.innerHTML = '';

        if (!this.data.activities || this.data.activities.length === 0) {
            container.innerHTML = `
                <div class="activity-item">
                    <div class="activity-content">
                        <p>${this.getText('No recent activity', 'لا توجد نشاطات حديثة')}</p>
                    </div>
                </div>
            `;
            return;
        }

        this.data.activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            
            let icon, title, description;
            
            switch (activity.type) {
                case 'work':
                    icon = 'fas fa-clock';
                    title = this.getText('Work Entry Added', 'تم إضافة إدخال عمل');
                    description = `${this.getText('Worked', 'عمل')} ${activity.item.totalHours.toFixed(2)} ${this.getText('hours', 'ساعات')} - €${activity.item.totalSalary.toFixed(2)}`;
                    break;
                case 'expense':
                    icon = 'fas fa-receipt';
                    title = this.getText('Expense Added', 'تم إضافة مصروف');
                    description = `${activity.item.description} - €${activity.item.amount.toFixed(2)}`;
                    break;
                case 'debt':
                    icon = 'fas fa-credit-card';
                    title = this.getText('Debt Added', 'تم إضافة دين');
                    description = `${activity.item.description} - €${activity.item.amount.toFixed(2)}`;
                    break;
            }

            item.innerHTML = `
                <div class="activity-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${title}</h4>
                    <p>${description}</p>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    // Settings Management
    saveSalarySettings() {
        const currency = document.getElementById('currency').value;
        const rateMode = document.getElementById('rate-mode')?.value || 'hourly';
        this.data.settings.currency = currency;
        this.data.settings.rateMode = rateMode;

        if (rateMode === 'monthly') {
            const monthly = Number(document.getElementById('monthly-salary')?.value || 0);
            const hoursPerDay = Number(document.getElementById('work-hours-per-day')?.value || 8);
            const daysPerWeek = Number(document.getElementById('work-days-per-week')?.value || 5);
            const weeksPerMonth = Number(document.getElementById('weeks-per-month')?.value || 4.33);
            this.data.settings.monthlySalary = monthly;
            this.data.settings.workHoursPerDay = hoursPerDay;
            this.data.settings.workDaysPerWeek = daysPerWeek;
            this.data.settings.weeksPerMonth = weeksPerMonth;

            // Also store derived hourly rate for persistence and immediate use
            this.calculateRatesFromMonthly();
            const effectiveHourly = Number(document.getElementById('calculated-hourly-rate')?.value || '0');
            this.data.settings.hourlyRate = effectiveHourly;
        } else {
            const hourlyRate = Number(document.getElementById('default-hourly-rate').value || 10);
            this.data.settings.hourlyRate = hourlyRate;
        }

        this.saveData();
        this.updateDashboard();
        this.showSuccessMessage(this.getText('Salary settings saved!', 'تم حفظ إعدادات الراتب!'));
    }

    saveAppearanceSettings() {
        const theme = document.getElementById('theme').value;
        const primaryColor = document.getElementById('primary-color').value;
        const accentColor = document.getElementById('accent-color').value;
        const fontSize = document.getElementById('font-size').value;
        
        this.currentTheme = theme;
        
        // Save all appearance settings to data
        this.data.settings.theme = theme;
        this.data.settings.primaryColor = primaryColor;
        this.data.settings.accentColor = accentColor;
        this.data.settings.fontSize = fontSize;
        
        this.applyTheme(theme, primaryColor, accentColor, fontSize);
        
        this.saveData();
        this.showSuccessMessage(this.getText('Appearance settings applied!', 'تم تطبيق إعدادات المظهر!'));
    }

    saveAccountSettings() {
        const usernameInput = document.getElementById('account-username');
        const currentPasswordInput = document.getElementById('account-current-password');
        const newPasswordInput = document.getElementById('account-new-password');
        const confirmPasswordInput = document.getElementById('account-confirm-password');

        const currentSettings = this.data.settings?.account || { username: 'admin', password: 'admin' };

        const newUsername = (usernameInput?.value || '').trim();
        const currentPassword = currentPasswordInput?.value || '';
        const newPassword = newPasswordInput?.value || '';
        const confirmPassword = confirmPasswordInput?.value || '';

        if (!newUsername) {
            this.showErrorMessage(this.getText('Username is required', 'اسم المستخدم مطلوب'));
            return;
        }

        if (!currentPassword || currentPassword !== currentSettings.password) {
            this.showErrorMessage(this.getText('Current password is incorrect', 'كلمة المرور الحالية غير صحيحة'));
            return;
        }

        if (newPassword || confirmPassword) {
            if (newPassword.length < 4) {
                this.showErrorMessage(this.getText('New password must be at least 4 characters', 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل'));
                return;
            }
            if (newPassword !== confirmPassword) {
                this.showErrorMessage(this.getText('New passwords do not match', 'كلمتا المرور الجديدتان غير متطابقتين'));
                return;
            }
        }

        this.data.settings.account = {
            username: newUsername,
            password: newPassword ? newPassword : currentSettings.password
        };

        this.saveData();
        this.showSuccessMessage(this.getText('Account updated successfully!', 'تم تحديث الحساب بنجاح!'));

        // Clear sensitive inputs
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
    }

    resetSettingsToDefault() {
        // Reset to default values
        const defaultSettings = {
            hourlyRate: 10.00,
            currency: 'EUR',
            theme: 'light',
            primaryColor: '#3b82f6',
            accentColor: '#10b981',
            fontSize: 'small'
        };

        // Update form fields
        document.getElementById('default-hourly-rate').value = defaultSettings.hourlyRate;
        document.getElementById('currency').value = defaultSettings.currency;
        document.getElementById('theme').value = defaultSettings.theme;
        document.getElementById('primary-color').value = defaultSettings.primaryColor;
        document.getElementById('accent-color').value = defaultSettings.accentColor;
        document.getElementById('font-size').value = defaultSettings.fontSize;



        // Apply theme
        this.currentTheme = defaultSettings.theme;
        this.applyTheme(defaultSettings.theme, defaultSettings.primaryColor, defaultSettings.accentColor, defaultSettings.fontSize);

        // Update settings in data
        this.data.settings = { ...this.data.settings, ...defaultSettings };

        // Save data
        this.saveData();

        this.showSuccessMessage(this.getText('Settings reset to default successfully!', 'تم إعادة تعيين الإعدادات للافتراضي بنجاح!'));

        // Close modal
        this.closeModal();
    }

    applyTheme(theme = this.currentTheme, primaryColor = null, accentColor = null, fontSize = null) {
        if (theme === 'auto') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        
        // Apply saved colors if not provided
        if (!primaryColor && this.data.settings && this.data.settings.primaryColor) {
            primaryColor = this.data.settings.primaryColor;
        }
        if (!accentColor && this.data.settings && this.data.settings.accentColor) {
            accentColor = this.data.settings.accentColor;
        }
        if (!fontSize && this.data.settings && this.data.settings.fontSize) {
            fontSize = this.data.settings.fontSize;
        }
        
        if (primaryColor) {
            document.documentElement.style.setProperty('--primary-color', primaryColor);
        }
        
        if (accentColor) {
            document.documentElement.style.setProperty('--accent-color', accentColor);
        }
        
        if (fontSize) {
            document.documentElement.setAttribute('data-font-size', fontSize);
        }
    }

    // Data Export/Import
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `work-manager-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showSuccessMessage(this.getText('Data exported successfully!', 'تم تصدير البيانات بنجاح!'));
    }







    // Export to PDF (professional template)
    exportPDF() {
        try {
            const currencySymbol = (this.data.settings?.currency === 'USD') ? '$'
                : (this.data.settings?.currency === 'GBP') ? '£'
                : '€';
            const locale = this.currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
            const dir = document.documentElement.getAttribute('dir') || (this.currentLanguage === 'ar' ? 'rtl' : 'ltr');
            const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-color')?.trim() || '#3b82f6';
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color')?.trim() || '#10b981';

            const stats = this.calculateStats();

            const container = document.createElement('div');
            container.style.fontFamily = 'Inter, Cairo, sans-serif';
            container.style.padding = '24px';
            container.style.maxWidth = '1000px';
            container.style.background = '#ffffff';
            container.style.color = '#0f172a';

            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.justifyContent = 'space-between';
            header.style.gap = '16px';
            header.style.padding = '16px';
            header.style.border = '1px solid #e5e7eb';
            header.style.borderRadius = '12px';
            header.style.background = `linear-gradient(135deg, ${primary}15, ${accent}10)`;

            const brand = document.createElement('div');
            brand.style.display = 'flex';
            brand.style.alignItems = 'center';
            brand.style.gap = '12px';
            const logo = document.createElement('div');
            logo.style.width = '42px';
            logo.style.height = '42px';
            logo.style.borderRadius = '12px';
            logo.style.display = 'flex';
            logo.style.alignItems = 'center';
            logo.style.justifyContent = 'center';
            logo.style.color = '#fff';
            logo.style.background = `linear-gradient(135deg, ${primary}, ${accent})`;
            logo.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
            // Prefer company initials if provided
            const companyName = (this.data.settings?.companyName || '').trim();
            logo.textContent = (companyName ? companyName.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase() : 'WM');

            const titleBox = document.createElement('div');
            const h1 = document.createElement('div');
            h1.textContent = this.getText('Work Manager Report', 'تقرير مدير العمل');
            h1.style.fontSize = '18px';
            h1.style.fontWeight = '800';
            h1.style.margin = '0';
            const sub = document.createElement('div');
            sub.textContent = `${this.getText('Generated on', 'تاريخ الإنشاء')}: ${new Date().toLocaleString(locale)}`;
            sub.style.color = '#64748b';
            sub.style.fontSize = '12px';
            sub.style.marginTop = '2px';
            titleBox.appendChild(h1);
            titleBox.appendChild(sub);

            brand.appendChild(logo);
            brand.appendChild(titleBox);

            const badgeBox = document.createElement('div');
            badgeBox.style.display = 'flex';
            badgeBox.style.flexDirection = 'column';
            badgeBox.style.alignItems = dir === 'rtl' ? 'flex-start' : 'flex-end';
            badgeBox.style.gap = '6px';
            const company = (this.data.settings?.companyName || '').trim();
            if (company) {
                const companyBadge = document.createElement('div');
                companyBadge.textContent = company;
                companyBadge.style.padding = '6px 10px';
                companyBadge.style.border = '1px solid #e2e8f0';
                companyBadge.style.borderRadius = '9999px';
                companyBadge.style.fontWeight = '700';
                companyBadge.style.fontSize = '12px';
                companyBadge.style.background = '#f8fafc';
                badgeBox.appendChild(companyBadge);
            }
            const periodBadge = document.createElement('div');
            periodBadge.textContent = this.getText('Overview', 'نظرة عامة');
            periodBadge.style.padding = '6px 10px';
            periodBadge.style.border = '1px solid #e2e8f0';
            periodBadge.style.borderRadius = '9999px';
            periodBadge.style.fontWeight = '700';
            periodBadge.style.fontSize = '12px';
            periodBadge.style.background = '#f8fafc';
            badgeBox.appendChild(periodBadge);

            header.appendChild(brand);
            header.appendChild(badgeBox);
            container.appendChild(header);

            const kpis = document.createElement('div');
            kpis.style.display = 'grid';
            kpis.style.gridTemplateColumns = 'repeat(3, 1fr)';
            kpis.style.gap = '12px';
            kpis.style.margin = '14px 0 18px 0';

            const makeKPI = (labelEn, labelAr, value, color) => {
                const card = document.createElement('div');
                card.style.border = '1px solid #e5e7eb';
                card.style.borderRadius = '12px';
                card.style.padding = '12px';
                card.style.background = '#ffffff';
                const label = document.createElement('div');
                label.textContent = this.getText(labelEn, labelAr);
                label.style.fontSize = '11px';
                label.style.color = '#64748b';
                const val = document.createElement('div');
                val.textContent = value;
                val.style.fontWeight = '800';
                val.style.fontSize = '18px';
                val.style.color = color;
                val.style.marginTop = '4px';
                card.appendChild(label);
                card.appendChild(val);
                return card;
            };

            kpis.appendChild(makeKPI('Work Hours', 'ساعات العمل', stats.workHours.toFixed(2), primary));
            kpis.appendChild(makeKPI('Total Salary', 'إجمالي الراتب', `${currencySymbol}${stats.totalSalary.toFixed(2)}`, primary));
            kpis.appendChild(makeKPI('Withdrawn', 'المسحوب', `${currencySymbol}${stats.withdrawnAmount.toFixed(2)}`, accent));
            kpis.appendChild(makeKPI('Expenses', 'المصاريف', `${currencySymbol}${stats.totalExpenses.toFixed(2)}`, '#ef4444'));
            kpis.appendChild(makeKPI('Debts', 'الديون', `${currencySymbol}${stats.totalDebts.toFixed(2)}`, '#f59e0b'));
            kpis.appendChild(makeKPI('Remaining', 'الرصيد المتبقي', `${currencySymbol}${stats.remainingBalance.toFixed(2)}`, '#16a34a'));
            container.appendChild(kpis);

            const sectionTitle = (text) => {
                const wrap = document.createElement('div');
                wrap.style.display = 'flex';
                wrap.style.alignItems = 'center';
                wrap.style.gap = '8px';
                wrap.style.margin = '16px 0 8px 0';
                const bar = document.createElement('div');
                bar.style.width = '10px';
                bar.style.height = '22px';
                bar.style.borderRadius = '6px';
                bar.style.background = `linear-gradient(180deg, ${primary}, ${accent})`;
                const t = document.createElement('div');
                t.textContent = text;
                t.style.fontWeight = '800';
                t.style.fontSize = '14px';
                wrap.appendChild(bar);
                wrap.appendChild(t);
                container.appendChild(wrap);
            };

            const buildTable = (columns, rows) => {
                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                table.style.marginBottom = '10px';
                const thead = document.createElement('thead');
                const trh = document.createElement('tr');
                columns.forEach(c => {
                    const th = document.createElement('th');
                    th.textContent = c;
                    th.style.textAlign = dir === 'rtl' ? 'right' : 'left';
                    th.style.fontSize = '11px';
                    th.style.color = '#0f172a';
                    th.style.background = '#f1f5f9';
                    th.style.borderBottom = '1px solid #e2e8f0';
                    th.style.padding = '8px 6px';
                    trh.appendChild(th);
                });
                thead.appendChild(trh);
                const tbody = document.createElement('tbody');
                rows.forEach((r, idx) => {
                    const tr = document.createElement('tr');
                    if (idx % 2 === 1) tr.style.background = '#f8fafc';
                    r.forEach((cell) => {
                        const td = document.createElement('td');
                        td.textContent = cell;
                        td.style.fontSize = '11px';
                        td.style.color = '#0f172a';
                        td.style.padding = '8px 6px';
                        td.style.borderBottom = '1px solid #f1f5f9';
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
                table.appendChild(thead);
                table.appendChild(tbody);
                container.appendChild(table);
            };

            sectionTitle(this.getText('Work + Withdrawals', 'العمل + السحوبات'));
            const workColumns = [
                this.getText('Date', 'التاريخ'),
                this.getText('Start', 'البداية'),
                this.getText('End', 'النهاية'),
                this.getText('Hours', 'الساعات'),
                this.getText('Rate', 'المعدل'),
                this.getText('Salary', 'الراتب')
            ];
            const workRows = this.data.workEntries.map(w => [
                this.formatDate(w.date),
                w.startTime,
                w.endTime,
                (w.totalHours ?? 0).toFixed(2),
                `${currencySymbol}${(w.hourlyRate ?? 0).toFixed(2)}`,
                `${currencySymbol}${(w.totalSalary ?? 0).toFixed(2)}`
            ]);
            if (workRows.length) {
                buildTable(workColumns, workRows);
            } else {
                const p = document.createElement('p');
                p.textContent = this.getText('No work entries found.', 'لا توجد إدخالات عمل.');
                p.style.color = '#64748b';
                p.style.fontSize = '12px';
                container.appendChild(p);
            }

            const withdrawals = this.data.expenses.filter(e => e.category === 'withdrawal');
            const wdColumns = [
                this.getText('Date', 'التاريخ'),
                this.getText('Description', 'الوصف'),
                this.getText('Amount', 'المبلغ')
            ];
            const wdRows = withdrawals.map(e => [
                this.formatDate(e.date),
                e.description,
                `${currencySymbol}${(e.amount ?? 0).toFixed(2)}`
            ]);
            if (wdRows.length) {
                buildTable(wdColumns, wdRows);
            }

            sectionTitle(this.getText('Expenses', 'المصاريف'));
            const nonWithdrawals = this.data.expenses.filter(e => e.category !== 'withdrawal');
            const expColumns = [
                this.getText('Date', 'التاريخ'),
                this.getText('Category', 'الفئة'),
                this.getText('Description', 'الوصف'),
                this.getText('Amount', 'المبلغ')
            ];
            const expRows = nonWithdrawals.map(e => [
                this.formatDate(e.date),
                this.getCategoryText(e.category),
                e.description,
                `${currencySymbol}${(e.amount ?? 0).toFixed(2)}`
            ]);
            if (expRows.length) {
                buildTable(expColumns, expRows);
            }

            sectionTitle(this.getText('Debts', 'الديون'));
            const debtColumns = [
                this.getText('Date', 'التاريخ'),
                this.getText('Type', 'النوع'),
                this.getText('Description', 'الوصف'),
                this.getText('Amount', 'المبلغ'),
                this.getText('Status', 'الحالة'),
                this.getText('Due Date', 'تاريخ الاستحقاق')
            ];
            const debtRows = this.data.debts.map(d => [
                this.formatDate(d.date),
                this.getDebtTypeText(d.type),
                d.description,
                `${currencySymbol}${(d.amount ?? 0).toFixed(2)}`,
                this.getStatusText(d.status),
                d.dueDate ? this.formatDate(d.dueDate) : '-'
            ]);
            if (debtRows.length) {
                buildTable(debtColumns, debtRows);
            }

            const footer = document.createElement('div');
            footer.style.marginTop = '12px';
            footer.style.paddingTop = '8px';
            footer.style.borderTop = '1px solid #e5e7eb';
            footer.style.display = 'flex';
            footer.style.justifyContent = 'space-between';
            footer.style.alignItems = 'center';
            const left = document.createElement('div');
            left.textContent = this.getText('Generated by Work Manager', 'تم الإنشاء بواسطة مدير العمل');
            left.style.color = '#94a3b8';
            left.style.fontSize = '11px';
            const right = document.createElement('div');
            right.textContent = new Date().toLocaleString(locale);
            right.style.color = '#94a3b8';
            right.style.fontSize = '11px';
            footer.appendChild(left);
            footer.appendChild(right);
            container.appendChild(footer);

            // Attach the container invisibly but within the layout (visibility hidden tends to be safest)
            container.setAttribute('dir', dir);
            container.style.position = 'absolute';
            container.style.left = '0';
            container.style.top = '0';
            container.style.visibility = 'hidden';
            container.style.pointerEvents = 'none';
            container.style.width = '1000px';
            container.style.backgroundColor = '#ffffff';
            document.body.appendChild(container);
            // Give the browser a moment to layout fonts/styles
            void container.offsetHeight;

            const opt = {
                margin: [10, 10, 12, 10],
                filename: `work-manager-report-${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: Math.min(2, window.devicePixelRatio || 2),
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    removeContainer: true
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'] }
            };

            if (typeof html2pdf !== 'undefined') {
                setTimeout(() => {
                    html2pdf().set(opt).from(container).save().then(() => {
                        container.remove();
                        this.showSuccessMessage(this.getText('PDF exported successfully!', 'تم تصدير ملف PDF بنجاح!'));
                    }).catch(() => {
                        container.remove();
                        this.showErrorMessage(this.getText('Failed to export PDF', 'فشل تصدير PDF'));
                    });
                }, 400);
            } else {
                container.remove();
                this.showErrorMessage(this.getText('PDF library not loaded', 'لم يتم تحميل مكتبة PDF'));
            }
        } catch (_) {
            this.showErrorMessage(this.getText('Failed to export PDF', 'فشل تصدير PDF'));
        }
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                this.data = { ...this.data, ...importedData };
                this.saveData();
                this.updateDashboard();
                this.updateAllTables();
                this.showSuccessMessage(this.getText('Data imported successfully!', 'تم استيراد البيانات بنجاح!'));
            } catch (error) {
                this.showErrorMessage(this.getText('Invalid file format!', 'تنسيق ملف غير صحيح!'));
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    clearAllData() {
        // Clear only operational data while preserving user settings
        const currentSettings = this.data.settings;
        this.data = {
            workEntries: [],
            expenses: [],
            debts: [],
            activities: [],
            settings: currentSettings
        };
        this.saveData();
        this.updateDashboard();
        this.updateAllTables();
        this.closeModal();
        this.showSuccessMessage(this.getText('All data cleared (settings preserved)!', 'تم مسح جميع البيانات (مع الحفاظ على الإعدادات)!'));
    }

    // Modal Management
    showConfirmModal(title, message, onConfirm) {
        const modal = document.getElementById('edit-modal');
        const modalTitle = document.getElementById('edit-modal-title');
        const editForm = document.getElementById('edit-form');
        
        modalTitle.textContent = title;
        editForm.innerHTML = `
            <div class="form-group full-width">
                <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">${message}</p>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-danger" id="confirm-action">
                    <i class="fas fa-trash"></i>
                    <span>${this.getText('Confirm', 'تأكيد')}</span>
                </button>
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                    <span>${this.getText('Cancel', 'إلغاء')}</span>
                </button>
            </div>
        `;
        
        modal.classList.add('active');

        // Accessibility: focus management and focus trap
        const modalPanel = modal.querySelector('.modal');
        if (modalPanel) {
            modalPanel.setAttribute('role', 'dialog');
            modalPanel.setAttribute('aria-modal', 'true');
        }

        // Save last focused element to restore later
        this.lastFocusedElement = document.activeElement;

        // Focus the confirm button by default
        const confirmBtn = document.getElementById('confirm-action');
        if (confirmBtn && typeof confirmBtn.focus === 'function') {
            setTimeout(() => confirmBtn.focus(), 0);
        }

        // Trap focus inside modal
        const getFocusable = () => Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
            .filter(el => !el.hasAttribute('disabled'));
        this.modalKeydownHandler = (e) => {
            if (e.key === 'Tab') {
                const focusables = getFocusable();
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            } else if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        modal.addEventListener('keydown', this.modalKeydownHandler);
        
        document.getElementById('confirm-action').addEventListener('click', () => {
            onConfirm();
        });
    }

    closeModal() {
        const modal = document.getElementById('edit-modal');
        if (modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
            // Remove focus trap handler
            if (this.modalKeydownHandler) {
                modal.removeEventListener('keydown', this.modalKeydownHandler);
                this.modalKeydownHandler = null;
            }
            // Clear the edit form
            const editForm = document.getElementById('edit-form');
            if (editForm) {
                editForm.innerHTML = '';
            }
            // Restore focus to the previously focused element
            if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
                setTimeout(() => {
                    try { this.lastFocusedElement.focus(); } catch (_) {}
                }, 0);
            }
            this.lastFocusedElement = null;
        }
    }

    // Utility Functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(this.currentLanguage === 'ar' ? 'ar-SA' : 'en-US');
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.querySelectorAll('input[type="date"]').forEach(input => {
            if (!input.value) {
                input.value = today;
            }
        });
    }

    getCategoryText(category) {
        const categories = {
            food: { en: 'Food', ar: 'طعام' },
            transport: { en: 'Transport', ar: 'مواصلات' },
            bills: { en: 'Bills', ar: 'فواتير' },
            entertainment: { en: 'Entertainment', ar: 'ترفيه' },
            shopping: { en: 'Shopping', ar: 'تسوق' },
            withdrawal: { en: 'Withdrawal', ar: 'سحب' },
            other: { en: 'Other', ar: 'أخرى' }
        };
        return categories[category]?.[this.currentLanguage] || category;
    }

    getDebtTypeText(type) {
        const types = {
            loan: { en: 'Loan', ar: 'قرض' },
            credit: { en: 'Credit Card', ar: 'بطاقة ائتمان' },
            personal: { en: 'Personal Debt', ar: 'دين شخصي' },
            other: { en: 'Other', ar: 'أخرى' }
        };
        return types[type]?.[this.currentLanguage] || type;
    }

    getStatusText(status) {
        const statuses = {
            pending: { en: 'Not Done', ar: 'لم يتم' },
            completed: { en: 'Done', ar: 'تم' }
        };
        return statuses[status]?.[this.currentLanguage] || status;
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type} fade-in`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            color: white;
            font-weight: 500;
            z-index: 3000;
            box-shadow: var(--shadow-lg);
            ${type === 'success' ? 'background-color: var(--success-color);' : 'background-color: var(--danger-color);'}
        `;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Edit/Delete Functions
    editWorkEntry(id) {
        const workEntry = this.data.workEntries.find(entry => entry.id === id);
        if (!workEntry) {
            this.showErrorMessage(this.getText('Work entry not found!', 'لم يتم العثور على إدخال العمل!'));
            return;
        }

        const modal = document.getElementById('edit-modal');
        const modalTitle = document.getElementById('edit-modal-title');
        const editForm = document.getElementById('edit-form');

        modalTitle.textContent = this.getText('Edit Work Entry', 'تعديل إدخال العمل');

        editForm.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-work-date" data-en="Date" data-ar="التاريخ">Date</label>
                    <input type="date" id="edit-work-date" name="work-date" value="${workEntry.date}" required>
                </div>
                <div class="form-group">
                    <label for="edit-start-time" data-en="Start Time" data-ar="وقت البدء">Start Time</label>
                    <input type="time" id="edit-start-time" name="start-time" value="${workEntry.startTime}" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-end-time" data-en="End Time" data-ar="وقت الانتهاء">End Time</label>
                    <input type="time" id="edit-end-time" name="end-time" value="${workEntry.endTime}" required>
                </div>
                <div class="form-group">
                    <label for="edit-total-hours" data-en="Total Hours" data-ar="إجمالي الساعات">Total Hours</label>
                    <input type="number" id="edit-total-hours" name="total-hours" step="0.01" value="${workEntry.totalHours}" readonly>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-total-salary" data-en="Total Salary (€)" data-ar="إجمالي الراتب (€)">Total Salary (€)</label>
                    <input type="number" id="edit-total-salary" name="total-salary" step="0.01" value="${workEntry.totalSalary}" readonly>
                </div>
            </div>
            
            <div class="form-group full-width">
                <label for="edit-work-notes" data-en="Notes" data-ar="ملاحظات">Notes</label>
                <textarea id="edit-work-notes" name="work-notes" rows="3">${workEntry.notes || ''}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i>
                    <span data-en="Save Changes" data-ar="حفظ التغييرات">Save Changes</span>
                </button>
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                    <span data-en="Cancel" data-ar="إلغاء">Cancel</span>
                </button>
            </div>
        `;

        // Add event listeners for time calculation
        const startTimeInput = document.getElementById('edit-start-time');
        const endTimeInput = document.getElementById('edit-end-time');
        const totalHoursInput = document.getElementById('edit-total-hours');
        const totalSalaryInput = document.getElementById('edit-total-salary');

        const calculateEditHours = () => {
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;
            const hourlyRate = this.getEffectiveHourlyRate();

            if (startTime && endTime) {
                const start = new Date(`2000-01-01T${startTime}`);
                const end = new Date(`2000-01-01T${endTime}`);
                
                if (end < start) {
                    end.setDate(end.getDate() + 1); // Next day
                }
                
                const diffMs = end - start;
                const diffHours = diffMs / (1000 * 60 * 60);
                
                totalHoursInput.value = diffHours.toFixed(2);
                totalSalaryInput.value = (diffHours * hourlyRate).toFixed(2);
            }
        };

        startTimeInput.addEventListener('change', calculateEditHours);
        endTimeInput.addEventListener('change', calculateEditHours);

        // Handle form submission
        editForm.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(editForm);
            
            workEntry.date = formData.get('work-date');
            workEntry.startTime = formData.get('start-time');
            workEntry.endTime = formData.get('end-time');
            workEntry.totalHours = parseFloat(formData.get('total-hours'));
            workEntry.hourlyRate = this.getEffectiveHourlyRate();
            workEntry.totalSalary = parseFloat(formData.get('total-salary'));
            workEntry.notes = formData.get('work-notes');

            this.saveData();
            this.updateDashboard();
            this.updateWorkHistoryTable();
            this.closeModal();
            this.showSuccessMessage(this.getText('Work entry updated successfully!', 'تم تحديث إدخال العمل بنجاح!'));
        };

        modal.classList.add('active');
    }

    deleteWorkEntry(id) {
        this.showConfirmModal(
            this.getText('Delete Work Entry', 'حذف إدخال العمل'),
            this.getText('Are you sure you want to delete this work entry?', 'هل أنت متأكد من أنك تريد حذف إدخال العمل هذا؟'),
            () => {
                this.data.workEntries = this.data.workEntries.filter(entry => entry.id !== id);
                this.saveData();
                this.updateDashboard();
                this.updateWorkHistoryTable();
                this.closeModal();
                this.showSuccessMessage(this.getText('Work entry deleted!', 'تم حذف إدخال العمل!'));
            }
        );
    }

    editExpense(id) {
        const expense = this.data.expenses.find(exp => exp.id === id);
        if (!expense) {
            this.showErrorMessage(this.getText('Expense not found!', 'لم يتم العثور على المصروف!'));
            return;
        }

        const modal = document.getElementById('edit-modal');
        const modalTitle = document.getElementById('edit-modal-title');
        const editForm = document.getElementById('edit-form');

        modalTitle.textContent = this.getText('Edit Expense', 'تعديل المصروف');

        editForm.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-expense-date" data-en="Date" data-ar="التاريخ">Date</label>
                    <input type="date" id="edit-expense-date" name="expense-date" value="${expense.date}" required>
                </div>
                <div class="form-group">
                    <label for="edit-expense-amount" data-en="Amount (€)" data-ar="المبلغ (€)">Amount (€)</label>
                    <input type="number" id="edit-expense-amount" name="expense-amount" step="0.01" value="${expense.amount}" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-expense-category" data-en="Category" data-ar="الفئة">Category</label>
                    <select id="edit-expense-category" name="expense-category" required>
                        <option value="food" ${expense.category === 'food' ? 'selected' : ''} data-en="Food" data-ar="طعام">Food</option>
                        <option value="transport" ${expense.category === 'transport' ? 'selected' : ''} data-en="Transport" data-ar="مواصلات">Transport</option>
                        <option value="utilities" ${expense.category === 'utilities' ? 'selected' : ''} data-en="Utilities" data-ar="مرافق">Utilities</option>
                        <option value="entertainment" ${expense.category === 'entertainment' ? 'selected' : ''} data-en="Entertainment" data-ar="ترفيه">Entertainment</option>
                        <option value="shopping" ${expense.category === 'shopping' ? 'selected' : ''} data-en="Shopping" data-ar="تسوق">Shopping</option>
                        <option value="health" ${expense.category === 'health' ? 'selected' : ''} data-en="Health" data-ar="صحة">Health</option>
                        <option value="education" ${expense.category === 'education' ? 'selected' : ''} data-en="Education" data-ar="تعليم">Education</option>
                        <option value="withdrawal" ${expense.category === 'withdrawal' ? 'selected' : ''} data-en="Withdrawal" data-ar="سحب">Withdrawal</option>
                        <option value="other" ${expense.category === 'other' ? 'selected' : ''} data-en="Other" data-ar="أخرى">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-expense-description" data-en="Description" data-ar="الوصف">Description</label>
                    <input type="text" id="edit-expense-description" name="expense-description" value="${expense.description}" required>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i>
                    <span data-en="Save Changes" data-ar="حفظ التغييرات">Save Changes</span>
                </button>
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                    <span data-en="Cancel" data-ar="إلغاء">Cancel</span>
                </button>
            </div>
        `;

        // Handle form submission
        editForm.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(editForm);
            
            expense.date = formData.get('expense-date');
            expense.amount = parseFloat(formData.get('expense-amount'));
            expense.category = formData.get('expense-category');
            expense.description = formData.get('expense-description');

            this.saveData();
            this.updateDashboard();
            this.updateExpensesTable();
            this.closeModal();
            this.showSuccessMessage(this.getText('Expense updated successfully!', 'تم تحديث المصروف بنجاح!'));
        };

        modal.classList.add('active');
    }

    deleteExpense(id) {
        this.showConfirmModal(
            this.getText('Delete Expense', 'حذف المصروف'),
            this.getText('Are you sure you want to delete this expense?', 'هل أنت متأكد من أنك تريد حذف هذا المصروف؟'),
            () => {
                this.data.expenses = this.data.expenses.filter(expense => expense.id !== id);
                this.saveData();
                this.updateDashboard();
                this.updateExpensesTable();
                this.closeModal();
                this.showSuccessMessage(this.getText('Expense deleted!', 'تم حذف المصروف!'));
            }
        );
    }

    editDebt(id) {
        const debt = this.data.debts.find(d => d.id === id);
        if (!debt) {
            this.showErrorMessage(this.getText('Debt not found!', 'لم يتم العثور على الدين!'));
            return;
        }

        const modal = document.getElementById('edit-modal');
        const modalTitle = document.getElementById('edit-modal-title');
        const editForm = document.getElementById('edit-form');

        modalTitle.textContent = this.getText('Edit Debt', 'تعديل الدين');

        editForm.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-debt-date" data-en="Date" data-ar="التاريخ">Date</label>
                    <input type="date" id="edit-debt-date" name="debt-date" value="${debt.date}" required>
                </div>
                <div class="form-group">
                    <label for="edit-debt-amount" data-en="Amount (€)" data-ar="المبلغ (€)">Amount (€)</label>
                    <input type="number" id="edit-debt-amount" name="debt-amount" step="0.01" value="${debt.amount}" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-debt-type" data-en="Type" data-ar="النوع">Type</label>
                    <select id="edit-debt-type" name="debt-type" required>
                        <option value="loan" ${debt.type === 'loan' ? 'selected' : ''} data-en="Loan" data-ar="قرض">Loan</option>
                        <option value="credit" ${debt.type === 'credit' ? 'selected' : ''} data-en="Credit Card" data-ar="بطاقة ائتمان">Credit Card</option>
                        <option value="personal" ${debt.type === 'personal' ? 'selected' : ''} data-en="Personal Debt" data-ar="دين شخصي">Personal Debt</option>
                        <option value="other" ${debt.type === 'other' ? 'selected' : ''} data-en="Other" data-ar="أخرى">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-debt-description" data-en="Description" data-ar="الوصف">Description</label>
                    <input type="text" id="edit-debt-description" name="debt-description" value="${debt.description}" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-debt-status" data-en="Status" data-ar="الحالة">Status</label>
                    <select id="edit-debt-status" name="debt-status" required>
                        <option value="pending" ${debt.status === 'pending' ? 'selected' : ''} data-en="Not Done" data-ar="لم يتم">Not Done</option>
                        <option value="completed" ${debt.status === 'completed' ? 'selected' : ''} data-en="Done" data-ar="تم">Done</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-debt-due-date" data-en="Due Date" data-ar="تاريخ الاستحقاق">Due Date</label>
                    <input type="date" id="edit-debt-due-date" name="debt-due-date" value="${debt.dueDate || ''}">
                </div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i>
                    <span data-en="Save Changes" data-ar="حفظ التغييرات">Save Changes</span>
                </button>
                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                    <span data-en="Cancel" data-ar="إلغاء">Cancel</span>
                </button>
            </div>
        `;

        // Handle form submission
        editForm.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(editForm);
            
            debt.date = formData.get('debt-date');
            debt.amount = parseFloat(formData.get('debt-amount'));
            debt.type = formData.get('debt-type');
            debt.description = formData.get('debt-description');
            debt.status = formData.get('debt-status');
            debt.dueDate = formData.get('debt-due-date');

            this.saveData();
            this.updateDashboard();
            this.updateDebtsTable();
            this.closeModal();
            this.showSuccessMessage(this.getText('Debt updated successfully!', 'تم تحديث الدين بنجاح!'));
        };

        modal.classList.add('active');
    }

    toggleDebtStatus(id) {
        const debt = this.data.debts.find(d => d.id === id);
        if (!debt) return;

        const newStatus = debt.status === 'pending' ? 'completed' : 'pending';
        const statusText = newStatus === 'completed' 
            ? this.getText('Done', 'تم') 
            : this.getText('Not Done', 'لم يتم');

        debt.status = newStatus;
        this.saveData();
        this.updateDashboard();
        this.updateDebtsTable();
        
        const message = newStatus === 'completed' 
            ? this.getText('Debt marked as completed!', 'تم تحديد الدين كمكتمل!')
            : this.getText('Debt marked as pending!', 'تم تحديد الدين كقيد الانتظار!');
        
        this.showSuccessMessage(message);
    }

    deleteDebt(id) {
        this.showConfirmModal(
            this.getText('Delete Debt', 'حذف الدين'),
            this.getText('Are you sure you want to delete this debt?', 'هل أنت متأكد من أنك تريد حذف هذا الدين؟'),
            () => {
                this.data.debts = this.data.debts.filter(debt => debt.id !== id);
                this.saveData();
                this.updateDashboard();
                this.updateDebtsTable();
                this.closeModal();
                this.showSuccessMessage(this.getText('Debt deleted!', 'تم حذف الدين!'));
            }
        );
    }



    // ===== APPOINTMENT MANAGEMENT =====
    
    initWorkSchedule() {
        this.renderMonthlyCalendar();
        this.renderWeeklySchedule();
        this.updateScheduleStats();
        this.renderHolidaysList();
        this.setupScheduleEventListeners();
        this.setupCalendarControls();
    }

    setupScheduleEventListeners() {
        const editScheduleBtn = document.getElementById('edit-schedule-btn');
        const addHolidayBtn = document.getElementById('add-holiday-btn');
        const scheduleForm = document.getElementById('schedule-form');
        const holidayForm = document.getElementById('holiday-form');

        if (editScheduleBtn) {
            editScheduleBtn.addEventListener('click', () => this.openScheduleModal());
        }

        if (addHolidayBtn) {
            addHolidayBtn.addEventListener('click', () => this.openHolidayModal());
        }

        if (scheduleForm) {
            scheduleForm.addEventListener('submit', (e) => this.handleScheduleSubmit(e));
        }

        if (holidayForm) {
            holidayForm.addEventListener('submit', (e) => this.handleHolidaySubmit(e));
        }
    }

    setupCalendarControls() {
        const prevBtn = document.getElementById('prev-month-btn');
        const nextBtn = document.getElementById('next-month-btn');
        const todayBtn = document.getElementById('today-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateMonth(-1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateMonth(1));
        }
        if (todayBtn) {
            todayBtn.addEventListener('click', () => this.goToToday());
        }
    }

    navigateMonth(direction) {
        this.currentMonth += direction;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderMonthlyCalendar();
    }

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.renderMonthlyCalendar();
    }

    renderMonthlyCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthTitle = document.getElementById('current-month');
        
        if (!grid || !monthTitle) return;

        const today = new Date();
        const currentDate = new Date(this.currentYear, this.currentMonth, 1);
        const firstDay = currentDate.getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const lastMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

        // Update month title
            const monthNames = [
                this.getText('January', 'يناير'), this.getText('February', 'فبراير'), 
                this.getText('March', 'مارس'), this.getText('April', 'أبريل'),
                this.getText('May', 'مايو'), this.getText('June', 'يونيو'),
                this.getText('July', 'يوليو'), this.getText('August', 'أغسطس'),
                this.getText('September', 'سبتمبر'), this.getText('October', 'أكتوبر'),
                this.getText('November', 'نوفمبر'), this.getText('December', 'ديسمبر')
            ];
        
        monthTitle.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        let calendarHTML = '';

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = lastMonthDays - i;
            calendarHTML += `
                <div class="calendar-day other-month" data-date="${this.currentYear}-${this.currentMonth}-${day}">
                    <div class="calendar-day-number">${day}</div>
            </div>
            `;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getDate() === day && today.getMonth() === this.currentMonth && today.getFullYear() === this.currentYear;
            const daySchedule = this.getDaySchedule(dateKey);
            
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (daySchedule && daySchedule.type) dayClass += ` ${daySchedule.type}-day`;

            calendarHTML += `
                <div class="calendar-day ${dayClass}" data-date="${dateKey}" onclick="app.openDayEditModal('${dateKey}')">
                    <div class="calendar-day-number">${day}</div>
                    ${daySchedule && daySchedule.start && daySchedule.end ? `<div class="calendar-day-time">${daySchedule.start} - ${daySchedule.end}</div>` : ''}
                    ${daySchedule && daySchedule.notes ? `<div class="calendar-day-notes">${daySchedule.notes}</div>` : ''}
                    ${daySchedule && daySchedule.type ? `<div class="calendar-day-type ${daySchedule.type}">${this.getDayTypeText(daySchedule.type)}</div>` : ''}
                </div>
            `;
        }

        // Next month days to complete the grid
        const totalCells = 42; // 6 rows * 7 days
        const remainingCells = totalCells - (firstDay + daysInMonth);
        
        for (let day = 1; day <= remainingCells; day++) {
            calendarHTML += `
                <div class="calendar-day other-month" data-date="${this.currentYear}-${this.currentMonth + 2}-${day}">
                    <div class="calendar-day-number">${day}</div>
                    </div>
            `;
        }

        grid.innerHTML = calendarHTML;
    }

    getDaySchedule(dateKey) {
        // Check if there's a specific schedule for this date
        if (this.data.dailySchedules && this.data.dailySchedules[dateKey]) {
            return this.data.dailySchedules[dateKey];
        }

        // Fall back to weekly schedule based on day of week
        const date = new Date(dateKey);
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = dayNames[date.getDay()];
        
        return this.data.workSchedule?.[dayKey] || null;
    }

    getDayTypeText(type) {
        switch (type) {
            case 'work': return this.getText('W', 'ع');
            case 'holiday': return this.getText('H', 'ع');
            case 'off': return this.getText('O', 'ر');
            default: return '';
        }
    }

    renderWeeklySchedule() {
        const grid = document.getElementById('weekly-schedule-grid');
        if (!grid) return;

        const days = [
            { name: this.getText('Sunday', 'الأحد'), key: 'sunday', isWorkDay: false },
            { name: this.getText('Monday', 'الاثنين'), key: 'monday', isWorkDay: true },
            { name: this.getText('Tuesday', 'الثلاثاء'), key: 'tuesday', isWorkDay: true },
            { name: this.getText('Wednesday', 'الأربعاء'), key: 'wednesday', isWorkDay: true },
            { name: this.getText('Thursday', 'الخميس'), key: 'thursday', isWorkDay: true },
            { name: this.getText('Friday', 'الجمعة'), key: 'friday', isWorkDay: true },
            { name: this.getText('Saturday', 'السبت'), key: 'saturday', isWorkDay: false }
        ];

        grid.innerHTML = days.map(day => {
            const schedule = this.data.workSchedule?.[day.key] || { start: '09:00', end: '17:00', notes: '', type: 'work' };
            const isWorkDay = this.data.workSchedule?.[day.key]?.isWorkDay ?? day.isWorkDay;
            const dayType = this.data.workSchedule?.[day.key]?.type || (isWorkDay ? 'work' : 'off');
            const notes = this.data.workSchedule?.[day.key]?.notes || '';
            
            let statusText, cardClass;
            if (dayType === 'holiday') {
                statusText = this.getText('Holiday', 'عطلة');
                cardClass = 'holiday';
            } else if (dayType === 'work') {
                statusText = this.getText('Work', 'عمل');
                cardClass = 'work-day';
            } else {
                statusText = this.getText('Off', 'عطلة');
                cardClass = 'weekend';
            }

            return `
                <div class="weekly-day-card ${cardClass}" data-day="${day.key}" onclick="app.openDayEditModal('${day.key}')">
                    <div class="day-name">${day.name}</div>
                    <div class="day-hours">${schedule.start} - ${schedule.end}</div>
                    <div class="day-status ${dayType}">${statusText}</div>
                    ${notes ? `<div class="day-notes">${notes}</div>` : ''}
                    <div class="day-edit-hint">
                        <i class="fas fa-edit"></i>
                        <span>${this.getText('Click to edit', 'اضغط للتعديل')}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateScheduleStats() {
        const workDaysCount = document.getElementById('work-days-count');
        const dailyHours = document.getElementById('daily-hours');
        const holidaysCount = document.getElementById('holidays-count');
        const weeklyHours = document.getElementById('weekly-hours');

        if (workDaysCount) {
            const workDays = Object.values(this.data.workSchedule || {}).filter(day => day.isWorkDay).length;
            workDaysCount.textContent = workDays;
        }

        if (dailyHours) {
            const avgHours = this.calculateAverageDailyHours();
            dailyHours.textContent = avgHours;
        }

        if (holidaysCount) {
            const holidays = this.data.holidays?.length || 0;
            holidaysCount.textContent = holidays;
        }

        if (weeklyHours) {
            const weekly = this.calculateWeeklyHours();
            weeklyHours.textContent = weekly;
        }
    }

    calculateAverageDailyHours() {
        const workDays = Object.values(this.data.workSchedule || {}).filter(day => day.isWorkDay);
        if (workDays.length === 0) return 8;

        const totalHours = workDays.reduce((total, day) => {
            const start = new Date(`2000-01-01T${day.start}`);
            const end = new Date(`2000-01-01T${day.end}`);
            return total + (end - start) / (1000 * 60 * 60);
        }, 0);

        return Math.round(totalHours / workDays.length);
    }

    calculateWeeklyHours() {
        const workDays = Object.values(this.data.workSchedule || {}).filter(day => day.isWorkDay);
        const totalHours = workDays.reduce((total, day) => {
            const start = new Date(`2000-01-01T${day.start}`);
            const end = new Date(`2000-01-01T${day.end}`);
            return total + (end - start) / (1000 * 60 * 60);
        }, 0);

        return Math.round(totalHours);
    }

    renderHolidaysList() {
        const list = document.getElementById('holidays-list');
        if (!list) return;

        const holidays = this.data.holidays || [];
        
        if (holidays.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-umbrella-beach"></i>
                    <p>${this.getText('No holidays added yet', 'لم يتم إضافة عطل بعد')}</p>
                </div>
            `;
            return;
        }

        list.innerHTML = holidays.map(holiday => {
            const startDate = new Date(holiday.startDate).toLocaleDateString();
            const endDate = new Date(holiday.endDate).toLocaleDateString();
            const typeClass = holiday.type || 'public';
            const typeText = this.getHolidayTypeText(holiday.type);

            return `
                <div class="holiday-item">
                    <div class="holiday-info">
                        <div class="holiday-name">${holiday.name}</div>
                        <div class="holiday-dates">${startDate} - ${endDate}</div>
                        <span class="holiday-type ${typeClass}">${typeText}</span>
                    </div>
                    <div class="holiday-actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.editHoliday('${holiday.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteHoliday('${holiday.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getHolidayTypeText(type) {
        const types = {
            public: { en: 'Public Holiday', ar: 'عطلة رسمية' },
            personal: { en: 'Personal Leave', ar: 'إجازة شخصية' },
            sick: { en: 'Sick Leave', ar: 'إجازة مرضية' },
            vacation: { en: 'Vacation', ar: 'إجازة' }
        };
        const typeInfo = types[type] || types.public;
        return this.getText(typeInfo.en, typeInfo.ar);
    }

    openScheduleModal() {
        const modal = document.getElementById('schedule-edit-modal');
        this.populateScheduleForm();
        modal.classList.add('active');
        this.trapFocus(modal);
    }

    closeScheduleModal() {
        const modal = document.getElementById('schedule-edit-modal');
        modal.classList.remove('active');
        this.restoreFocus();
    }

    populateScheduleForm() {
        const schedule = this.data.workSchedule || {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach(day => {
            const dayData = schedule[day] || { start: '09:00', end: '17:00', isWorkDay: day !== 'saturday' && day !== 'sunday' };
            
            const checkbox = document.getElementById(`${day}-work`);
            const startInput = document.getElementById(`${day}-start`);
            const endInput = document.getElementById(`${day}-end`);

            if (checkbox) checkbox.checked = dayData.isWorkDay;
            if (startInput) startInput.value = dayData.start;
            if (endInput) endInput.value = dayData.end;
        });
    }

    handleScheduleSubmit(e) {
        e.preventDefault();
        
        const schedule = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach(day => {
            const checkbox = document.getElementById(`${day}-work`);
            const startInput = document.getElementById(`${day}-start`);
            const endInput = document.getElementById(`${day}-end`);

            schedule[day] = {
                isWorkDay: checkbox?.checked || false,
                start: startInput?.value || '09:00',
                end: endInput?.value || '17:00'
            };
        });

        this.data.workSchedule = schedule;
        this.saveData();
        this.renderWeeklySchedule();
        this.updateScheduleStats();
        this.closeScheduleModal();
        this.showSuccessMessage(this.getText('Work schedule updated successfully!', 'تم تحديث جدول العمل بنجاح!'));
    }

    openHolidayModal(holiday = null) {
        const modal = document.getElementById('holiday-modal');
        const modalTitle = document.getElementById('holiday-modal-title');
        const form = document.getElementById('holiday-form');

        if (holiday) {
            modalTitle.textContent = this.getText('Edit Holiday', 'تعديل العطلة');
            this.populateHolidayForm(holiday);
        } else {
            modalTitle.textContent = this.getText('Add Holiday', 'إضافة عطلة');
            form.reset();
            this.setDefaultHolidayDates();
        }

        modal.classList.add('active');
        this.trapFocus(modal);
    }

    closeHolidayModal() {
        const modal = document.getElementById('holiday-modal');
        modal.classList.remove('active');
        this.restoreFocus();
    }

    openDayEditModal(dayKey) {
        let day, title;
        
        // Check if it's a specific date or day of week
        if (dayKey.includes('-')) {
            // It's a specific date (YYYY-MM-DD format)
            day = this.data.dailySchedules?.[dayKey] || this.getDaySchedule(dayKey) || { start: '09:00', end: '17:00', notes: '', type: 'work' };
            const date = new Date(dayKey);
            const dayNames = [
                this.getText('Sunday', 'الأحد'), this.getText('Monday', 'الاثنين'),
                this.getText('Tuesday', 'الثلاثاء'), this.getText('Wednesday', 'الأربعاء'),
                this.getText('Thursday', 'الخميس'), this.getText('Friday', 'الجمعة'),
                this.getText('Saturday', 'السبت')
            ];
            const monthNames = [
                this.getText('January', 'يناير'), this.getText('February', 'فبراير'),
                this.getText('March', 'مارس'), this.getText('April', 'أبريل'),
                this.getText('May', 'مايو'), this.getText('June', 'يونيو'),
                this.getText('July', 'يوليو'), this.getText('August', 'أغسطس'),
                this.getText('September', 'سبتمبر'), this.getText('October', 'أكتوبر'),
                this.getText('November', 'نوفمبر'), this.getText('December', 'ديسمبر')
            ];
            title = `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        } else {
            // It's a day of week
            day = this.data.workSchedule?.[dayKey] || { start: '09:00', end: '17:00', notes: '', type: 'work' };
        const dayNames = {
            sunday: this.getText('Sunday', 'الأحد'),
            monday: this.getText('Monday', 'الاثنين'),
            tuesday: this.getText('Tuesday', 'الثلاثاء'),
            wednesday: this.getText('Wednesday', 'الأربعاء'),
            thursday: this.getText('Thursday', 'الخميس'),
            friday: this.getText('Friday', 'الجمعة'),
            saturday: this.getText('Saturday', 'السبت')
        };
            title = this.getText(`Edit ${dayNames[dayKey]}`, `تعديل ${dayNames[dayKey]}`);
        }

        const modal = document.getElementById('day-edit-modal');
        if (modal) {
            // Populate form fields
            const titleElement = modal.querySelector('#day-edit-modal-title');
            const startTime = modal.querySelector('#day-start-time');
            const endTime = modal.querySelector('#day-end-time');
            const dayType = modal.querySelector('#day-type');
            const notes = modal.querySelector('#day-notes');
            const saveBtn = modal.querySelector('#save-day-btn');

            if (titleElement) titleElement.textContent = title;
            if (startTime) startTime.value = day.start;
            if (endTime) endTime.value = day.end;
            if (dayType) dayType.value = day.type;
            if (notes) notes.value = day.notes;

            // Store the day key for saving
            saveBtn.setAttribute('data-day-key', dayKey);

            modal.classList.add('active');
            this.trapFocus(modal);
        }
    }

    closeDayEditModal() {
        const modal = document.getElementById('day-edit-modal');
        if (modal) {
            modal.classList.remove('active');
            this.restoreFocus();
        }
    }

    saveDaySettings() {
        const modal = document.getElementById('day-edit-modal');
        const saveBtn = modal.querySelector('#save-day-btn');
        const dayKey = saveBtn.getAttribute('data-day-key');
        
        const startTime = modal.querySelector('#day-start-time').value;
        const endTime = modal.querySelector('#day-end-time').value;
        const dayType = modal.querySelector('#day-type').value;
        const notes = modal.querySelector('#day-notes').value;

        // Validate times
        if (startTime >= endTime) {
            alert(this.getText('Start time must be before end time', 'وقت البداية يجب أن يكون قبل وقت النهاية'));
            return;
        }

        // Check if it's a specific date or day of week
        if (dayKey.includes('-')) {
            // It's a specific date - save to dailySchedules
            if (!this.data.dailySchedules) {
                this.data.dailySchedules = {};
            }
            
            this.data.dailySchedules[dayKey] = {
                start: startTime,
                end: endTime,
                type: dayType,
                notes: notes,
                isWorkDay: dayType === 'work'
            };
            } else {
            // It's a day of week - save to workSchedule
            if (!this.data.workSchedule[dayKey]) {
                this.data.workSchedule[dayKey] = {};
        }
        
        this.data.workSchedule[dayKey] = {
                ...this.data.workSchedule[dayKey],
                start: startTime,
                end: endTime,
                type: dayType,
                notes: notes,
                isWorkDay: dayType === 'work'
            };
        }

        // Save data and update UI
        this.saveData();
        this.renderMonthlyCalendar();
        this.renderWeeklySchedule();
        this.updateScheduleStats();
        this.updateDashboard();
        
        // Close modal
        this.closeDayEditModal();
        this.showSuccessMessage(this.getText('Day settings updated successfully!', 'تم تحديث إعدادات اليوم بنجاح!'));
    }

    setDefaultHolidayDates() {
        const startInput = document.getElementById('holiday-start-date');
        const endInput = document.getElementById('holiday-end-date');
        
        if (startInput) {
            const today = new Date();
            startInput.value = today.toISOString().split('T')[0];
        }
        
        if (endInput) {
            const today = new Date();
            endInput.value = today.toISOString().split('T')[0];
        }
    }

    populateHolidayForm(holiday) {
        const fields = ['holiday-name', 'holiday-type', 'holiday-start-date', 'holiday-end-date', 'holiday-description'];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && holiday[fieldId.replace('holiday-', '')] !== undefined) {
                field.value = holiday[fieldId.replace('holiday-', '')];
            }
        });
    }

    handleHolidaySubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const holiday = {
            id: Date.now().toString(),
            name: formData.get('holiday-name') || document.getElementById('holiday-name').value,
            type: formData.get('holiday-type') || document.getElementById('holiday-type').value,
            startDate: formData.get('holiday-start-date') || document.getElementById('holiday-start-date').value,
            endDate: formData.get('holiday-end-date') || document.getElementById('holiday-end-date').value,
            description: formData.get('holiday-description') || document.getElementById('holiday-description').value
        };

        if (!this.data.holidays) this.data.holidays = [];
        this.data.holidays.push(holiday);
        
        this.saveData();
        this.renderHolidaysList();
        this.updateScheduleStats();
        this.closeHolidayModal();
        this.showSuccessMessage(this.getText('Holiday added successfully!', 'تم إضافة العطلة بنجاح!'));
    }

    editHoliday(id) {
        const holiday = this.data.holidays?.find(h => h.id === id);
        if (holiday) {
            this.openHolidayModal(holiday);
        }
    }

    deleteHoliday(id) {
        if (confirm(this.getText('Are you sure you want to delete this holiday?', 'هل أنت متأكد من حذف هذه العطلة؟'))) {
            this.data.holidays = this.data.holidays?.filter(h => h.id !== id) || [];
            this.saveData();
            this.renderHolidaysList();
            this.updateScheduleStats();
            this.showSuccessMessage(this.getText('Holiday deleted successfully!', 'تم حذف العطلة بنجاح!'));
        }
    }

    openAppointmentModal(appointment = null) {
        const modal = document.getElementById('appointment-modal');
        const modalTitle = document.getElementById('appointment-modal-title');
        const form = document.getElementById('appointment-form');

        if (appointment) {
            // Edit mode
            modalTitle.textContent = this.getText('Edit Appointment', 'تعديل الموعد');
            this.populateAppointmentForm(appointment);
        } else {
            // Add mode
            modalTitle.textContent = this.getText('Add Appointment', 'إضافة موعد');
            form.reset();
            this.setDefaultAppointmentDate();
        }

        modal.classList.add('active');
        this.trapFocus(modal);
    }

    closeAppointmentModal() {
        const modal = document.getElementById('appointment-modal');
        modal.classList.remove('active');
        this.restoreFocus();
    }

    setDefaultAppointmentDate() {
        const dateInput = document.getElementById('appointment-date');
        const timeInput = document.getElementById('appointment-time');
        
        if (dateInput) {
            const today = new Date();
            dateInput.value = today.toISOString().split('T')[0];
        }
        
        if (timeInput) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeInput.value = `${hours}:${minutes}`;
        }
    }

    populateAppointmentForm(appointment) {
        const form = document.getElementById('appointment-form');
        const fields = [
            'appointment-title', 'appointment-category', 'appointment-date',
            'appointment-time', 'appointment-duration', 'appointment-priority',
            'appointment-location', 'appointment-description', 'appointment-reminder',
            'appointment-status'
        ];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && appointment[fieldId.replace('appointment-', '')] !== undefined) {
                field.value = appointment[fieldId.replace('appointment-', '')];
            }
        });
    }

    handleAppointmentSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const appointmentData = {
            id: Date.now().toString(),
            title: formData.get('appointment-title'),
            category: formData.get('appointment-category'),
            date: formData.get('appointment-date'),
            time: formData.get('appointment-time'),
            duration: parseInt(formData.get('appointment-duration')) || 60,
            priority: formData.get('appointment-priority'),
            location: formData.get('appointment-location'),
            description: formData.get('appointment-description'),
            reminder: formData.get('appointment-reminder'),
            status: formData.get('appointment-status'),
            createdAt: new Date().toISOString()
        };

        // Check if editing existing appointment
        const existingIndex = this.data.appointments.findIndex(apt => apt.id === appointmentData.id);
        if (existingIndex !== -1) {
            this.data.appointments[existingIndex] = appointmentData;
        } else {
            this.data.appointments.push(appointmentData);
        }

        this.saveData();
        this.closeAppointmentModal();
        this.renderCalendar();
        this.updateAppointmentStats();
        this.renderAppointmentsList();
        
        this.showNotification(
            this.getText('Appointment saved successfully!', 'تم حفظ الموعد بنجاح!'),
            'success'
        );
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        const currentMonthElement = document.getElementById('current-month');
        
        if (!calendarGrid) return;

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        // Update month display
        if (currentMonthElement) {
            const monthNames = [
                this.getText('January', 'يناير'), this.getText('February', 'فبراير'),
                this.getText('March', 'مارس'), this.getText('April', 'أبريل'),
                this.getText('May', 'مايو'), this.getText('June', 'يونيو'),
                this.getText('July', 'يوليو'), this.getText('August', 'أغسطس'),
                this.getText('September', 'سبتمبر'), this.getText('October', 'أكتوبر'),
                this.getText('November', 'نوفمبر'), this.getText('December', 'ديسمبر')
            ];
            currentMonthElement.textContent = `${monthNames[month]} ${year}`;
        }

        // Clear calendar
        calendarGrid.innerHTML = '';

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Generate calendar days
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayElement = this.createCalendarDay(currentDate, month);
            calendarGrid.appendChild(dayElement);
        }
    }

    createCalendarDay(date, currentMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayNumber = date.getDate();
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isToday = this.isToday(date);
        const hasAppointments = this.getAppointmentsForDate(date).length > 0;

        if (!isCurrentMonth) {
            dayElement.classList.add('other-month');
        }
        if (isToday) {
            dayElement.classList.add('today');
        }
        if (hasAppointments) {
            dayElement.classList.add('has-appointments');
        }

        dayElement.innerHTML = `
            <div class="calendar-day-number">${dayNumber}</div>
            <div class="calendar-day-appointments">
                ${this.getAppointmentDots(date)}
            </div>
        `;

        dayElement.addEventListener('click', () => this.handleDayClick(date));
        
        return dayElement;
    }

    getAppointmentDots(date) {
        const appointments = this.getAppointmentsForDate(date);
        const dots = appointments.slice(0, 3).map(apt => {
            const priorityClass = apt.priority || 'medium';
            return `<div class="appointment-dot ${priorityClass}"></div>`;
        });
        return dots.join('');
    }

    getAppointmentsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.data.appointments.filter(apt => apt.date === dateStr);
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    handleDayClick(date) {
        const appointments = this.getAppointmentsForDate(date);
        if (appointments.length > 0) {
            // Show appointments for this day
            this.showDayAppointments(date, appointments);
        } else {
            // Add new appointment for this day
            this.openAppointmentModalForDate(date);
        }
    }

    openAppointmentModalForDate(date) {
        this.openAppointmentModal();
        const dateInput = document.getElementById('appointment-date');
        if (dateInput) {
            dateInput.value = date.toISOString().split('T')[0];
        }
    }

    showDayAppointments(date, appointments) {
        // This could be implemented as a modal or dropdown
        console.log(`Appointments for ${date.toDateString()}:`, appointments);
    }

    navigateMonth(direction) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        this.renderCalendar();
    }

    goToToday() {
        this.currentMonth = new Date();
        this.renderCalendar();
    }

    updateAppointmentStats() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        const stats = {
            today: this.data.appointments.filter(apt => apt.date === today).length,
            upcoming: this.data.appointments.filter(apt => 
                apt.date > today && apt.status !== 'cancelled'
            ).length,
            completed: this.data.appointments.filter(apt => 
                apt.status === 'completed'
            ).length,
            overdue: this.data.appointments.filter(apt => {
                const aptDate = new Date(apt.date + 'T' + apt.time);
                return aptDate < now && apt.status === 'scheduled';
            }).length
        };

        // Update stats display
        const elements = {
            'today-appointments': stats.today,
            'upcoming-appointments': stats.upcoming,
            'completed-appointments': stats.completed,
            'overdue-appointments': stats.overdue
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    renderAppointmentsList() {
        const appointmentsList = document.getElementById('appointments-list');
        const filter = document.getElementById('appointments-filter')?.value || 'all';
        
        if (!appointmentsList) return;

        let filteredAppointments = [...this.data.appointments];

        // Apply filter
        switch (filter) {
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredAppointments = filteredAppointments.filter(apt => apt.date === today);
                break;
            case 'upcoming':
                const now = new Date();
                filteredAppointments = filteredAppointments.filter(apt => {
                    const aptDate = new Date(apt.date + 'T' + apt.time);
                    return aptDate > now && apt.status !== 'cancelled';
                });
                break;
            case 'completed':
                filteredAppointments = filteredAppointments.filter(apt => apt.status === 'completed');
                break;
            case 'overdue':
                const currentTime = new Date();
                filteredAppointments = filteredAppointments.filter(apt => {
                    const aptDate = new Date(apt.date + 'T' + apt.time);
                    return aptDate < currentTime && apt.status === 'scheduled';
                });
                break;
        }

        // Sort appointments by date and time
        filteredAppointments.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateA - dateB;
        });

        appointmentsList.innerHTML = '';

        if (filteredAppointments.length === 0) {
            appointmentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>${this.getText('No appointments found', 'لا توجد مواعيد')}</p>
                </div>
            `;
            return;
        }

        filteredAppointments.forEach(appointment => {
            const appointmentElement = this.createAppointmentElement(appointment);
            appointmentsList.appendChild(appointmentElement);
        });
    }

    createAppointmentElement(appointment) {
        const element = document.createElement('div');
        element.className = 'appointment-item';
        
        const date = new Date(appointment.date + 'T' + appointment.time);
        const isOverdue = date < new Date() && appointment.status === 'scheduled';
        
        element.innerHTML = `
            <div class="appointment-header">
                <h3 class="appointment-title">${appointment.title}</h3>
                <span class="appointment-time">${this.formatTime(appointment.time)}</span>
            </div>
            <div class="appointment-details">
                <span class="appointment-category">${this.getCategoryText(appointment.category)}</span>
                <span class="appointment-priority ${appointment.priority}">${this.getPriorityText(appointment.priority)}</span>
                <span class="appointment-status ${appointment.status}">${this.getStatusText(appointment.status)}</span>
            </div>
            ${appointment.description ? `<p class="appointment-description">${appointment.description}</p>` : ''}
            ${appointment.location ? `<p class="appointment-location"><i class="fas fa-map-marker-alt"></i> ${appointment.location}</p>` : ''}
            <div class="appointment-actions">
                <button class="btn btn-primary btn-sm" onclick="app.editAppointment('${appointment.id}')">
                    <i class="fas fa-edit"></i>
                    <span>${this.getText('Edit', 'تعديل')}</span>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="app.toggleAppointmentStatus('${appointment.id}')">
                    <i class="fas fa-check"></i>
                    <span>${this.getText('Complete', 'إكمال')}</span>
                </button>
                <button class="btn btn-danger btn-sm" onclick="app.deleteAppointment('${appointment.id}')">
                    <i class="fas fa-trash"></i>
                    <span>${this.getText('Delete', 'حذف')}</span>
                </button>
            </div>
        `;

        if (isOverdue) {
            element.style.borderLeft = '4px solid var(--danger-color)';
        }

        return element;
    }

    formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    getCategoryText(category) {
        const categories = {
            meeting: this.getText('Meeting', 'اجتماع'),
            call: this.getText('Phone Call', 'مكالمة هاتفية'),
            task: this.getText('Task', 'مهمة'),
            deadline: this.getText('Deadline', 'موعد نهائي'),
            reminder: this.getText('Reminder', 'تذكير'),
            other: this.getText('Other', 'أخرى')
        };
        return categories[category] || category;
    }

    getPriorityText(priority) {
        const priorities = {
            urgent: this.getText('Urgent', 'عاجل'),
            high: this.getText('High', 'عالية'),
            medium: this.getText('Medium', 'متوسطة'),
            low: this.getText('Low', 'منخفضة')
        };
        return priorities[priority] || priority;
    }

    getStatusText(status) {
        const statuses = {
            scheduled: this.getText('Scheduled', 'مجدول'),
            'in-progress': this.getText('In Progress', 'قيد التنفيذ'),
            completed: this.getText('Completed', 'مكتمل'),
            cancelled: this.getText('Cancelled', 'ملغي')
        };
        return statuses[status] || status;
    }

    editAppointment(id) {
        const appointment = this.data.appointments.find(apt => apt.id === id);
        if (appointment) {
            this.openAppointmentModal(appointment);
        }
    }

    toggleAppointmentStatus(id) {
        const appointment = this.data.appointments.find(apt => apt.id === id);
        if (appointment) {
            appointment.status = appointment.status === 'completed' ? 'scheduled' : 'completed';
            this.saveData();
            this.renderCalendar();
            this.updateAppointmentStats();
            this.renderAppointmentsList();
        }
    }

    deleteAppointment(id) {
        if (confirm(this.getText('Are you sure you want to delete this appointment?', 'هل أنت متأكد من حذف هذا الموعد؟'))) {
            this.data.appointments = this.data.appointments.filter(apt => apt.id !== id);
            this.saveData();
            this.renderCalendar();
            this.updateAppointmentStats();
            this.renderAppointmentsList();
            
            this.showNotification(
                this.getText('Appointment deleted successfully!', 'تم حذف الموعد بنجاح!'),
                'success'
            );
        }
    }
}

// Initialize the application
const app = new WorkManagerApp();

// Handle form names for FormData
document.addEventListener('DOMContentLoaded', () => {
    // Add name attributes to form inputs
    document.querySelectorAll('input, select, textarea').forEach(input => {
        if (!input.name && input.id) {
            input.name = input.id;
        }
    });
});
