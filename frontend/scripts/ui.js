/**
 * UI Utilities and Components
 * Toast notifications, logging, resource monitoring, and other UI helpers
 */

/**
 * Toast Notification System
 */
class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.toasts = [];
        this.maxToasts = 5;
        this.defaultDuration = 5000;
        
        this.createContainer();
    }

    /**
     * Create toast container if it doesn't exist
     */
    createContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a toast notification
     */
    show(message, type = 'info', duration = null) {
        const toast = this.createToast(message, type, duration || this.defaultDuration);
        this.addToast(toast);
    }

    /**
     * Create toast element
     */
    createToast(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Get icon for toast type
        const icon = this.getTypeIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;
        
        // Add close event listener
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
        
        return toast;
    }

    /**
     * Get icon for toast type
     */
    getTypeIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    /**
     * Add toast to container
     */
    addToast(toast) {
        // Remove oldest toast if at max capacity
        if (this.toasts.length >= this.maxToasts) {
            const oldestToast = this.toasts.shift();
            this.removeToast(oldestToast);
        }
        
        this.toasts.push(toast);
        this.container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('animate-bounce-in');
        }, 10);
    }

    /**
     * Remove toast from container
     */
    removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.classList.add('animate-slide-out-right');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            
            // Remove from array
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 400);
    }

    /**
     * Clear all toasts
     */
    clearAll() {
        this.toasts.forEach(toast => this.removeToast(toast));
        this.toasts = [];
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * Logger System
 */
class LoggerSystem {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
        this.filters = {
            info: true,
            warning: true,
            error: true
        };
        
        this.initializeLogger();
    }

    initializeLogger() {
        this.setupLogControls();
        this.updateLogDisplay();
    }

    /**
     * Setup log control event listeners
     */
    setupLogControls() {
        const clearBtn = document.getElementById('clearLog');
        const filterInputs = document.querySelectorAll('.log-filters input[type="checkbox"]');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearLogs();
            });
        }
        
        filterInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const level = e.target.id.replace('filter', '').toLowerCase();
                this.filters[level] = e.target.checked;
                this.updateLogDisplay();
            });
        });
    }

    /**
     * Log a message
     */
    log(level, category, message) {
        const entry = {
            timestamp: new Date(),
            level: level.toLowerCase(),
            category: category,
            message: message
        };
        
        this.logs.unshift(entry);
        
        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
        
        this.updateLogDisplay();
        
        // Also log to console for debugging
        console.log(`[${category}] ${message}`, entry);
    }

    /**
     * Update log display
     */
    updateLogDisplay() {
        const logContent = document.getElementById('logContent');
        if (!logContent) return;
        
        const filteredLogs = this.logs.filter(log => this.filters[log.level]);
        
        if (filteredLogs.length === 0) {
            logContent.innerHTML = '<div class="log-empty">No log entries match current filters</div>';
            return;
        }
        
        logContent.innerHTML = '';
        
        filteredLogs.forEach(log => {
            const logElement = this.createLogElement(log);
            logContent.appendChild(logElement);
        });
        
        // Auto-scroll to top for latest entries
        logContent.scrollTop = 0;
    }

    /**
     * Create log entry element
     */
    createLogElement(log) {
        const element = document.createElement('div');
        element.className = 'log-entry';
        
        const timestamp = log.timestamp.toLocaleTimeString();
        
        element.innerHTML = `
            <div class="log-timestamp">${timestamp}</div>
            <div class="log-level ${log.level}">${log.level.toUpperCase()}</div>
            <div class="log-message">[${log.category}] ${this.escapeHtml(log.message)}</div>
        `;
        
        return element;
    }

    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
        this.updateLogDisplay();
        Toast.show('Log cleared', 'info');
    }

    /**
     * Export logs as text
     */
    exportLogs() {
        const logText = this.logs.map(log => {
            return `${log.timestamp.toISOString()} [${log.level.toUpperCase()}] [${log.category}] ${log.message}`;
        }).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `distributed-fs-logs-${new Date().toISOString().split('T')[0]}.txt`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        Toast.show('Logs exported', 'success');
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * Resource Monitor System
 */
class ResourceMonitor {
    constructor() {
        this.metrics = {
            cpu: 0,
            memory: 0,
            network: 0,
            storage: 0
        };
        
        this.initializeMonitor();
    }

    initializeMonitor() {
        this.startMockMetrics();
        this.updateResourceDisplay();
    }

    /**
     * Start generating mock metrics for demo
     */
    startMockMetrics() {
        setInterval(() => {
            this.generateMockMetrics();
            this.updateResourceDisplay();
        }, 2000);
    }

    /**
     * Generate mock resource metrics
     */
    generateMockMetrics() {
        // Base metrics increase when connected
        const baseMultiplier = WSManager.isConnected ? 1.5 : 0.5;
        
        // CPU usage (varies with activity)
        this.metrics.cpu = Math.max(5, Math.min(85, 
            this.metrics.cpu + (Math.random() - 0.5) * 10 * baseMultiplier
        ));
        
        // Memory usage (gradual increase)
        this.metrics.memory = Math.max(10, Math.min(75, 
            this.metrics.memory + (Math.random() - 0.3) * 5 * baseMultiplier
        ));
        
        // Network activity (spikes with file operations)
        const networkBase = WSManager.messageCount > 0 ? 30 : 5;
        this.metrics.network = Math.max(0, Math.min(100, 
            networkBase + Math.random() * 40 * baseMultiplier
        ));
        
        // Storage usage (slowly increasing)
        const storageIncrease = FileManager && FileManager.fileList ? FileManager.fileList.length * 2 : 0;
        this.metrics.storage = Math.min(90, 20 + storageIncrease + Math.random() * 10);
    }

    /**
     * Update resource display
     */
    updateResourceDisplay() {
        this.updateResourceBar('cpu', this.metrics.cpu, '%');
        this.updateResourceBar('memory', this.metrics.memory, '%');
        this.updateResourceBar('network', this.metrics.network, 'KB/s');
        this.updateResourceBar('storage', this.metrics.storage, 'MB');
    }

    /**
     * Update individual resource bar
     */
    updateResourceBar(type, value, unit) {
        const fillElement = document.getElementById(`${type}Usage`);
        const valueElement = document.getElementById(`${type}Value`);
        
        if (fillElement) {
            fillElement.style.width = `${value}%`;
            
            // Change color based on usage level
            fillElement.className = 'resource-fill';
            if (value > 80) {
                fillElement.classList.add('error');
            } else if (value > 60) {
                fillElement.classList.add('warning');
            }
        }
        
        if (valueElement) {
            if (unit === 'KB/s') {
                valueElement.textContent = `${Math.round(value)} ${unit}`;
            } else if (unit === 'MB') {
                valueElement.textContent = `${Math.round(value)} ${unit}`;
            } else {
                valueElement.textContent = `${Math.round(value)}${unit}`;
            }
        }
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            cpu: Math.random() * 20 + 10,
            memory: Math.random() * 30 + 20,
            network: 0,
            storage: Math.random() * 20 + 10
        };
        this.updateResourceDisplay();
    }
}

