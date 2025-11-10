@echo off
title Distributed File System - Frontend Server

echo.
echo ==========================================
echo  Distributed File System Frontend
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.6 or higher
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Python detected successfully!
echo.

REM Navigate to frontend directory
cd /d "%~dp0"

REM Check if we're in the frontend directory
if not exist "index.html" (
    echo ERROR: index.html not found in current directory
    echo Please ensure this script is in the frontend folder
    pause
    exit /b 1
)

echo Starting HTTP server on http://localhost:8000
echo.
echo Frontend will be available at:
echo   http://localhost:8000
echo   http://127.0.0.1:8000
echo.
echo IMPORTANT NOTES:
echo - Make sure your backend server is running on ws://localhost:12345
echo - This frontend connects to WebSocket at ws://localhost:12345
echo - Keep this window open while using the application
echo.
echo Press Ctrl+C to stop the server
echo ==========================================
echo.

REM Start Python HTTP server
python -m http.server 8000

pause