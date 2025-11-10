/**
 * Main Application Controller
 * Coordinates all components and handles application lifecycle
 */

class DistributedFileSystemApp {
    constructor() {
        this.isInitialized = false;
        this.autoConnectEnabled = false;
        this.healthCheckInterval = null;
        
        this.initializeApplication();
    }

    /**
     * Initialize the application
     */
    async initializeApplication() {
        try {
            Logger.log('info', 'App', 'Initializing Distributed File System Frontend');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.setupApplication();
                });
            } else {
                this.setupApplication();
            }
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            Toast.show('Application initialization failed', 'error');
        }
    }

    /**
     * Setup application after DOM is ready
     */
    setupApplication() {
        this.setupEventListeners();
        this.setupComponentInteractions();
        this.startHealthMonitoring();
        this.setupKeyboardShortcuts();
        this.setupResponsiveHandlers();
        this.showWelcomeMessage();
        
        this.isInitialized = true;
        Logger.log('info', 'App', 'Application initialized successfully');
    }

    /**
     * Setup main event listeners
     */
    setupEventListeners() {
        // Connection controls
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        
        if (connectBtn) {
            connectBtn.addEventListener('click', this.handleConnect.bind(this));
        }
        
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', this.handleDisconnect.bind(this));
        }

        // WebSocket event listeners
        WSManager.on('connected', this.onWebSocketConnected.bind(this));
        WSManager.on('disconnected', this.onWebSocketDisconnected.bind(this));
        WSManager.on('clientId', this.onClientIdReceived.bind(this));
        WSManager.on('message', this.onGenericMessage.bind(this));

        // Window events
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        window.addEventListener('resize', Utils.throttle(this.handleResize.bind(this), 250));
    }

    /**
     * Setup component interactions
     */
    setupComponentInteractions() {
        // File operations integration
        if (window.FileManager) {
            // Refresh file list when connected
            WSManager.on('connected', () => {
                setTimeout(() => {
                    FileManager.refreshFileList();
                }, 1000);
            });
        }

        // Election process integration
        if (window.ElectionVisualizer) {
            WSManager.on('clientId', (clientId) => {
                if (window.ElectionVisualizer && typeof window.ElectionVisualizer.clientConnected === 'function') {
                    window.ElectionVisualizer.clientConnected(clientId);
                }
            });
        }

        // Load balancer integration
        if (window.LoadBalancerVisualizer) {
            // Simulate algorithm changes
            this.setupLoadBalancerControls();
        }

        // Resource monitoring integration
        if (window.ResourceMonitor) {
            WSManager.on('connected', () => {
                ResourceMonitor.resetMetrics();
            });
        }
    }

    /**
     * Setup load balancer controls
     */
    setupLoadBalancerControls() {
        // Add algorithm selector (you can add this to HTML if needed)
        const algorithms = ['Round Robin', 'Least Connections', 'Random'];
        let currentAlgorithm = 0;
        
        // Change algorithm every 30 seconds for demo
        setInterval(() => {
            if (WSManager.isConnected && window.LoadBalancerVisualizer && typeof window.LoadBalancerVisualizer.setAlgorithm === 'function') {
                currentAlgorithm = (currentAlgorithm + 1) % algorithms.length;
                window.LoadBalancerVisualizer.setAlgorithm(algorithms[currentAlgorithm]);
            }
        }, 30000);
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 5000);
    }

    /**
     * Perform application health check
     */
    performHealthCheck() {
        const health = this.getApplicationHealth();
        
        // Log health status occasionally
        if (Math.random() < 0.1) { // 10% chance
            Logger.log('info', 'HealthCheck', `System health: ${health.status}`);
        }
        
        // Handle any issues
        if (health.issues.length > 0) {
            health.issues.forEach(issue => {
                Logger.log('warning', 'HealthCheck', issue);
            });
        }
    }

    /**
     * Get application health status
     */
    getApplicationHealth() {
        const health = {
            status: 'healthy',
            issues: []
        };
        
        // Check WebSocket connection
        if (!WSManager.isConnected && this.autoConnectEnabled) {
            health.issues.push('WebSocket disconnected');
            health.status = 'warning';
        }
        
        // Check component availability
        const components = ['WSManager', 'FileManager', 'Logger', 'Toast'];
        components.forEach(component => {
            if (!window[component]) {
                health.issues.push(`${component} not available`);
                health.status = 'error';
            }
        });
        
        // Check for JavaScript errors (simplified)
        if (window.lastJSError && Date.now() - window.lastJSError < 60000) {
            health.issues.push('Recent JavaScript error detected');
            health.status = 'warning';
        }
        
        return health;
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter: Quick connect
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.handleConnect();
            }
            
            // Escape: Close any open modals
            if (e.key === 'Escape') {
                ModalManager.closeModal();
            }
            
            // Ctrl/Cmd + R: Refresh file list
            if ((e.ctrlKey || e.metaKey) && e.key === 'r' && WSManager.isConnected) {
                e.preventDefault();
                FileManager.refreshFileList();
                Toast.show('File list refreshed', 'info');
            }
            
            // Ctrl/Cmd + L: Clear logs
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                Logger.clearLogs();
            }
        });
    }

    /**
     * Setup responsive handlers
     */
    setupResponsiveHandlers() {
        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 500);
        });
    }

    /**
     * Handle connect button click
     */
    async handleConnect() {
        Logger.log('info', 'App', 'Connection requested by user');
        
        try {
            await WSManager.connect();
            this.autoConnectEnabled = true;
        } catch (error) {
            Logger.log('error', 'App', `Connection failed: ${error.message}`);
            Toast.show('Connection failed', 'error');
        }
    }

    /**
     * Handle disconnect button click
     */
    handleDisconnect() {
        Logger.log('info', 'App', 'Disconnection requested by user');
        
        WSManager.disconnect();
        this.autoConnectEnabled = false;
        Toast.show('Disconnected from server', 'info');
    }

    /**
     * Handle WebSocket connected event
     */
    onWebSocketConnected() {
        Logger.log('info', 'App', 'WebSocket connected successfully');
        Toast.show('Connected to distributed file system', 'success');
        
        // Update UI state
        this.updateConnectionState(true);
        
        // Start system simulation
        this.startSystemSimulation();
    }

    /**
     * Handle WebSocket disconnected event
     */
    onWebSocketDisconnected(event) {
        Logger.log('info', 'App', 'WebSocket disconnected');
        
        // Update UI state
        this.updateConnectionState(false);
        
        // Stop system simulation
        this.stopSystemSimulation();
        
        // Show appropriate message
        if (event && event.code !== 1000) {
            Toast.show('Connection lost unexpectedly', 'warning');
        }
    }

    /**
     * Handle client ID received
     */
    onClientIdReceived(clientId) {
        Logger.log('info', 'App', `Received client ID: ${clientId}`);
        
        // Update UI to reflect single client mode
        this.updateSingleClientMode(clientId);
    }

    /**
     * Handle generic WebSocket messages
     */
    onGenericMessage(data) {
        Logger.log('info', 'WebSocket', `Received message: ${data.command} - ${data.payload}`);
    }

    /**
     * Update connection state in UI
     */
    updateConnectionState(connected) {
        // Update various UI components based on connection state
        const dependentElements = document.querySelectorAll('[data-requires-connection]');
        
        dependentElements.forEach(element => {
            if (connected) {
                element.removeAttribute('disabled');
                element.classList.remove('disabled');
            } else {
                element.setAttribute('disabled', 'true');
                element.classList.add('disabled');
            }
        });
    }

    /**
     * Update single client mode indicators
     */
    updateSingleClientMode(clientId) {
        const singleClientIndicator = document.querySelector('.single-client-indicator');
        if (singleClientIndicator) {
            singleClientIndicator.textContent = `SINGLE CLIENT MODE - ID: ${clientId}`;
        }
    }

    /**
     * Start system simulation for demonstration
     */
    startSystemSimulation() {
        // Simulate some file operations for demo
        setTimeout(() => {
            if (WSManager.isConnected) {
                Logger.log('info', 'Demo', 'Simulating system activity...');
                
                // Simulate some background activity
                LogicalClock.increment('System Initialization');
            }
        }, 2000);
    }

    /**
     * Stop system simulation
     */
    stopSystemSimulation() {
        // Clean up any simulation intervals or timeouts if needed
    }

    /**
     * Handle before unload event
     */
    handleBeforeUnload(e) {
        if (WSManager.isConnected) {
            // Graceful disconnect
            WSManager.disconnect();
        }
    }

    /**
     * Handle online event
     */
    handleOnline() {
        Logger.log('info', 'Network', 'Network connection restored');
        Toast.show('Network connection restored', 'success');
        
        // Attempt to reconnect if auto-connect is enabled
        if (this.autoConnectEnabled && !WSManager.isConnected) {
            setTimeout(() => {
                WSManager.connect();
            }, 1000);
        }
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        Logger.log('warning', 'Network', 'Network connection lost');
        Toast.show('Network connection lost', 'warning');
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update any size-dependent components
        if (window.LoadBalancerVisualizer && window.LoadBalancerVisualizer.chart) {
            // Redraw chart if needed
            LoadBalancerVisualizer.updateChart();
        }
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        setTimeout(() => {
            Toast.show('Welcome to Distributed File System Simulation!', 'info', 8000);
            Logger.log('info', 'App', 'Welcome to Distributed File System Simulation Frontend');
        }, 1000);
    }

    /**
     * Get application status
     */
    getApplicationStatus() {
        return {
            initialized: this.isInitialized,
            connected: WSManager.isConnected,
            clientId: WSManager.clientId,
            autoConnect: this.autoConnectEnabled,
            health: this.getApplicationHealth()
        };
    }

    /**
     * Restart application components
     */
    restart() {
        Logger.log('info', 'App', 'Restarting application...');
        
        // Disconnect if connected
        if (WSManager.isConnected) {
            WSManager.disconnect();
        }
        
        // Clear logs and reset state
        Logger.clearLogs();
        Toast.clearAll();
        
        // Reset components
        if (window.LogicalClock) {
            LogicalClock.reset();
        }
        
        if (window.ResourceMonitor) {
            ResourceMonitor.resetMetrics();
        }
        
        // Re-initialize if needed
        setTimeout(() => {
            Toast.show('Application restarted', 'success');
            this.showWelcomeMessage();
        }, 500);
    }

    /**
     * Export application state for debugging
     */
    exportState() {
        const state = {
            timestamp: new Date().toISOString(),
            status: this.getApplicationStatus(),
            logs: Logger.logs.slice(0, 50), // Last 50 logs
            metrics: ResourceMonitor.getMetrics(),
            wsHealth: WSManager.getHealthStatus()
        };
        
        const stateJson = JSON.stringify(state, null, 2);
        const blob = new Blob([stateJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `dfs-state-${Date.now()}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        Toast.show('Application state exported', 'info');
    }
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
    if (window.Logger) {
        Logger.log('error', 'JavaScript', `${e.message} at ${e.filename}:${e.lineno}`);
    }
    window.lastJSError = Date.now();
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
    if (window.Logger) {
        Logger.log('error', 'Promise', `Unhandled rejection: ${e.reason}`);
    }
});

// Initialize application when script loads
document.addEventListener('DOMContentLoaded', () => {
    window.DistributedFS = new DistributedFileSystemApp();
});

// Export to global scope for debugging
window.DistributedFileSystemApp = DistributedFileSystemApp;