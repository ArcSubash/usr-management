# MERN User Management System

A full-stack **User Management System** built using the **MERN stack
(MongoDB, Express, React, Node.js)** with **JWT authentication and
role-based access control**.

This project allows administrators to manage users securely through a
dashboard.

------------------------------------------------------------------------
# Live Deployment

I have also deployed the project online, using render and vercel, with some tweeks in the code. I have hosted Frontend and Backend in Render, and OTP sending service in Vercel, and connnected it using API.

NOTE: Due to some technical issues, currently the OTP is not sending while registering. so use the Test User Credentials to login as a user
        Email: subash110607@gmail.com
        password: subash11
This issue happens only in the deployment(live), But works fine in the localhost. 

Frontend (Render):
https://usr-mng.onrender.com  ---> Site Link

Backend API (Render):
https://usr-mng-bknd.onrender.com

------------------------------------------------------------------------

# Default Admin Account

When the backend starts for the first time, a **default admin account**
is automatically created.

Admin credentials:

    Email: admin@test.com
    Password: admin123
    
Test User credentials:

    Email: subash110607@gmail.com
    Password: subash11
------------------------------------------------------------------------

# FIRSTLY MODIFY THE `.env.example` file's content with your mongodb connection string and other details and rename it to `.env`
------------------------------------------------------------------------
# Mongo DB Setup

1. Create a MongoDB Atlas account and create a new cluster.
2. Get the connection string from the cluster. **Don't use the SRV connection string**.
3. Then go to **Network Access -> IP Access List**.
4. Add your IP address to the IP Access List, or better add 0.0.0.0/0 to allow all IP addresses.
5. Replace the connection string in the `.env` file.

------------------------------------------------------------------------

# Application Deployment Workflow

1. Clone the repository from GitHub.

2. Configure environment variables by modifying the `.env.example` file's content  with your MongoDB connection string and other details and rename it to `.env`.

3. Install backend dependencies and start the backend server.

4. Install frontend dependencies and start the frontend development server.

5. The frontend communicates with the backend REST API using Axios.

6. The backend connects to MongoDB Atlas for data storage.

7. After the server starts, a default admin account is automatically created.

8. The administrator can log in and manage users through the dashboard.

------------------------------------------------------------------------
# System Architecture

The application follows a **three-tier architecture** consisting of the frontend, backend, and database layers.

## Frontend Layer
The frontend is built using **React with Vite**.

Responsibilities:
- Provides the user interface
- Handles login and dashboard views
- Sends API requests to the backend using Axios

## Backend Layer
The backend is built using **Node.js and Express.js**.

Responsibilities:
- Provides REST API endpoints
- Handles authentication and authorization
- Implements business logic for user management
- Validates requests and protects routes using JWT middleware

## Database Layer
The system uses **MongoDB Atlas** as the database.

Responsibilities:
- Stores user account information
- Stores OTP verification data
- Stores hashed passwords

The backend interacts with MongoDB using **Mongoose ODM**.

## Authentication Flow

1. User logs in using email and password.
2. Backend verifies the credentials.
3. A **JWT token** is generated and returned to the client.
4. The client stores the token and sends it with protected requests.
5. The backend middleware verifies the token before granting access to protected routes.

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
-   Handle support tickets via mail
-   Edit user's details
-   Deactivate a user, and more

Users can:

-   View their profile
-   Change their password
-   View their activities
-   View their notifications
-   Create a support ticket
-   View their support tickets
-   View their support ticket status


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

    user-management
    │
    ├ backend
    │   ├ models
    │   │   └ User.js
    │   |   └ OTP.js
    │   |   └ SupportTicket.js
    │   │   └ Activity.js
    │   |   └ Notification.js
    │   │
    │   ├ routes
    │   │   ├ auth.js
    │   │   └ users.js
    │   |   └ support.js
    │   |   └ activity.js
    │   |   └ notification.js   
    │   │
    │   ├ middleware
    │   │   └ auth.js
    │   │
    │   ├ utils
    │   │   └ sendEmail.js
    │   │
    │   ├ seedAdmin.js
    │   ├ server.js
    │   ├ dropNotifIndex.js
    │   └ package.json
    │
    ├ frontend
    │   ├ src
    │   ├ api.js
    │   ├ vite.config.js
    │   └ package.json
    │
    └ README.md

------------------------------------------------------------------------

# Setup Instructions

## 1. Clone the repository

    git clone https://github.com/ArcSubash/usr-management.git
    cd usr-management

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

    SMTP_USER=your_gmail_address@gmail.com
    SMTP_PASS=your_gmail_16_digit_app_password(with no space)

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
-   OTP verification is used for user registration 

------------------------------------------------------------------------



# Author

**Subash B**
