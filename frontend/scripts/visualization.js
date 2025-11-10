/**
 * Visualization Components for Distributed System
 * Handles real-time visual updates for servers, load balancer, and election process
 */

/**
 * Server Monitor - Manages server status visualization
 */
class ServerMonitor {
    constructor() {
        this.servers = [
            { port: 2001, status: 'offline', connections: 0, load: 0 },
            { port: 2002, status: 'offline', connections: 0, load: 0 },
            { port: 2003, status: 'offline', connections: 0, load: 0 }
        ];
        
        this.initializeServerMonitor();
        this.startMockDataGeneration();
    }

    initializeServerMonitor() {
        // Initial render
        this.updateAllServers();
        
        // Listen for connection events
        WSManager.on('connected', () => {
            this.simulateServerActivation();
        });
        
        WSManager.on('disconnected', () => {
            this.simulateServerDeactivation();
        });
    }

    /**
     * Simulate server activation when connected
     */
    simulateServerActivation() {
        this.servers.forEach((server, index) => {
            setTimeout(() => {
                server.status = 'online';
                server.connections = Math.floor(Math.random() * 5) + 1;
                server.load = Math.floor(Math.random() * 60) + 20;
                this.updateServerDisplay(server.port);
                this.showTrafficAnimation(server.port);
            }, index * 500);
        });
    }

    /**
     * Simulate server deactivation when disconnected
     */
    simulateServerDeactivation() {
        this.servers.forEach(server => {
            server.status = 'offline';
            server.connections = 0;
            server.load = 0;
            this.updateServerDisplay(server.port);
            this.hideTrafficAnimation(server.port);
        });
    }

    /**
     * Update server display
     */
    updateServerDisplay(port) {
        const server = this.servers.find(s => s.port === port);
        if (!server) return;

        const statusElement = document.getElementById(`server-${port}-status`);
        const connectionsElement = document.getElementById(`server-${port}-connections`);
        const loadElement = document.getElementById(`server-${port}-load`);
        const serverCard = document.querySelector(`[data-port="${port}"]`);

        if (statusElement) {
            const statusDot = statusElement.querySelector('.status-dot');
            const statusText = statusElement.querySelector('.status-text');
            
            if (statusDot && statusText) {
                statusDot.className = `status-dot ${server.status}`;
                statusText.textContent = server.status.charAt(0).toUpperCase() + server.status.slice(1);
            }
        }

        if (connectionsElement) {
            connectionsElement.textContent = server.connections;
        }

        if (loadElement) {
            loadElement.textContent = server.load + '%';
        }

        if (serverCard) {
            if (server.status === 'online') {
                serverCard.classList.add('online');
            } else {
                serverCard.classList.remove('online');
            }
        }
    }

    /**
     * Show traffic animation
     */
    showTrafficAnimation(port) {
        const trafficElement = document.getElementById(`server-${port}-traffic`);
        if (trafficElement) {
            trafficElement.classList.add('active');
        }
    }

    /**
     * Hide traffic animation
     */
    hideTrafficAnimation(port) {
        const trafficElement = document.getElementById(`server-${port}-traffic`);
        if (trafficElement) {
            trafficElement.classList.remove('active');
        }
    }

    /**
     * Update all servers
     */
    updateAllServers() {
        this.servers.forEach(server => {
            this.updateServerDisplay(server.port);
        });
    }

    /**
     * Start generating mock data for demo purposes
     */
    startMockDataGeneration() {
        setInterval(() => {
            if (WSManager.isConnected) {
                this.servers.forEach(server => {
                    if (server.status === 'online') {
                        // Simulate slight load variations
                        server.load = Math.max(10, Math.min(90, server.load + (Math.random() - 0.5) * 10));
                        server.connections = Math.max(0, Math.min(10, server.connections + Math.floor((Math.random() - 0.5) * 2)));
                        this.updateServerDisplay(server.port);
                    }
                });
            }
        }, 3000);
    }

    /**
     * Get server by port
     */
    getServer(port) {
        return this.servers.find(s => s.port === port);
    }

    /**
     * Get all online servers
     */
    getOnlineServers() {
        return this.servers.filter(s => s.status === 'online');
    }
}

/**
 * Load Balancer Visualizer
 */
class LoadBalancerVisualizer {
    constructor() {
        this.algorithm = 'Round Robin';
        this.currentServerIndex = 0;
        this.distributionData = { 2001: 0, 2002: 0, 2003: 0 };
        this.chart = null;
        
        this.initializeLoadBalancer();
    }

    initializeLoadBalancer() {
        this.updateAlgorithmDisplay();
        this.initializeDistributionChart();
        
        // Listen for WebSocket events
        WSManager.on('connected', () => {
            this.startTrafficSimulation();
        });
        
        WSManager.on('disconnected', () => {
            this.stopTrafficSimulation();
        });
    }

