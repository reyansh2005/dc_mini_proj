# Distributed File System - Complete Setup Guide

## ❌ SQLite JDBC Driver Issue - SOLVED

**Problem:** When running `java Server 2001`, you get:
```
java.lang.ClassNotFoundException: org.sqlite.JDBC
```

**Root Cause:** The original Server.java requires SQLite JDBC driver which isn't included by default.

## ✅ Solutions Available

### Option 1: ServerSimple (Recommended - Zero Dependencies)

I've created `ServerSimple.java` that works without SQLite using in-memory storage.

**Advantages:**
- ✅ No external dependencies required
- ✅ Fast startup and operation  
- ✅ Perfect for testing and development
- ✅ Files shared across all server instances
- ✅ Ideal for educational/simulation purposes

**Usage:**
```bash
# Compile once
javac ServerSimple.java

# Run multiple servers
java ServerSimple 2001
java ServerSimple 2002
java ServerSimple 2003
```

### Option 2: Original Server with SQLite (Advanced)

If you need database persistence:

1. **Auto-download SQLite driver:**
   ```bash
   cd backend
   download_sqlite.bat
   ```

2. **Manual download:** Get sqlite-jdbc-3.44.1.0.jar from Maven Central

3. **Run with classpath:**
   ```bash
   java -cp ".;sqlite-jdbc-3.44.1.0.jar" Server 2001
   ```

## 🚀 Super Quick Start

### One-Click Launch
```bash
# This starts EVERYTHING automatically
start_complete_system.bat
```

**What this does:**
1. ✅ Starts 3 ServerSimple instances (2001, 2002, 2003)
2. ✅ Starts LoadBalancer (WebSocket: 12345, TCP: 12346)
3. ✅ Starts Frontend server (port 8000)
4. ✅ Opens browser to main app + test page

### Manual Launch (Step by Step)

**1. Start Backend Servers:**
```bash
cd backend
java ServerSimple 2001 &
java ServerSimple 2002 &
java ServerSimple 2003 &
```

**2. Start LoadBalancer:**
```bash
java LoadBalancer
```

**3. Start Frontend:**
```bash
cd frontend  
python -m http.server 8000
```

**4. Access Applications:**
- 📱 Main App: http://localhost:8000
- 🧪 Test Page: http://localhost:8000/../test_frontend.html

## System Requirements

- **Operating System**: Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Java**: JDK 8 or higher (for backend)
- **Python**: 3.6 or higher (for frontend HTTP server)
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Memory**: Minimum 4GB RAM recommended
- **Network**: Localhost network access (ports 2001, 2002, 2003, 12345, 8000)

## Quick Start (5 Minutes)

### Step 1: Start Backend Servers
```bash
# Navigate to project root
cd dc_mini_proj

# Start the first server
java Server 2001

# In separate terminals, start other servers
java Server 2002
java Server 2003

# Start the load balancer (in another terminal)
java LoadBalancer 12345
```

### Step 2: Start Frontend
```bash
# Navigate to frontend directory
cd frontend

# Windows
start-frontend.bat

# Linux/macOS
./start-frontend.sh
```

### Step 3: Access Application
1. Open browser to http://localhost:8000
2. Click "Connect" button in the frontend
3. Start uploading/downloading files!

## Detailed Setup Instructions

### Backend Setup

