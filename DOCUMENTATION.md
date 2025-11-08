# Cloud Vault - Project Documentation

## Overview
Cloud Vault is a distributed file storage and management system with a React-based frontend and a Java-based backend. The system implements a client-server architecture with load balancing capabilities.

## Frontend Documentation

### Tech Stack
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: Custom UI components using Radix UI primitives
- **State Management**: React Query
- **Routing**: React Router
- **Styling**: Tailwind CSS

### Project Structure
```
cloud-vault-frontend-main/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components
│   │   ├── Navbar.tsx
│   │   ├── FileEditor.tsx
│   │   └── DashboardLayout.tsx
│   ├── pages/            # Application pages
│   │   ├── Login.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── UserDashboard.tsx
│   │   └── NotFound.tsx
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── App.tsx           # Main application component
```

### Key Components

1. **App.tsx**
   - Main application component
   - Handles routing configuration
   - Integrates React Query for data fetching
   - Provides Toast notifications

2. **DashboardLayout**
   - Common layout for dashboard pages
   - Includes navigation and common UI elements

3. **FileEditor**
   - Component for editing and managing files
   - Handles file operations

4. **Pages**
   - `Login.tsx`: User authentication
   - `AdminDashboard.tsx`: Admin control panel
   - `UserDashboard.tsx`: User file management interface
   - `NotFound.tsx`: 404 error page

## Backend Documentation

### Tech Stack
- **Language**: Java
- **Database**: SQLite
- **Architecture**: Distributed Client-Server
- **Features**: Load Balancing, Election Algorithm

### Components

1. **Server Class**
   - Main server implementation
   - Handles client connections
   - Manages distributed coordination
   - Features:
     - Client management using ConcurrentHashMap
     - Coordinator election mechanism
     - SQLite database integration
     - Multi-threaded client handling

2. **LoadBalancer Class**
   - Distributes client requests across servers
   - Implements load balancing algorithms
   - Maintains server health checks

3. **Client Class**
   - Client-side implementation
   - Handles communication with servers
   - Manages file operations

### Database Schema

```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    content TEXT
)
```

### Key Features

1. **Distributed Coordination**
   - Coordinator election mechanism
   - Logical clock synchronization
   - Concurrent client handling

2. **Data Management**
   - Document storage and retrieval
   - File synchronization
   - Data consistency maintenance

3. **Security**
   - User authentication
   - Access control
   - Secure file operations

## API Endpoints

The backend server exposes the following endpoints (implemented through socket communication):

1. **Document Operations**
   - Create document
   - Read document
   - Update document
   - Delete document

2. **User Management**
   - User authentication
   - Session management
   - Access control

## Setup and Installation

### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Backend
```bash
# Compile Java files
javac Server.java LoadBalancer.java Client.java

# Run server
java Server <port>

# Run load balancer
java LoadBalancer <port>

# Run client
java Client <server-host> <port>
```

## System Requirements
- Node.js 16+ for frontend
- Java 11+ for backend
- SQLite database
- Modern web browser

## Best Practices and Guidelines
1. Always maintain proper error handling
2. Follow the established coding style
3. Update documentation when making changes
4. Write tests for new features
5. Follow security best practices

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes
4. Submit a pull request

## Troubleshooting
- Check server logs for backend issues
- Verify database connectivity
- Ensure proper network configuration
- Check browser console for frontend errors