    /**
     * Update algorithm display
     */
    updateAlgorithmDisplay() {
        const algorithmElement = document.getElementById('lbAlgorithm');
        if (algorithmElement) {
            algorithmElement.textContent = this.algorithm;
        }
    }

    /**
     * Initialize distribution chart
     */
    initializeDistributionChart() {
        const canvas = document.getElementById('distributionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.chart = new DistributionChart(ctx, canvas.width, canvas.height);
        this.updateChart();
    }

    /**
     * Start traffic simulation
     */
    startTrafficSimulation() {
        this.trafficInterval = setInterval(() => {
            this.simulateTraffic();
        }, 2000);
    }

    /**
     * Stop traffic simulation
     */
    stopTrafficSimulation() {
        if (this.trafficInterval) {
            clearInterval(this.trafficInterval);
            this.trafficInterval = null;
        }
        
        // Hide all traffic lines
        const trafficLines = document.querySelectorAll('.traffic-line');
        trafficLines.forEach(line => line.classList.remove('active'));
    }

    /**
     * Simulate traffic distribution
     */
    simulateTraffic() {
        const onlineServers = window.ServerMonitor && typeof window.ServerMonitor.getOnlineServers === 'function' 
            ? window.ServerMonitor.getOnlineServers() 
            : [];
        if (onlineServers.length === 0) return;

        // Select next server based on algorithm
        const selectedServer = this.selectServer(onlineServers);
        
        // Show traffic animation
        this.showTrafficToServer(selectedServer.port);
        
        // Update distribution data
        this.distributionData[selectedServer.port]++;
        this.updateChart();
        
        // Log the distribution
        Logger.log('info', 'LoadBalancer', `Routed request to Server ${selectedServer.port}`);
    }

    /**
     * Select server based on load balancing algorithm
     */
    selectServer(onlineServers) {
        switch (this.algorithm) {
            case 'Round Robin':
                return this.roundRobinSelection(onlineServers);
            case 'Least Connections':
                return this.leastConnectionsSelection(onlineServers);
            case 'Random':
                return this.randomSelection(onlineServers);
            default:
                return onlineServers[0];
        }
    }

    /**
     * Round robin server selection
     */
    roundRobinSelection(servers) {
        const server = servers[this.currentServerIndex % servers.length];
        this.currentServerIndex++;
        return server;
    }

    /**
     * Least connections server selection
     */
    leastConnectionsSelection(servers) {
        return servers.reduce((min, server) => 
            server.connections < min.connections ? server : min
        );
    }

    /**
     * Random server selection
     */
    randomSelection(servers) {
        return servers[Math.floor(Math.random() * servers.length)];
    }

    /**
     * Show traffic animation to specific server
     */
    showTrafficToServer(port) {
        const trafficLine = document.querySelector(`.traffic-line[data-server="${port}"]`);
        if (trafficLine) {
            trafficLine.classList.add('active');
            
            // Remove animation after completion
            setTimeout(() => {
                trafficLine.classList.remove('active');
            }, 1500);
        }
    }

    /**
     * Update distribution chart
     */
    updateChart() {
        if (this.chart) {
            const data = [
                this.distributionData[2001],
                this.distributionData[2002],
                this.distributionData[2003]
            ];
            this.chart.updateData(data);
        }
    }

    /**
     * Set load balancing algorithm
     */
    setAlgorithm(algorithm) {
        this.algorithm = algorithm;
        this.updateAlgorithmDisplay();
        Logger.log('info', 'LoadBalancer', `Algorithm changed to: ${algorithm}`);
    }

    /**
     * Reset distribution data
     */
    resetDistribution() {
        this.distributionData = { 2001: 0, 2002: 0, 2003: 0 };
        this.updateChart();
    }
}

/**
 * Simple Distribution Chart Implementation
 */
class DistributionChart {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.data = [0, 0, 0];
        this.colors = [
            'rgba(102, 126, 234, 0.8)',
            'rgba(255, 119, 198, 0.8)', 
            'rgba(0, 255, 136, 0.8)'
        ];
        this.labels = ['Server 2001', 'Server 2002', 'Server 2003'];
    }

