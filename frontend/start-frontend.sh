#!/bin/bash

# Distributed File System Frontend Startup Script
echo "=========================================="
echo " Distributed File System Frontend"
echo "=========================================="
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "ERROR: Python is not installed or not in PATH"
    echo "Please install Python 3.6 or higher"
    echo "On Ubuntu/Debian: sudo apt install python3"
    echo "On macOS: brew install python3 (requires Homebrew)"
    exit 1
fi

# Determine Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

echo "$PYTHON_CMD detected successfully!"
echo

# Navigate to script directory
cd "$(dirname "$0")"

# Check if we're in the frontend directory
if [ ! -f "index.html" ]; then
    echo "ERROR: index.html not found in current directory"
    echo "Please ensure this script is in the frontend folder"
    exit 1
fi

echo "Starting HTTP server on http://localhost:8000"
echo
echo "Frontend will be available at:"
echo "  http://localhost:8000"
echo "  http://127.0.0.1:8000"
echo
echo "IMPORTANT NOTES:"
echo "- Make sure your backend server is running on ws://localhost:12345"
echo "- This frontend connects to WebSocket at ws://localhost:12345"
echo "- Keep this terminal open while using the application"
echo
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo

# Start Python HTTP server
$PYTHON_CMD -m http.server 8000