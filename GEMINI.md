# GEMINI.md

## Project Overview

This is a comprehensive Human Resource Management System (HRMS) designed to manage employees, leave, payroll, and performance. It is a full-stack application built with a monorepo structure, featuring a React frontend and a Node.js/Express backend.

**Key Technologies:**

*   **Frontend:** React, TypeScript, Vite, React Router, Recharts
*   **Backend:** Node.js, Express.js, SQLite, bcrypt, jsonwebtoken
*   **Database:** SQLite

**Architecture:**

The project is a monorepo with two main workspaces: `frontend` and `backend`.

*   The `frontend` is a single-page application (SPA) built with React and Vite. It provides the user interface for interacting with the HRMS.
*   The `backend` is a RESTful API built with Node.js and Express.js. It handles all business logic and data persistence, interacting with a SQLite database.

The backend serves the frontend files, making it a self-contained application.

## Building and Running

**Prerequisites:**

*   Node.js

**Installation:**

1.  Install dependencies from the root directory:
    ```bash
    npm install
    ```

**Running the Application:**

1.  Start the backend server:
    ```bash
    npm run start --workspace=backend
    ```
2.  Start the frontend development server:
    ```bash
    npm run dev --workspace=frontend
    ```

The application will be accessible at `http://localhost:5173` (the default Vite port). The backend server runs on port 3000.

**Testing:**

There are no explicit test scripts defined in the project.

## Development Conventions

**Backend:**

*   The main server file is `backend/server.js`.
*   The server uses a SQLite database, with the database file located at `backend/database.sqlite`.
*   The database is seeded with initial data from `backend/db.json` if it's empty.
*   The API is versioned through its routes (e.g., `/api/...`).
*   Authentication is handled using JWT (JSON Web Tokens).

**Frontend:**

*   The main application component is `frontend/App.tsx`.
*   The frontend uses `React Router` for navigation.
*   The application is structured with pages, components, context, hooks, and services.
*   Authentication is managed through an `AuthContext`.
*   The user's role (`ADMIN` or `EMPLOYEE`) determines the rendered view.
*   The frontend communicates with the backend API to fetch and manipulate data.