/**
 * Database Monitor
 */
class DatabaseMonitor {
    constructor() {
        this.dbStatus = 'offline';
        this.lastBackup = null;
        this.backupSize = 0;
        
        this.initializeDatabase();
    }

    initializeDatabase() {
        WSManager.on('connected', () => {
            this.setDatabaseStatus('online');
            this.scheduleBackups();
        });
        
        WSManager.on('disconnected', () => {
            this.setDatabaseStatus('offline');
            this.stopBackups();
        });
        
        this.updateDatabaseDisplay();
    }

    /**
     * Set database status
     */
    setDatabaseStatus(status) {
        this.dbStatus = status;
        this.updateDatabaseDisplay();
        Logger.log('info', 'Database', `Database status: ${status}`);
    }

    /**
     * Schedule periodic backups
     */
    scheduleBackups() {
        // Initial backup after connection
        setTimeout(() => {
            this.performBackup();
        }, 2000);
        
        // Regular backups every 30 seconds for demo
        this.backupInterval = setInterval(() => {
            this.performBackup();
        }, 30000);
    }

    /**
     * Stop backup scheduling
     */
    stopBackups() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
    }

    /**
     * Perform database backup
     */
    performBackup() {
        this.lastBackup = new Date();
        this.backupSize = Math.floor(Math.random() * 1000) + 500; // KB
        
        this.showBackupIndicator();
        this.updateDatabaseDisplay();
        
        Logger.log('info', 'Database', `Backup completed: ${this.backupSize} KB`);
        Toast.show('Database backup completed', 'success');
    }

    /**
     * Show backup indicator animation
     */
    showBackupIndicator() {
        const indicator = document.getElementById('backupIndicator');
        if (indicator) {
            indicator.classList.add('active');
            
            setTimeout(() => {
                indicator.classList.remove('active');
            }, 3000);
        }
    }

    /**
     * Update database display
     */
    updateDatabaseDisplay() {
        const dbStatusElement = document.getElementById('dbStatus');
        const lastBackupElement = document.getElementById('lastBackup');
        const backupSizeElement = document.getElementById('backupSize');
        
        if (dbStatusElement) {
            const statusDot = dbStatusElement.querySelector('.status-dot');
            const statusText = dbStatusElement.querySelector('span:not(.status-dot)');
            
            if (statusDot) {
                statusDot.className = `status-dot ${this.dbStatus}`;
            }
            
            if (statusText) {
                statusText.textContent = this.dbStatus.charAt(0).toUpperCase() + this.dbStatus.slice(1);
            }
        }
        
        if (lastBackupElement) {
            if (this.lastBackup) {
                lastBackupElement.textContent = this.lastBackup.toLocaleTimeString();
            } else {
                lastBackupElement.textContent = 'Never';
            }
        }
        
        if (backupSizeElement) {
            backupSizeElement.textContent = `${this.backupSize} KB`;
        }
    }
}

/**
 * Modal Manager
 */
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.setupGlobalListeners();
    }

    /**
     * Setup global modal event listeners
     */
    setupGlobalListeners() {
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });
    }

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        this.activeModal = modal;
        modal.classList.add('animate-scale-in');
        modal.style.display = 'flex';
        
        // Focus management for accessibility
        const firstFocusable = modal.querySelector('button, input, select, textarea');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    /**
     * Close active modal
     */
    closeModal() {
        if (!this.activeModal) return;

        this.activeModal.classList.add('animate-scale-out');
        
        setTimeout(() => {
            if (this.activeModal) {
                this.activeModal.style.display = 'none';
                this.activeModal.classList.remove('animate-scale-in', 'animate-scale-out');
                this.activeModal = null;
            }
        }, 300);
    }
}

/**
 * Utility Functions
 */
class Utils {
    /**
     * Debounce function calls
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function calls
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Format file size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Generate unique ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Deep clone object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Check if element is in viewport
     */
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}

// Create global instances
window.Toast = new ToastManager();
window.Logger = new LoggerSystem();
window.ResourceMonitor = new ResourceMonitor();
window.DatabaseMonitor = new DatabaseMonitor();
window.ModalManager = new ModalManager();
window.Utils = Utils;