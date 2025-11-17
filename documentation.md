# BAMS Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Blockchain Integration](#blockchain-integration)
5. [Deployment Guide](#deployment-guide)

## System Architecture

### Frontend
- Built with vanilla JavaScript and Three.js for 3D visualization
- Responsive design for desktop and tablet devices
- Real-time updates using WebSocket

### Backend
- RESTful API built with Node.js and Express
- JWT-based authentication
- File-based storage system (can be extended to use a database)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - User logout

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create new attendance record
- `GET /api/attendance/:id` - Get specific attendance record

## Data Models

### User
```typescript
{
  id: string;
  username: string;
  password: string; // hashed
  role: 'admin' | 'teacher' | 'student';
  name: string;
  email: string;
  createdAt: Date;
}
```

### Attendance
```typescript
{
  id: string;
  studentId: string;
  classId: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
  verified: boolean;
  transactionHash?: string; // Blockchain transaction hash
}
```

## Blockchain Integration

The system uses blockchain to store attendance hashes for verification:
1. When attendance is marked, data is hashed and stored on-chain
2. Each record includes a timestamp and verifier's signature
3. The frontend can verify any record's integrity using the blockchain

## Deployment Guide

### Prerequisites
- Node.js 16+
- npm 8+
- Git

### Steps
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (create `.env` file)
4. Start the development server: `npm run dev`
5. For production: `npm run build` followed by `npm start`
