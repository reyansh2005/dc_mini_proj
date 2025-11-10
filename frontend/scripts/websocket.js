/**
 * WebSocket Manager for Distributed File System
 * Handles real-time communication with the backend server
 */

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.url = 'ws://localhost:12345';
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageHandlers = new Map();
        this.connectionStartTime = null;
        this.messageCount = 0;
        this.clientId = null;
        
        // Bind methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.send = this.send.bind(this);
        this.onOpen = this.onOpen.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);
        
        // Initialize auto-reconnect with exponential backoff
        this.initializeReconnectLogic();
    }

    /**
     * Connect to the WebSocket server
     */
    async connect() {
        if (this.isConnected || this.isConnecting) {
            console.log('Already connected or connecting');
            return;
        }

        try {
            this.isConnecting = true;
            this.updateConnectionStatus('connecting', 'Connecting...');
            
            Logger.log('info', 'WebSocket', 'Attempting to connect to ' + this.url);
            
            this.socket = new WebSocket(this.url);
            this.socket.onopen = this.onOpen;
            this.socket.onmessage = this.onMessage;
            this.socket.onclose = this.onClose;
            this.socket.onerror = this.onError;
            
        } catch (error) {
            this.isConnecting = false;
            this.updateConnectionStatus('error', 'Connection failed');
            Logger.log('error', 'WebSocket', 'Connection failed: ' + error.message);
            this.scheduleReconnect();
        }
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        if (this.socket) {
            this.socket.close(1000, 'Manual disconnect');
        }
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.clientId = null;
        this.connectionStartTime = null;
        this.updateConnectionStatus('disconnected', 'Disconnected');
        Logger.log('info', 'WebSocket', 'Disconnected manually');
    }

    /**
     * Send a message to the server
     */
    send(message) {
        if (this.isConnected && this.socket) {
            try {
                this.socket.send(message);
                this.messageCount++;
                this.updateMessageCount();
                Logger.log('info', 'WebSocket', 'Sent: ' + message);
                return true;
            } catch (error) {
                Logger.log('error', 'WebSocket', 'Send failed: ' + error.message);
                return false;
            }
        } else {
            Logger.log('warning', 'WebSocket', 'Cannot send message - not connected');
            Toast.show('Not connected to server', 'warning');
            return false;
        }
    }

    /**
     * Handle WebSocket open event
     */
    onOpen(event) {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.connectionStartTime = Date.now();
        
        this.updateConnectionStatus('connected', 'Connected');
        this.startUptimeCounter();
        
        Logger.log('info', 'WebSocket', 'Connected successfully');
        Toast.show('Connected to server', 'success');
        
        // Trigger connection event
        this.emit('connected');
    }

    /**
     * Handle WebSocket message event
     */
    onMessage(event) {
        try {
            const message = event.data.toString();
            console.log('Received message:', message);
            
            this.messageCount++;
            this.updateMessageCount();
            
            // Parse and route message based on protocol
            this.routeMessage(message);
            
        } catch (error) {
            Logger.log('error', 'WebSocket', 'Message parsing failed: ' + error.message);
        }
    }

    /**
     * Route incoming messages based on protocol
     */
    routeMessage(message) {
        const parts = message.split(' ');
        const command = parts[0];
        const payload = parts.slice(1).join(' ');
        
        Logger.log('info', 'WebSocket', 'Received: ' + message);
        
        switch (command) {
            case 'ASSIGN_ID':
                this.handleClientIdAssignment(payload);
                break;
                
            case 'COORDINATOR':
                this.handleCoordinatorUpdate(payload);
                break;
                
            case 'FILE':
                this.handleFileContent(payload);
                break;
                
            case 'FILES':
                this.handleFileListResponse(payload);
                break;
                
            case 'OK':
                this.handleOperationSuccess(payload);
                break;
                
            case 'VIEW':
                this.handleFileView(payload);
                break;
                
            case 'DEL':
                this.handleDeleteConfirmation(payload);
                break;
                
            default:
                Logger.log('warning', 'WebSocket', 'Unknown message type: ' + command);
                this.emit('message', { command, payload });
        }
    }

    /**
     * Handle client ID assignment
     */
    handleClientIdAssignment(clientIdStr) {
        this.clientId = parseInt(clientIdStr);
        this.updateClientId();
        Logger.log('info', 'Client', 'Assigned ID: ' + this.clientId);
        Toast.show('Assigned Client ID: ' + this.clientId, 'info');
        
        // Update logical clock
        LogicalClock.increment('Client ID Assignment');
        
        // Trigger election visualization
        if (window.ElectionVisualizer && typeof window.ElectionVisualizer.clientConnected === 'function') {
            window.ElectionVisualizer.clientConnected(this.clientId);
        }
        
        this.emit('clientId', this.clientId);
    }

    /**
     * Handle coordinator election updates
     */
    handleCoordinatorUpdate(message) {
        Logger.log('info', 'Election', message);
        ElectionVisualizer.updateElection(message);
        
        // Update logical clock
        LogicalClock.increment('Election Update');
        
        this.emit('coordinator', message);
    }

    /**
     * Handle file content responses
     */
    handleFileContent(content) {
        Logger.log('info', 'File', 'Received file content');
        this.emit('fileContent', content);
    }

    /**
     * Handle operation success messages
     */
    handleOperationSuccess(message) {
        Logger.log('info', 'Operation', message);
        Toast.show(message, 'success');
        
        // Update logical clock
        LogicalClock.increment('Operation Success');
        
        // Refresh file list if it was a file operation
        if (message.toLowerCase().includes('file')) {
            FileManager.refreshFileList();
        }
        
        this.emit('operationSuccess', message);
    }

    /**
     * Handle file view responses
     */
    handleFileView(content) {
        Logger.log('info', 'File', 'Received file view');
        this.emit('fileView', content);
    }

    /**
     * Handle file list responses
     */
    handleFileListResponse(jsonData) {
        try {
            console.log('Parsing file list JSON:', jsonData);
            const data = JSON.parse(jsonData);
            Logger.log('info', 'File', 'Received file list with ' + data.files.length + ' files');
            
            // Update logical clock
            LogicalClock.increment('File List Retrieved');
            
            // Update file list in FileManager
            if (window.FileManager && typeof window.FileManager.updateFileList === 'function') {
                console.log('Updating file list with data:', data.files);
                window.FileManager.updateFileList(data.files);
            }
            
            this.emit('fileList', data.files);
        } catch (error) {
            console.error('Full error details:', error);
            console.error('Error stack:', error.stack);
            console.error('JSON data that caused error:', jsonData);
            Logger.log('error', 'WebSocket', 'Failed to parse file list: ' + error.message);
            Toast.show('Failed to parse file list', 'error');
        }
    }

    /**
     * Handle delete confirmations
     */
    handleDeleteConfirmation(message) {
        Logger.log('info', 'File', 'Delete confirmed: ' + message);
        Toast.show('File deleted: ' + message, 'info');
        
        // Update logical clock
        LogicalClock.increment('File Deletion');
        
        // Refresh file list
        FileManager.refreshFileList();
        
        this.emit('deleteConfirmation', message);
    }

    /**
     * Handle WebSocket close event
     */
    onClose(event) {
        console.log('WebSocket closed:', event);
        this.isConnected = false;
        this.isConnecting = false;
        
        if (event.code === 1000) {
            // Normal closure
            this.updateConnectionStatus('disconnected', 'Disconnected');
            Logger.log('info', 'WebSocket', 'Connection closed normally');
        } else {
            // Unexpected closure
            this.updateConnectionStatus('error', 'Connection lost');
            Logger.log('error', 'WebSocket', 'Connection lost unexpectedly (Code: ' + event.code + ')');
            this.scheduleReconnect();
        }
        
        this.stopUptimeCounter();
        this.emit('disconnected', event);
    }

    /**
     * Handle WebSocket error event
     */
    onError(error) {
        console.error('WebSocket error:', error);
        this.updateConnectionStatus('error', 'Connection error');
        Logger.log('error', 'WebSocket', 'Connection error occurred');
        
        if (!this.isConnected) {
            this.scheduleReconnect();
        }
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            Logger.log('error', 'WebSocket', 'Max reconnection attempts reached');
            Toast.show('Connection failed. Please try manually.', 'error');
            return;
        }
        
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        this.reconnectAttempts++;
        
        Logger.log('info', 'WebSocket', `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    /**
     * Initialize reconnect logic
     */
    initializeReconnectLogic() {
        // Reset reconnect attempts when user manually connects
        this.on('connected', () => {
            this.reconnectAttempts = 0;
        });
    }

    /**
     * Update connection status in UI
     */
    updateConnectionStatus(status, text) {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        if (statusIndicator && statusText) {
            statusIndicator.className = `status-indicator ${status}`;
            statusText.textContent = text;
        }
        
        // Update connection controls
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        
        if (connectBtn && disconnectBtn) {
            if (status === 'connected') {
                connectBtn.disabled = true;
                disconnectBtn.disabled = false;
            } else {
                connectBtn.disabled = false;
                disconnectBtn.disabled = true;
            }
        }
    }

    /**
     * Update message count in UI
     */
    updateMessageCount() {
        const messageCountElement = document.getElementById('messageCount');
        if (messageCountElement) {
            messageCountElement.textContent = this.messageCount;
        }
    }

    /**
     * Update client ID in UI
     */
    updateClientId() {
        const clientIdElement = document.getElementById('clientId');
        if (clientIdElement) {
            clientIdElement.textContent = this.clientId || 'Not Assigned';
        }
    }

    /**
     * Start uptime counter
     */
    startUptimeCounter() {
        this.uptimeInterval = setInterval(() => {
            if (this.connectionStartTime) {
                const uptime = Date.now() - this.connectionStartTime;
                this.updateUptime(uptime);
            }
        }, 1000);
    }

    /**
     * Stop uptime counter
     */
    stopUptimeCounter() {
        if (this.uptimeInterval) {
            clearInterval(this.uptimeInterval);
            this.uptimeInterval = null;
        }
        this.updateUptime(0);
    }

    /**
     * Update uptime display
     */
    updateUptime(uptimeMs) {
        const uptimeElement = document.getElementById('uptime');
        if (uptimeElement) {
            const hours = Math.floor(uptimeMs / 3600000);
            const minutes = Math.floor((uptimeMs % 3600000) / 60000);
            const seconds = Math.floor((uptimeMs % 60000) / 1000);
            
            uptimeElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Event emitter functionality
     */
    on(event, callback) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event).push(callback);
    }

    off(event, callback) {
        if (this.messageHandlers.has(event)) {
            const handlers = this.messageHandlers.get(event);
            const index = handlers.indexOf(callback);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.messageHandlers.has(event)) {
            this.messageHandlers.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event handler:', error);
                }
            });
        }
    }

    /**
     * Get connection health status
     */
    getHealthStatus() {
        return {
            connected: this.isConnected,
            connecting: this.isConnecting,
            clientId: this.clientId,
            messageCount: this.messageCount,
            uptime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Create global instance
window.WSManager = new WebSocketManager();