    updateData(data) {
        this.data = data;
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Calculate total and max values
        const total = this.data.reduce((sum, val) => sum + val, 0);
        const max = Math.max(...this.data, 1);
        
        if (total === 0) {
            this.drawEmptyChart();
            return;
        }
        
        // Draw bars
        const barWidth = width / this.data.length * 0.8;
        const barSpacing = width / this.data.length * 0.2;
        const chartHeight = height * 0.7;
        
        this.data.forEach((value, index) => {
            const x = (index * width / this.data.length) + barSpacing / 2;
            const barHeight = (value / max) * chartHeight;
            const y = height - barHeight - 30;
            
            // Draw bar
            ctx.fillStyle = this.colors[index];
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw value label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
            
            // Draw server label
            ctx.fillStyle = '#b8b8d4';
            ctx.font = '10px Arial';
            ctx.fillText(`S${this.labels[index].slice(-4)}`, x + barWidth / 2, height - 5);
        });
    }

    drawEmptyChart() {
        const ctx = this.ctx;
        ctx.fillStyle = '#8b8ba7';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data yet', this.width / 2, this.height / 2);
    }
}

/**
 * Election Process Visualizer
 */
class ElectionVisualizer {
    constructor() {
        this.currentCoordinator = null;
        this.electionState = 'idle';
        this.electionSteps = [];
        this.connectedClients = [];
        
        this.initializeElection();
    }

    initializeElection() {
        this.updateElectionDisplay();
        
        // Listen for coordinator updates
        WSManager.on('coordinator', (message) => {
            this.handleCoordinatorMessage(message);
        });
    }

    /**
     * Handle coordinator messages from server
     */
    handleCoordinatorMessage(message) {
        if (message.includes('elected')) {
            const coordinatorId = this.extractCoordinatorId(message);
            this.setCoordinator(coordinatorId);
            this.addElectionStep('Election Complete', 'completed');
            this.setElectionState('completed');
        } else if (message.includes('election')) {
            this.startElection();
            this.addElectionStep('Election Started', 'active');
        }
    }

    /**
     * Extract coordinator ID from message
     */
    extractCoordinatorId(message) {
        const match = message.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Client connected - may trigger election
     */
    clientConnected(clientId) {
        if (!this.connectedClients.includes(clientId)) {
            this.connectedClients.push(clientId);
            
            // First client becomes coordinator
            if (this.connectedClients.length === 1) {
                this.setCoordinator(clientId);
            } else {
                // Simulate election process
                this.simulateElectionProcess();
            }
        }
    }

    /**
     * Client disconnected - may trigger election
     */
    clientDisconnected(clientId) {
        this.connectedClients = this.connectedClients.filter(id => id !== clientId);
        
        // If coordinator disconnected, start new election
        if (clientId === this.currentCoordinator) {
            this.currentCoordinator = null;
            this.simulateElectionProcess();
        }
    }

    /**
     * Simulate election process for visualization
     */
    simulateElectionProcess() {
        if (this.connectedClients.length === 0) {
            this.setCoordinator(null);
            this.setElectionState('idle');
            return;
        }

        this.startElection();
        
        // Simulate election steps
        const steps = [
            { text: 'Election Initiated', delay: 0 },
            { text: 'Broadcasting Election', delay: 1000 },
            { text: 'Collecting Votes', delay: 2000 },
            { text: 'Calculating Results', delay: 3000 },
            { text: 'Announcing Coordinator', delay: 4000 }
        ];
        
        steps.forEach(step => {
            setTimeout(() => {
                this.addElectionStep(step.text, 'active');
                
                if (step.text === 'Announcing Coordinator') {
                    // Select highest ID as coordinator (Bully algorithm)
                    const newCoordinator = Math.max(...this.connectedClients);
                    this.setCoordinator(newCoordinator);
                    this.addElectionStep('Election Complete', 'completed');
                    this.setElectionState('completed');
                }
            }, step.delay);
        });
    }

    /**
     * Start election process
     */
    startElection() {
        this.electionState = 'active';
        this.electionSteps = [];
        this.updateElectionDisplay();
        Logger.log('info', 'Election', 'Election process started');
    }

    /**
     * Set current coordinator
     */
    setCoordinator(coordinatorId) {
        this.currentCoordinator = coordinatorId;
        this.updateElectionDisplay();
        
        if (coordinatorId) {
            Logger.log('info', 'Election', `New coordinator elected: Client ${coordinatorId}`);
        } else {
            Logger.log('info', 'Election', 'No coordinator currently elected');
        }
    }

    /**
     * Set election state
     */
    setElectionState(state) {
        this.electionState = state;
        this.updateElectionDisplay();
        
        if (state === 'completed') {
            // Clear completed state after delay
            setTimeout(() => {
                this.electionState = 'idle';
                this.updateElectionDisplay();
            }, 3000);
        }
    }

    /**
     * Add election step to timeline
     */
    addElectionStep(text, status = 'active') {
        // Mark previous steps as completed
        this.electionSteps.forEach(step => {
            if (step.status === 'active') {
                step.status = 'completed';
            }
        });
        
        this.electionSteps.push({ text, status, timestamp: new Date() });
        this.updateElectionTimeline();
    }

    /**
     * Update election display
     */
    updateElectionDisplay() {
        const coordinatorElement = document.getElementById('currentCoordinator');
        const electionStatusElement = document.getElementById('electionStatus');
        
        if (coordinatorElement) {
            if (this.currentCoordinator) {
                coordinatorElement.textContent = `Client ${this.currentCoordinator}`;
                coordinatorElement.classList.add('active');
            } else {
                coordinatorElement.textContent = 'None';
                coordinatorElement.classList.remove('active');
            }
        }
        
        if (electionStatusElement) {
            const statusText = this.electionState.charAt(0).toUpperCase() + this.electionState.slice(1);
            electionStatusElement.textContent = statusText;
            
            electionStatusElement.className = 'election-value';
            if (this.electionState === 'active') {
                electionStatusElement.classList.add('active');
            }
        }
    }

    /**
     * Update election timeline
     */
    updateElectionTimeline() {
        const timelineElement = document.getElementById('electionTimeline');
        if (!timelineElement) return;
        
        timelineElement.innerHTML = '';
        
        if (this.electionSteps.length === 0) {
            timelineElement.innerHTML = '<div class="election-step">No election in progress</div>';
            return;
        }
        
        this.electionSteps.forEach(step => {
            const stepElement = document.createElement('div');
            stepElement.className = `election-step ${step.status}`;
            stepElement.textContent = step.text;
            timelineElement.appendChild(stepElement);
        });
        
        // Scroll to the latest step
        timelineElement.scrollLeft = timelineElement.scrollWidth;
    }

    /**
     * Update election with external message
     */
    updateElection(message) {
        this.handleCoordinatorMessage(message);
    }
}

/**
 * Logical Clock Manager
 */
class LogicalClockManager {
    constructor() {
        this.clock = 0;
        this.history = [];
        this.maxHistorySize = 10;
        
        this.initializeClock();
    }

