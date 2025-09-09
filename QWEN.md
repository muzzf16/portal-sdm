# Sistem Manajemen SDM (Human Resource Management System)

## Project Overview

This is a comprehensive Human Resource Management System (HRMS) built as a monorepo with separate frontend and backend components. The system provides functionality for managing employees, leave requests, payroll, performance reviews, and attendance.

### Technologies Used

**Frontend:**
- React (v19)
- TypeScript
- Vite
- React Router v7
- Tailwind CSS
- Recharts for data visualization

**Backend:**
- Node.js with Express
- SQLite database
- bcrypt for password hashing
- JSON Web Tokens for authentication

## Project Structure

```
portal-sdm/
├── backend/              # Express server and database
│   ├── uploads/          # File upload storage
│   ├── database.sqlite   # SQLite database file
│   ├── db.json           # Database seed file
│   ├── server.js         # Main server file
│   ├── package.json      # Backend dependencies
├── frontend/             # React frontend application
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── services/         # API service functions
│   ├── App.tsx           # Main app component
│   ├── index.html        # HTML entry point
│   ├── index.tsx         # React entry point
│   ├── constants.tsx     # Application constants
│   ├── types.ts          # TypeScript type definitions
│   ├── vite.config.ts    # Vite configuration
│   ├── package.json      # Frontend dependencies
├── package.json          # Root package.json (workspaces)
├── README.md             # Project documentation
```

## Building and Running

### Prerequisites
- Node.js (version not specified, but compatible with current LTS)

### Installation
1. Install dependencies from the root directory:
   ```bash
   npm install
   ```

### Running the Application
1. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key
2. Run the development server:
   ```bash
   npm run dev
   ```

This will start both the backend server (on port 2025) and the frontend development server (on port 5173).

### Backend Scripts
- `npm start` - Run the backend server using Node.js

### Frontend Scripts
- `npm run dev` - Start the development server with Vite
- `npm run build` - Build the production-ready frontend
- `npm run preview` - Preview the built application

## API Endpoints

The backend server provides the following API endpoints:

### Authentication
- `POST /api/auth/login` - User login with email and password
- `POST /api/register` - Register a new employee user

### Employee Management
- `GET /api/data` - Get all data from all tables
- `POST /api/employees` - Create a new employee
- `PUT /api/employees/:id` - Update an existing employee
- `GET /api/employees/:id/leave-summary` - Get leave summary for an employee

### Leave Management
- `GET /api/leave-requests` - Get all leave requests
- `POST /api/leave-requests` - Create a new leave request
- `PUT /api/leave-requests/:id` - Update leave request status

### Attendance
- `POST /api/attendance/clock-in` - Clock in for the day
- `POST /api/attendance/clock-out` - Clock out for the day
- `POST /api/attendance/bulk` - Upload bulk attendance records

### Performance Reviews
- `POST /api/performance-reviews` - Create a new performance review
- `PUT /api/performance-reviews/:id/feedback` - Add employee feedback to a review

### Payroll
- `PUT /api/employees/:id/payroll-info` - Update employee payroll information

### Data Change Requests
- `GET /api/data-change-requests/pending` - Get pending data change requests
- `POST /api/data-change-requests` - Create a new data change request
- `PUT /api/data-change-requests/:id` - Update data change request status

### Miscellaneous
- `POST /api/misc/:type` - Handle miscellaneous requests

## Development Conventions

### Frontend
- Uses React with TypeScript and functional components
- Implements React Context for state management
- Uses React Router for navigation
- Follows a component-based architecture with reusable UI components
- Uses Tailwind CSS for styling
- Implements custom hooks for reusable logic

### Backend
- Uses Express.js for the web server
- SQLite as the database with sqlite3 package
- Implements RESTful API design principles
- Uses bcrypt for password hashing
- Implements database transactions for data consistency
- Uses middleware for CORS and JSON parsing
- Implements file upload functionality with Multer

### Database
- Uses SQLite for data storage
- Implements database seeding from a JSON file on first run
- Uses database transactions for operations that modify multiple tables
- Stores complex data structures as JSON strings in the database

### Security
- Passwords are hashed using bcrypt
- Implements CORS for cross-origin requests
- Validates and sanitizes user inputs
- Implements file type validation for uploads

## Additional Notes

1. The application uses a monorepo structure with npm workspaces
2. The frontend is a Single Page Application (SPA) using React Router
3. The backend serves the frontend static files and provides API endpoints
4. File uploads are stored in the `backend/uploads` directory
5. The application implements a role-based access control system with ADMIN and EMPLOYEE roles
6. Attendance tracking includes clock-in and clock-out functionality
7. The system supports performance reviews with KPI tracking
8. Payroll management includes base salary and additional income/deduction components
9. Leave management includes different leave types and supporting document uploads