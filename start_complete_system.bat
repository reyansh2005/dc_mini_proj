@echo off
echo Starting Distributed File System with ServerSimple (No SQLite Required)
echo ==================================================================

echo.
echo 1. Starting Backend Servers (In-Memory Mode)...
cd /d c:\Users\vishv\dc_mini_proj\backend

echo    - Starting Server 1 on port 2001...
start "Server-2001" cmd /k "java ServerSimple 2001"

echo    - Starting Server 2 on port 2002...
start "Server-2002" cmd /k "java ServerSimple 2002"

echo    - Starting Server 3 on port 2003...
start "Server-2003" cmd /k "java ServerSimple 2003"

echo.
echo 2. Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo.
echo 3. Starting LoadBalancer...
start "LoadBalancer" cmd /k "java LoadBalancer"

echo.
echo 4. Waiting for LoadBalancer to start...
timeout /t 3 /nobreak >nul

echo.
echo 5. Starting Frontend HTTP Server...
cd /d c:\Users\vishv\dc_mini_proj\frontend
start "Frontend" cmd /k "python -m http.server 8000"

echo.
echo 6. Waiting for frontend server...
timeout /t 3 /nobreak >nul

echo.
echo 7. Opening applications...
start http://localhost:8000
timeout /t 2 /nobreak >nul
start http://localhost:8000/../test_frontend.html

echo.
echo ==================================================================
echo 🚀 Distributed File System is now running!
echo.
echo 📱 Main Application:    http://localhost:8000
echo 🧪 Test Page:          http://localhost:8000/../test_frontend.html
echo 🔌 WebSocket:          ws://localhost:12345
echo 🖥️  Backend Servers:    2001, 2002, 2003 (In-Memory Mode)
echo 📊 LoadBalancer:       TCP: 12346, WebSocket: 12345
echo.
echo 💡 All servers use in-memory storage (no SQLite required)
echo 💡 Files are shared across all servers in memory
echo 💡 Upload a file and it will be available on all servers
echo.
echo Press any key to stop all servers and exit...
pause >nul

echo.
echo Stopping all servers...
taskkill /f /im java.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
echo ✅ All servers stopped.