#### Prerequisites
1. **Install Java JDK**:
   - Windows: Download from [Oracle](https://www.oracle.com/java/technologies/downloads/) or use OpenJDK
   - macOS: `brew install openjdk@11` (requires Homebrew)
   - Linux: `sudo apt install openjdk-11-jdk`

2. **Verify Java Installation**:
   ```bash
   java -version
   javac -version
   ```

#### Compile Backend (if needed)
```bash
# Navigate to backend directory
cd dc_mini_proj

# Compile Java files
javac *.java

# Verify compilation
ls *.class
```

#### Start Backend Services

**Terminal 1 - Server 1:**
```bash
java Server 2001
```

**Terminal 2 - Server 2:**
```bash
java Server 2002
```

**Terminal 3 - Server 3:**
```bash
java Server 2003
```

**Terminal 4 - Load Balancer:**
```bash
java LoadBalancer 12345
```

**Expected Output for each server:**
```
Server started on port 2001
Waiting for connections...
```

**Expected Output for Load Balancer:**
```
Load Balancer started on port 12345
Connected to server on port 2001
Connected to server on port 2002
Connected to server on port 2003
WebSocket server started on port 12345
```

### Frontend Setup

#### Prerequisites
1. **Install Python**:
   - Windows: Download from [python.org](https://www.python.org/downloads/)
   - macOS: `brew install python3` (requires Homebrew) or use built-in Python
   - Linux: `sudo apt install python3`

2. **Verify Python Installation**:
   ```bash
   python --version
   # or
   python3 --version
   ```

#### Start Frontend Server

**Option 1: Using Startup Scripts**
```bash
# Windows
cd frontend
start-frontend.bat

# Linux/macOS
cd frontend
./start-frontend.sh
```

**Option 2: Manual Start**
```bash
cd frontend
python -m http.server 8000
# or
python3 -m http.server 8000
```

#### Access Frontend
1. Open web browser
2. Navigate to: http://localhost:8000
3. You should see the Distributed File System interface

### Verification Steps

#### 1. Backend Verification
Check that all services are running:
```bash
# Check if servers are listening on ports
netstat -an | grep 2001
netstat -an | grep 2002  
netstat -an | grep 2003
netstat -an | grep 12345
```

#### 2. Frontend Verification
1. Frontend loads correctly in browser
2. No JavaScript errors in browser console (F12)
3. All UI components are visible

#### 3. Integration Verification
1. Click "Connect" in frontend
2. Status should change to "Connected"
3. Client ID should be assigned
4. Server cluster should show online status

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Load Balancer  │    │   Server 2001   │
│                 │    │   (port 12345)   │    │                 │
│   Frontend      ├────┤   WebSocket      ├────┤   File Storage  │
│   (port 8000)   │    │   Server         │    │                 │
└─────────────────┘    │                  │    └─────────────────┘
                       │                  │    
                       │                  │    ┌─────────────────┐
                       │                  ├────┤   Server 2002   │
                       │                  │    │   File Storage  │
                       │                  │    └─────────────────┘
                       │                  │    
                       │                  │    ┌─────────────────┐
                       │                  ├────┤   Server 2003   │
                       └──────────────────┘    │   File Storage  │
                                               └─────────────────┘
```

## Port Configuration

| Service | Port | Purpose |
|---------|------|---------|
| Server 1 | 2001 | File storage and processing |
| Server 2 | 2002 | File storage and processing |
| Server 3 | 2003 | File storage and processing |
| Load Balancer | 12345 | WebSocket server for frontend |
| Frontend HTTP | 8000 | Static file serving |

## File System Simulation Features

### 1. File Operations
- **Upload**: Drag & drop or browse files
- **Download**: Click download button for any file
- **View**: Preview text files and images
- **Delete**: Remove files with confirmation

### 2. Distributed System Concepts
- **Load Balancing**: Requests distributed across servers
- **Replication**: Files stored on multiple servers
- **Coordinator Election**: Leader election algorithm
- **Consistency**: Logical clocks for ordering

### 3. Real-time Monitoring
- **Server Status**: Visual indication of server health
- **Traffic Flow**: Animated data flow visualization
- **System Resources**: Simulated CPU, memory, network usage
- **Operation Logs**: Detailed activity logging

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Backend Won't Start
**Problem**: Java errors or port conflicts
**Solutions**:
- Verify Java installation: `java -version`
- Check if ports are in use: `netstat -an | grep 2001`
- Kill existing processes: `taskkill /F /IM java.exe` (Windows)
- Compile Java files: `javac *.java`

#### 2. Frontend Connection Failed
**Problem**: WebSocket connection to backend fails
**Solutions**:
- Ensure LoadBalancer is running on port 12345
- Check browser console for WebSocket errors
- Verify firewall isn't blocking connections
- Try different browser or disable extensions

#### 3. File Upload Not Working
**Problem**: Files don't upload successfully
**Solutions**:
- Check WebSocket connection status
- Verify file size limits (default 10MB)
- Ensure servers have write permissions
- Check browser console for JavaScript errors

#### 4. UI Components Not Loading
**Problem**: Frontend interface appears broken
**Solutions**:
- Hard refresh browser (Ctrl+F5)
- Check that all CSS/JS files are loading
- Verify Python HTTP server is running
- Try incognito/private browsing mode

### Debug Commands

#### Backend Debugging
```bash
# Check server processes
ps aux | grep java          # Linux/macOS
tasklist | findstr java     # Windows

# Monitor port usage
ss -tulpn | grep :2001      # Linux
netstat -an | grep 2001     # Windows/macOS

# View server logs
tail -f server.log          # If logging to file
```

#### Frontend Debugging
```bash
# Check HTTP server
curl http://localhost:8000
wget http://localhost:8000  # Linux

# Test WebSocket connection
wscat -c ws://localhost:12345   # Requires wscat tool
```

#### Browser Debugging
1. Open Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed requests
4. Use Application tab to inspect WebSocket connections

### Performance Optimization

#### Backend Performance
- Increase Java heap size: `java -Xmx1G Server 2001`
- Monitor garbage collection: `java -XX:+PrintGC Server 2001`
- Use multiple CPU cores for concurrent connections

#### Frontend Performance
- Enable browser caching
- Use hardware acceleration for animations
- Monitor memory usage in browser dev tools
- Disable unnecessary browser extensions

## Development and Extension

### Adding New Features

#### Backend Extensions
1. Modify server classes to add new functionality
2. Update LoadBalancer to handle new message types
3. Test with multiple clients
4. Update protocol documentation

#### Frontend Extensions
1. Add new UI components in HTML
2. Create corresponding CSS styles
3. Implement JavaScript functionality
4. Update WebSocket message handling

### Code Structure
```
dc_mini_proj/
├── backend/               # Java backend files
│   ├── Server.java        # Individual server implementation
│   ├── LoadBalancer.java  # Load balancer and WebSocket server
│   ├── Client.java        # Client implementation
│   └── shared.db          # Database file
├── frontend/              # Web frontend
│   ├── index.html         # Main HTML file
│   ├── styles/            # CSS stylesheets
│   ├── scripts/           # JavaScript files
│   └── start-frontend.*   # Startup scripts
└── documentation/         # Project documentation
```

## Advanced Configuration

### Custom Port Configuration
To use different ports, update these files:

**Backend (LoadBalancer.java)**:
```java
private static final int WEBSOCKET_PORT = 12345; // Change this
```

**Frontend (websocket.js)**:
```javascript
this.url = 'ws://localhost:12345'; // Change this
```

### Security Considerations
- Run on localhost only (not exposed to internet)
- File upload size limits in place
- Input validation and sanitization
- No external dependencies to minimize attack surface

### Scaling Options
- Add more server instances (ports 2004, 2005, etc.)
- Implement database sharding
- Add caching layer
- Load testing with multiple concurrent clients

## Production Deployment Notes

This is an educational simulation and is **NOT** intended for production use. For production deployment, consider:

- Proper authentication and authorization
- HTTPS/WSS encryption
- Database optimization and backup strategies
- Monitoring and alerting systems
- Error handling and recovery mechanisms
- Load testing and performance optimization

## Support and Resources

### Documentation
- README.md files in each directory
- Inline code comments
- Browser developer tools

### Learning Resources
- Distributed systems concepts
- WebSocket protocol specification
- Modern web development practices
- Java networking and file I/O

### Getting Help
1. Check browser console for errors
2. Verify all services are running
3. Review log output from servers
4. Test with minimal configuration first

---

**Happy distributed computing! 🚀**