    initializeClock() {
        this.updateClockDisplay();
    }

    /**
     * Increment logical clock
     */
    increment(operation = 'Operation') {
        this.clock++;
        this.addToHistory(operation);
        this.updateClockDisplay();
        this.animateClockUpdate();
        
        Logger.log('info', 'LogicalClock', `Clock incremented to ${this.clock} for: ${operation}`);
    }

    /**
     * Add operation to history
     */
    addToHistory(operation) {
        const entry = {
            clock: this.clock,
            operation: operation,
            timestamp: new Date()
        };
        
        this.history.unshift(entry);
        
        // Keep only recent entries
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
        }
        
        this.updateHistoryDisplay();
    }

    /**
     * Update clock display
     */
    updateClockDisplay() {
        const clockElement = document.getElementById('logicalClock');
        if (clockElement) {
            clockElement.textContent = this.clock;
        }
    }

    /**
     * Animate clock update
     */
    animateClockUpdate() {
        const clockElement = document.getElementById('logicalClock');
        if (clockElement) {
            clockElement.classList.add('updated');
            setTimeout(() => {
                clockElement.classList.remove('updated');
            }, 500);
        }
    }

    /**
     * Update history display
     */
    updateHistoryDisplay() {
        const historyElement = document.getElementById('clockHistory');
        if (!historyElement) return;
        
        historyElement.innerHTML = '';
        
        this.history.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'clock-history-item';
            if (index === 0) entryElement.classList.add('recent');
            
            entryElement.textContent = `${entry.clock}: ${entry.operation}`;
            entryElement.title = entry.timestamp.toLocaleTimeString();
            
            historyElement.appendChild(entryElement);
        });
    }

    /**
     * Reset clock
     */
    reset() {
        this.clock = 0;
        this.history = [];
        this.updateClockDisplay();
        this.updateHistoryDisplay();
    }

    /**
     * Sync with external clock value
     */
    sync(externalClock) {
        this.clock = Math.max(this.clock, externalClock) + 1;
        this.addToHistory('Clock Synchronization');
        this.updateClockDisplay();
        this.animateClockUpdate();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVisualizations);
} else {
    initializeVisualizations();
}

function initializeVisualizations() {
    // Create global instances
    window.ServerMonitor = new ServerMonitor();
    window.LoadBalancerVisualizer = new LoadBalancerVisualizer();
    window.ElectionVisualizer = new ElectionVisualizer();
    window.LogicalClock = new LogicalClockManager();

    // Export for compatibility
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            ServerMonitor: window.ServerMonitor,
            LoadBalancerVisualizer: window.LoadBalancerVisualizer,
            ElectionVisualizer: window.ElectionVisualizer,
            LogicalClock: window.LogicalClock
        };
    }
}