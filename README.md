# MERN User Management System

A full-stack **User Management System** built using the **MERN stack
(MongoDB, Express, React, Node.js)** with **JWT authentication and
role-based access control**.

This project allows administrators to manage users securely through a
dashboard.

------------------------------------------------------------------------

# Demo Workflow

1.  Start backend
2.  Start frontend
3.  Login using default admin
4.  Open dashboard
5.  Create or delete users

------------------------------------------------------------------------

# Features

## Authentication

-   User registration via OTP
-   Secure login using JWT
-   Password hashing using bcrypt

## Role-Based Access Control

-   Admin users can manage users
-   Normal users have restricted access

## User Management

Admin can:

-   View all users
-   Create users
-   Create other admins
-   Delete users

## Security

-   Passwords are hashed using bcrypt
-   Protected routes using JWT middleware
-   Admin-only routes enforced on the backend

------------------------------------------------------------------------

# Tech Stack

## Frontend

-   React
-   Vite
-   Axios

## Backend

-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   JWT Authentication
-   bcrypt

------------------------------------------------------------------------

# Project Structure

    project
    │
    ├ backend
    │   ├ models
    │   │   └ User.js
    │   │
    │   ├ routes
    │   │   ├ auth.js
    │   │   └ users.js
    │   │
    │   ├ middleware
    │   │   └ auth.js
    │   │
    │   ├ seedAdmin.js
    │   ├ server.js
    │   └ package.json
    │
    ├ frontend
    │   ├ src
    │   ├ api.js
    │   └ vite.config.js
    │
    └ README.md

------------------------------------------------------------------------

# Setup Instructions

## 1. Clone the repository

    git clone <your-repository-url>
    cd project

------------------------------------------------------------------------

# Backend Setup

Navigate to backend folder:

    cd backend

Install dependencies:

    npm install

Create `.env` file:

    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    ADMIN_EMAIL=admin@test.com
    ADMIN_PASSWORD=admin123

Start backend server:

    npm run dev

Backend runs at:

    http://localhost:5000

------------------------------------------------------------------------

# Frontend Setup

Navigate to frontend folder:

    cd frontend

Install dependencies:

    npm install

Start frontend:

    npm run dev

Frontend runs at:

    http://localhost:5173

------------------------------------------------------------------------

# Default Admin Account

When the backend starts for the first time, a **default admin account**
is automatically created.

Use the following credentials:

    Email: admin@test.com
    Password: admin123

------------------------------------------------------------------------

# API Endpoints

## Authentication

### Register User

    POST /api/auth/register

Creates a normal user account.

Example body:

``` json
{
  "name": "John",
  "email": "john@test.com",
  "password": "123456"
}
```

------------------------------------------------------------------------

### Login

    POST /api/auth/login

Returns JWT token.

Example body:

``` json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

------------------------------------------------------------------------

# Users (Admin Only)

### Get all users

    GET /api/users

Requires JWT token.

------------------------------------------------------------------------

### Create user

    POST /api/users

Admin can create normal users or admins.

Example:

``` json
{
  "name": "New Admin",
  "email": "newadmin@test.com",
  "password": "admin123",
  "role": "admin"
}
```

------------------------------------------------------------------------

### Delete user

    DELETE /api/users/:id

Deletes a user.

------------------------------------------------------------------------

# Security Notes

-   Passwords are hashed using **bcrypt**
-   JWT is used for authentication
-   Admin-only routes are protected using middleware
-   `/register` cannot create admin users directly

------------------------------------------------------------------------



# Author

**Subash B**
