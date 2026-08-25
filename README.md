# 🚀 WavyGo ERP System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2F%20Vite-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## 📌 Project Overview

**WavyGo ERP System** is a next-generation Enterprise Resource Planning (ERP) platform built to unify all core business operations into a single modern dashboard. Designed with role-based access control for **Founders**, **Admins**, and **Employees**, the platform seamlessly integrates daily workforce operations, task and project management, attendance tracking, internal communication via **WavyGo Chat**, and intelligent automation powered by **WavyGo AI**.

Whether managing high-level organization metrics or executing daily tasks, WavyGo ERP provides an intuitive, high-performance solution tailored for fast-growing companies.

---

## 👥 Role-Based Access Control (RBAC)

The system enforces strict multi-role permission levels across all modules:

| Feature / Module | 👑 Founder | 🛡️ Admin | 👤 Employee |
| :--- | :---: | :---: | :---: |
| **Executive Overview & Revenue Analytics** | ✅ Full Access | ❌ Restricted | ❌ Restricted |
| **Organization Settings & Governance** | ✅ Full Access | ⚙️ Config Only | ❌ Restricted |
| **User & Employee Management** | ✅ Full Access | ✅ Provision / Edit | 👁️ View Directory |
| **Task Allocation & Management** | ✅ Full Access | ✅ Create & Assign | 📝 Assigned Tasks Only |
| **Attendance & Time Tracking** | ✅ View All | ✅ Manage & Approve | ⏱️ Log Personal Attendance |
| **WavyGo AI Assistant** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **WavyGo Chat / Connect** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Marketplace & Opportunity Hub** | ✅ Full Access | ✅ Full Access | 👁️ View & Apply |
| **Activity & Audit Logs** | ✅ Full Access | ✅ System Logs | ❌ Restricted |

---

## 🌟 Key Features

### 🏢 1. Operations Dashboard
- Real-time business metrics, key performance indicators (KPIs), and executive summary charts.
- Dynamic activity stream showing organization-wide actions and updates.

### 🤖 2. WavyGo AI Assistant
- Integrated AI copilot for answering company queries, generating quick reports, and assisting in task planning.
- Intelligent search across corporate data and resources.

### 💬 3. WavyGo Chat & Connect
- Direct messaging and department channels for seamless intra-company communication.
- Real-time notification system for messages, mentions, and updates.

### 📋 4. Task & Project Management
- Interactive task boards (Kanban & List views) with drag-and-drop state transitions.
- Task prioritization, deadlines, tag management, and assignee tracking.

### ⏱️ 5. Attendance & Workforce Management
- One-click employee check-in and check-out tracking.
- Automated shift duration calculations and attendance history logs.

### 🛒 6. Marketplace & Opportunity Hub
- Internal opportunity listings and project assignments.
- Integration marketplace for extending ERP features and plugins.

---

## 📁 Project Directory Structure

