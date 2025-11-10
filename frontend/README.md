# Distributed File System Frontend

A modern, real-time web frontend for distributed file system simulation built with pure HTML5, CSS3, and Vanilla JavaScript.

## Features

### 🌐 Real-time Distributed System Visualization
- **Server Cluster Monitor**: Visual representation of multiple servers (ports 2001, 2002, 2003)
- **Load Balancer Visualization**: Animated traffic distribution and algorithm display
- **Election Process Viewer**: Real-time coordinator election with step-by-step animation
- **Logical Clock Monitor**: Visual counter with operation history

### 📁 File Management System
- **Drag & Drop Upload**: Modern file upload with progress tracking
- **File Browser**: Real-time file list with search and filtering
- **File Preview**: Syntax highlighting for text files, image preview, binary file handling
- **Download Support**: Direct browser downloads using Blob API

### 🔌 WebSocket Integration
- **Real-time Communication**: WebSocket client connecting to `ws://localhost:12345`
- **Auto-reconnect Logic**: Exponential backoff reconnection strategy
- **Message Protocol Support**: Handles all backend message formats
- **Connection Health Monitoring**: Visual status indicators and statistics

### 📊 System Monitoring
- **Resource Visualization**: CPU, Memory, Network, and Storage usage charts
- **Database Status**: Primary database and backup system monitoring
- **Operation Logging**: Comprehensive activity log with filtering
- **Performance Metrics**: Real-time system resource simulation

### 🎨 Modern UI Design
- **Glassmorphism Design**: Beautiful translucent glass effects
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Smooth Animations**: CSS animations for status changes and interactions
- **Dark Theme**: Professional dark color scheme with accent colors
- **Toast Notifications**: Non-intrusive status messages

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Pure web technologies, no frameworks |
| **Styling** | CSS Flexbox/Grid, Custom CSS Variables | Responsive design and theming |
| **Communication** | WebSocket API | Real-time bidirectional communication |
| **File Handling** | File API, Blob API, FileReader API | Modern file upload/download |
| **Visualization** | Canvas API, CSS Animations | Charts and visual effects |
| **State Management** | Event-driven architecture | Component communication |

## Quick Start

### Prerequisites
- Python 3.6+ (for local HTTP server)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Backend server running on `ws://localhost:12345`

### Installation & Setup

1. **Clone or download** the project to your local machine
2. **Navigate** to the frontend directory:
   ```bash
   cd dc_mini_proj/frontend
   ```

3. **Start the frontend server**:

   **Windows:**
   ```cmd
   start-frontend.bat
   ```

   **Linux/macOS:**
   ```bash
   ./start-frontend.sh
   ```

   **Manual start:**
   ```bash
   python -m http.server 8000
   # or
   python3 -m http.server 8000
   ```

4. **Open your browser** and navigate to:
   - http://localhost:8000
   - http://127.0.0.1:8000

5. **Start your backend server** on WebSocket port 12345

6. **Click "Connect"** in the frontend to establish connection

## Project Structure

```
frontend/
├── index.html                 # Main HTML file with all components
├── start-frontend.bat         # Windows startup script
├── start-frontend.sh          # Linux/macOS startup script
├── README.md                  # This documentation file
├── styles/
│   ├── main.css              # Core styles and theme variables
│   ├── components.css        # Component-specific styles
│   └── animations.css        # Animation keyframes and classes
├── scripts/
│   ├── websocket.js          # WebSocket connection management
│   ├── fileOperations.js     # File upload/download handling
│   ├── visualization.js      # System visualization components
│   ├── ui.js                 # UI utilities and components
│   └── app.js                # Main application controller
└── assets/                   # (Optional) Static assets
```

## Backend Integration

The frontend expects a WebSocket server on `ws://localhost:12345` that supports these message formats:

### Incoming Messages (from Backend)
```javascript
"ASSIGN_ID {number}"     // Client ID assignment
"COORDINATOR {message}"  // Election updates
"FILE {content}"         // File content responses (base64)
"OK {message}"          // Operation success confirmation
"VIEW {content}"        // File view responses (base64)
"DEL {message}"         // Delete confirmations
```

### Outgoing Messages (to Backend)
```javascript
"UPLOAD {filename} {base64_content}"  // Upload file
"DOWNLOAD {filename}"                 // Request file download
"VIEW {filename}"                     // Request file preview
"DELETE {filename}"                   // Delete file
"LIST"                               // Request file list
```

## Component Overview