```text
app-1/
├── README.md                    # Project documentation & run guide
├── Procfile                     # Deployment configuration
├── design_guidelines.json       # UI/UX & design system tokens
│
├── backend/                     # FastAPI Python Backend
│   ├── main.py                  # Entry point for Uvicorn runner
│   ├── server.py                # FastAPI app initialization, middleware, routes
│   ├── db.py                    # Database connection & session setup
│   ├── models.py                # Core database models & schemas (Users, Auth, Roles)
│   ├── models_part2.py          # Extended models (Tasks, Attendance, Chat, AI)
│   ├── permissions.py           # Role-based access permission helper functions
│   ├── auth_utils.py            # Password hashing, JWT token handling
│   ├── hub_utils.py             # Helper utilities for Opportunity Hub & Marketplace
│   ├── seed.py                  # Seed script for initial base data
│   ├── seed_part2.py            # Seed script for sample tasks, attendance & chat
│   ├── requirements.txt         # Backend Python dependencies
│   ├── pytest.ini               # Pytest configuration
│   │
│   ├── routers/                 # API Route Controllers
│   │   ├── auth_router.py          # /api/auth endpoints (Login, Register, Session)
│   │   ├── users_router.py         # /api/users endpoints
│   │   ├── dashboard_router.py     # /api/dashboard analytics & statistics
│   │   ├── employees_router.py     # /api/employees & attendance tracking
│   │   ├── tasks_router.py         # /api/tasks board endpoints
│   │   ├── connect_router.py       # /api/connect WavyGo Chat messaging
│   │   ├── marketplace_router.py   # /api/marketplace extension modules
│   │   ├── opportunities_router.py # /api/opportunities project hub
│   │   ├── notifications_router.py # /api/notifications user alerts
│   │   ├── activity_router.py      # /api/activity audit logs
│   │   └── settings_router.py      # /api/settings profile & company config
│   │
│   └── tests/                   # Backend pytest test suite
│
└── frontend/                    # React + Vite Frontend Application
    ├── package.json             # Frontend dependencies & scripts
    ├── craco.config.js          # Build configuration
    ├── tailwind.config.js       # Tailwind CSS design configuration
    ├── postcss.config.js        # PostCSS configuration
    ├── components.json          # UI component settings
    │
    ├── public/                  # Public static assets & favicon
    │
    └── src/                     # Application Source Code
        ├── index.js             # React entry point
        ├── index.css            # Global CSS styles & Tailwind directives
        ├── App.js               # Main App routing & authentication wrapper
        ├── App.css              # App specific styles
        │
        ├── pages/               # Application Pages & Screens
        │   ├── Login.jsx            # User authentication screen
        │   ├── Dashboard.jsx        # Role-based executive & employee overview
        │   ├── Employees.jsx        # Employee directory & attendance tracking
        │   ├── TaskBoard.jsx        # Project task management (Kanban)
        │   ├── WavygoConnect.jsx    # WavyGo Chat & communication hub
        │   ├── AboutWavygo.jsx      # WavyGo AI assistant interface & info
        │   ├── Marketplace.jsx      # Plugin marketplace page
        │   ├── OpportunityHub.jsx   # Project & gig opportunities
        │   ├── ActivityLogs.jsx     # System activity & audit trail
        │   ├── Notifications.jsx    # User alerts & notifications
        │   ├── Settings.jsx         # System & user profile settings
        │   └── Forbidden.jsx        # 403 unauthorized access fallback page
        │
        ├── components/          # Reusable UI Components
        ├── constants/           # Constants & navigation configs
        ├── contexts/            # React Context providers (Auth, Theme, Socket)
        ├── hooks/               # Custom React hooks
        └── lib/                 # Utility functions & API clients
```

---

## ⚡ Quick Start & Run Commands

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.9 or higher

---

### 1. 🔧 Backend Setup & Execution

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment (optional but recommended):
   ```bash
   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate

   # On Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```

📍 **Default Backend Server URL**: `http://localhost:8000`  
📖 **Interactive API Documentation (Swagger UI)**: `http://localhost:8000/docs`  
📖 **ReDoc API Documentation**: `http://localhost:8000/redoc`

---

### 2. 💻 Frontend Setup & Execution

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

📍 **Default Frontend Web Application URL**: `http://localhost:5173` *(or `http://localhost:3000` depending on port config)*

---

## ⚙️ Environment Variables Setup

### Backend Environment (`backend/.env`)
```env
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
SECRET_KEY=your_super_secret_jwt_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite:///./wavygo.db
```

### Frontend Environment (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:8000/api
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🔌 API Endpoints Summary

| Endpoint Category | Base Path | Key Functionalities |
| :--- | :--- | :--- |
| **Authentication** | `/api/auth` | `/login`, `/register`, `/me`, `/logout` |
| **Dashboard** | `/api/dashboard` | Executive stats, revenue, activity stream, metrics |
| **Employees & Attendance**| `/api/employees` | Employee directory, `/check-in`, `/check-out`, attendance logs |
| **Tasks** | `/api/tasks` | CRUD tasks, status transitions, priority filtering |
| **WavyGo Connect (Chat)** | `/api/connect` | Chat rooms, direct messages, conversation threads |
| **WavyGo AI** | `/api/activity` / `/api/dashboard` | AI prompts, automated insight summaries |
| **Marketplace** | `/api/marketplace` | List & enable enterprise plugins |
| **Opportunities** | `/api/opportunities` | Internal gig board, project applications |
| **Settings** | `/api/settings` | Company preferences, role governance, account details |

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