### 🔌 Connection Management
- WebSocket connection controls
- Status indicators (Connected/Connecting/Disconnected)
- Auto-reconnect with exponential backoff
- Connection statistics (uptime, message count, client ID)

### 🖥️ Server Cluster Monitor
- Visual representation of 3 servers (ports 2001, 2002, 2003)
- Real-time status indicators (online/offline)
- Connection count and load percentage per server
- Traffic animation effects

### ⚖️ Load Balancer Visualization
- Algorithm display (Round Robin, Least Connections, Random)
- Animated traffic lines to servers
- Real-time connection distribution chart
- Traffic flow animations

### 🗳️ Election Dashboard
- Current coordinator display
- Election status (Idle/Active/Completed)
- Step-by-step election process visualization
- Logical clock with operation history

### 📁 File Operations
- **Upload Area**: Drag & drop with visual feedback
- **File Manager**: List view with search functionality
- **File Actions**: View, Download, Delete operations
- **Preview Modal**: Syntax highlighting and image preview

### 💾 Database & System Monitor
- Primary database connection status
- Backup system with progress indicators
- Resource usage charts (CPU, Memory, Network, Storage)
- Real-time metrics with color-coded warnings

### 📜 Operation Log
- Chronological activity log
- Filterable by log level (Info, Warning, Error)
- Export functionality
- Real-time updates with smooth animations

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full Support |
| Firefox | 88+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 90+ | ✅ Full Support |

### Required Browser Features
- WebSocket API
- File API (FileReader, Blob)
- ES6+ JavaScript
- CSS Grid and Flexbox
- CSS Custom Properties

## Customization

### Theming
The application uses CSS custom properties for easy theming. Modify variables in `styles/main.css`:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --glass-bg: rgba(255, 255, 255, 0.1);
  --text-primary: #ffffff;
  /* ... more variables */
}
```

### WebSocket Configuration
Change the WebSocket URL in `scripts/websocket.js`:

```javascript
constructor() {
    this.url = 'ws://localhost:12345'; // Change this URL
    // ... rest of constructor
}
```

### Component Configuration
Each component can be configured through their respective classes:

```javascript
// File size limit
FileOperationsManager.maxFileSize = 50 * 1024 * 1024; // 50MB

// Reconnection attempts
WebSocketManager.maxReconnectAttempts = 10;

// Log retention
LoggerSystem.maxLogs = 500;
```

## Performance Considerations

- **Memory Usage**: Log entries are limited to prevent memory leaks
- **Animation Performance**: CSS animations with hardware acceleration
- **File Handling**: Streaming support for large files
- **Auto-cleanup**: Automatic cleanup of event listeners and intervals

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure backend server is running on port 12345
   - Check WebSocket URL configuration
   - Verify firewall settings

2. **Files Not Uploading**
   - Check file size limits
   - Verify WebSocket connection
   - Check browser console for errors

3. **UI Not Loading**
   - Ensure all CSS/JS files are accessible
   - Check browser developer tools for 404 errors
   - Try hard refresh (Ctrl+F5)

4. **Performance Issues**
   - Disable browser extensions
   - Check available system memory
   - Use latest browser version

### Debug Mode
Open browser developer console and check the `window` object for debug utilities:

```javascript
// Application status
window.DistributedFS.getApplicationStatus();

// WebSocket health
window.WSManager.getHealthStatus();

// Export application state
window.DistributedFS.exportState();

// Manual component access
window.FileManager.refreshFileList();
window.LogicalClock.increment('Debug Test');
```

## Development

### Local Development
1. Make changes to HTML, CSS, or JS files
2. Refresh browser (files are served statically)
3. Use browser developer tools for debugging

### Adding Features
1. Create component in appropriate script file
2. Add corresponding styles to CSS files
3. Update main application controller
4. Test across different browsers

### Code Style
- Use modern JavaScript (ES6+)
- Follow consistent naming conventions
- Comment complex functionality
- Maintain separation of concerns

## Security Notes

- All user inputs are properly escaped to prevent XSS
- File uploads are validated on client-side
- WebSocket messages are sanitized
- No external dependencies to minimize attack surface

## License

This project is part of a distributed systems educational simulation. Use for learning and demonstration purposes.

## Support

For issues related to the frontend:
1. Check browser console for errors
2. Verify all files are properly served
3. Test with different browsers
4. Check network connectivity

For backend integration issues, refer to your backend server documentation.

---

**Built with ❤️ for distributed systems education**