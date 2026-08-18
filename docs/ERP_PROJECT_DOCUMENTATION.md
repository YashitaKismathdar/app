# 📘 WavyGo ERP System — Technical & Functional Documentation

**Document Title**: WavyGo Enterprise Resource Planning (ERP) System — Technical, Architecture & Functional Reference  
**Version**: 2.0 (Updated & Codebase Aligned)  
**Date**: August 2026  
**Technology Stack**: React.js (Frontend) + FastAPI (Backend) + MongoDB (Database)  
**Authors / Maintainers**: WavyGo Engineering Team  

---

## 📌 1. Executive Summary & Document Overview

This document provides a comprehensive technical, functional, architecture, security, and schema reference for the **WavyGo ERP System**. It reflects the actual, operational codebase and replaces legacy or preliminary document specifications.

### Core Objectives:
- **Centralize Operations**: Single source of truth for company management, task allocation, workforce attendance, performance reviews, EV rental marketplace operations, and business opportunities.
- **Granular Multi-Role Security**: Enforce role-based access control across **5 distinct roles**: **Founder**, **Admin**, **Manager**, **Employee**, and **Intern**.
- **Intelligent Collaboration**: Integrated real-time team messaging (**WavyGo Connect**) and intelligent AI assistance (**WavyGo AI**).
- **Auditable & Compliant**: Full activity stream logging, audit trail, and instant notifications.

---

## 🏗️ 2. Technology Stack & Architecture

### 2.1 Technology Stack Matrix

| Layer | Technology / Library | Purpose & Implementation Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React.js 18 + Vite | User interface, client-side routing (`react-router-dom`), component rendering. |
| **Styling & UI Design** | Tailwind CSS + Lucide Icons + Sonner | Responsive enterprise dashboard styling, toast alerts, custom design tokens. |
| **Backend Framework** | FastAPI (Python 3.10+) | High-performance async REST API, dependency injection for auth & RBAC. |
| **Database Engine** | MongoDB | Document-based NoSQL database for flexible enterprise schemas. |
| **Database Driver** | PyMongo / Motor (`AsyncIOMotorClient`) | Non-blocking asynchronous database driver for FastAPI. |
| **Data Validation** | Pydantic v2 | Strict request/response payload schema validation & serialization (`BaseDocument`). |
| **Authentication** | JWT (JSON Web Tokens) + Refresh Sessions | Dual-token auth architecture with device IP, User-Agent & session revocation. |
| **Password Hashing** | `passlib[bcrypt]` | Cryptographic password hashing and verification. |
| **Testing Suite** | Pytest + Asyncio | Automated backend RBAC and endpoint unit testing (`backend/tests/rbac_test.py`). |

---

### 2.2 System Architecture Diagram

```text
+-----------------------------------------------------------------------+
|                             REACT FRONTEND                            |
|  [AppShell Navigation]  [AuthContext]  [ThemeContext]  [Sonner Toast] |
|  Pages: Dashboard | Marketplace | TaskBoard | Employees | Connect... |
+-----------------------------------------------------------------------+
                                   |
                               REST API
                                   |
+-----------------------------------------------------------------------+
|                            FASTAPI BACKEND                            |
|  [CORSMiddleware] -> [Auth Middleware / Token Decoder]                 |
|  [RBAC Permission Engine: permissions.py]                             |
|  Routers: /api/auth, /api/users, /api/dashboard, /api/employees,      |
|           /api/tasks, /api/opportunities, /api/connect,               |
|           /api/marketplace, /api/notifications, /api/activity         |
+-----------------------------------------------------------------------+
                                   |
                         Motor AsyncIOMotorClient
                                   |
+-----------------------------------------------------------------------+
|                           MONGODB DATABASE                            |
|  Collections: users | sessions | tasks | task_comments | departments |
|  attendance | leaves | performance | opportunities | connect_channels |
|  connect_messages | marketplace_* | notifications | activity_logs    |
+-----------------------------------------------------------------------+
```

---

## 👥 3. User Roles & Access Control (RBAC)

The WavyGo ERP platform supports **5 granular user roles**:
1. 👑 **Founder**: Organization owner with unrestricted access across all 17 modules, financial vaults, EV marketplace management, and company governance.
2. 🛡️ **Admin**: High-level operational administrator capable of managing employees, departments, task boards, announcements, and system settings.
3. 👔 **Manager**: Department or team leader empowered to create/assign tasks, review team leaves, issue performance reports, and monitor team activities.
4. 👤 **Employee**: Core team member focused on assigned tasks, personal workspace, attendance check-in/out, leave applications, and team chat.
5. 🎓 **Intern**: Entry-level workspace user with focused task execution permissions and personal attendance logging.

---

### 3.1 Module Access Permission Matrix (`MODULE_ACCESS`)

| Module Key | Sidebar Route | 👑 Founder | 🛡️ Admin | 👔 Manager | 👤 Employee | 🎓 Intern |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **dashboard** | `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **marketplace** | `/marketplace` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **task-board** | `/task-board` | ✅ | ✅ | ✅ | ✅ *(My Tasks)* | ✅ *(Assigned)* |
| **opportunity-hub** | `/opportunity-hub` | ✅ | ✅ | ✅ | ✅ *(My Opps)* | ❌ |
| **employees** | `/employees` | ✅ | ✅ | ✅ | ✅ *(Workspace)* | ✅ *(Workspace)* |
| **wavygo-connect** | `/wavygo-connect` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **company-vault** | `/company-vault` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **finance** | `/finance` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **crm** | `/crm` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **marketing** | `/marketing` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **analytics** | `/analytics` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **calendar** | `/calendar` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **wavygo-ai** | `/wavygo-ai` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **about-wavygo** | `/about-wavygo` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **activity-logs** | `/activity-logs` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **notifications** | `/notifications` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **settings** | `/settings` | ✅ | ✅ | ✅ | ✅ *(My Profile)* | ✅ *(My Profile)* |

---

### 3.2 Dynamic Contextual Sidebar Labels (`SIDEBAR_LABELS`)

To optimize user experience based on role context, the sidebar automatically renames modules:

- **task-board**:
  - Employee: *"My Tasks"*
  - Intern: *"Assigned Tasks"*
- **opportunity-hub**:
  - Employee: *"My Opportunities"*
- **employees**:
  - Employee & Intern: *"My Workspace"*
- **settings**:
  - Employee & Intern: *"My Profile"*

---

### 3.3 Granular Action Permissions (`ACTIONS`)

| Action Domain | Permission Action Key | Permitted Roles |
| :--- | :--- | :--- |
| **User Governance** | `user.invite.admin` | Founder |
| | `user.invite.manager` / `employee` / `intern` | Founder, Admin |
| | `user.delete` | Founder |
| | `user.edit_others` | Founder, Admin, Manager |
| | `user.edit_self` | All Roles |
| **Marketplace** | `marketplace.any` | Founder Only |
| **Tasks** | `task.create` | Founder, Admin, Manager, Employee |
| | `task.assign` / `task.edit_any` | Founder, Admin, Manager |
| | `task.edit_own` / `task.comment` | All Roles |
| | `task.delete` | Founder, Admin |
| **Opportunities** | `opportunity.create` / `opportunity.assign` | Founder, Admin, Manager |
| | `opportunity.edit_any` | Founder, Admin |
| | `opportunity.edit_own` | Founder, Admin, Manager, Employee |
| | `opportunity.delete` | Founder |
| **Workforce** | `employee.invite` / `department.create` | Founder, Admin |
| | `attendance.mark_self` / `leave.request_self` | All Roles |
| | `attendance.mark_others` / `leave.approve` | Founder, Admin, Manager |
| | `performance.create` | Founder, Admin, Manager |
| **WavyGo Connect**| `connect.create_channel` | Founder, Admin, Manager |
| | `connect.create_announcement` | Founder, Admin |
| | `connect.send_dm` | All Roles |
| **Audit & Config** | `activity.view_all` | Founder, Admin |
| | `activity.view_team` | Manager |
| | `settings.company_edit` | Founder |

---

## 📦 4. Core ERP Modules & Capabilities

### 🛒 4.1 EV Rental Marketplace & Operations Hub (Founder Only)
- **City Operations**: Active, paused, or planned deployment across target cities.
- **Vendor Management**: Vendor directory, contact details, rating, and KYC verification status.
- **Fleet Management**: Vehicle tracking (bikes, scooters, ebikes), registration plates, status (`available`, `booked`, `maintenance`, `retired`), and hourly/daily rental tariffs.
- **Customer & Booking Engine**: Customer profiles, booking start/end timestamps, revenue calculations, pricing tiers, and promotional discount coupons.
- **Compliance & Support**: KYC document uploads (Aadhaar, PAN, DL, GST, CIN), support ticket triage, customer/vendor ratings and reviews.

---

### 📋 4.2 Task & Project Board
- **Task Lifecycle**: `todo` ➔ `in_progress` ➔ `review` ➔ `completed` (or `cancelled`).
- **Priority Levels**: `low`, `medium`, `high`, `urgent`.
- **Granular Fields**: Assignee, reporter, module tag, due date, attachments, external links.
- **Subtasks & Comments**: Nested subtasks with checkbox completion state; interactive comment feeds with file attachments.

---

### ⏱️ 4.3 Workforce Management (Employees, Attendance & Leaves)
- **Employee Directory**: Full list of organization staff, designations, departments, contact info, and online statuses.
- **Attendance Tracker**: One-click check-in/out logging, automatic shift duration calculation, and status tags (`present`, `absent`, `leave`, `half_day`, `wfh`).
- **Leave Approval Workflow**: Employee leave requests (`casual`, `sick`, `earned`, `unpaid`), reason logs, and Manager/Admin approval/rejection interface.
- **Performance Evaluation**: Quarterly/annual evaluation ratings (1–5 scale), key accomplishments, and growth area reviews.

---

### 🌐 4.4 Business Opportunity Hub
- **Opportunity Pipeline**: Track grants, investors, accelerators, incubators, tenders, CSR initiatives, partnerships, workshops, and conferences.
- **Financial Value & Assignee**: Track opportunity value in Lakhs (₹), submission deadlines, assigned owners, document attachments, and pipeline status (`open`, `assigned`, `in_progress`, `won`, `lost`, `closed`).

---

### 💬 4.5 WavyGo Connect (Communication Hub)
- **Channel Types**: Public channels, Direct Messages (DMs), group chats, and organization-wide announcements.
- **Real-Time Messaging**: Threaded messages, attachment sharing, member rosters, and instant unread notification indicators.

---

### 🤖 4.6 WavyGo AI Assistant
- Integrated enterprise AI copilot offering instant responses to operational queries, workflow guidance, task assistance, and metric summaries.

---

### 📜 4.7 Audit Logs & Notifications
- **Activity Logs**: Immutable record of actions containing `user_id`, `user_name`, `user_role`, `action`, `module`, `target`, metadata, and creation timestamp.
- **Notification System**: User-targeted or broadcast alerts (`info`, `success`, `warning`, `error`) with direct navigation links.

---

## 🗄️ 5. MongoDB Data Model Schema

The database consists of the following primary MongoDB collections:

```text
wavygo_db
├── users                     # User credentials, roles, profile info, online status
├── sessions                  # JWT refresh token sessions & revocation tracking
├── departments               # Department structure & department head IDs
├── tasks                     # Task details, assignees, subtasks, deadlines
├── task_comments             # Comments & file attachments linked to tasks
├── attendance                # Daily check-in/out records & status
├── leaves                    # Employee leave submissions & review status
├── performance               # Performance reviews, scores, & feedback
├── opportunities             # Business opportunities, grants, value, assignees
├── connect_channels          # Channels, DMs, & member list schemas
├── connect_messages          # Real-time chat messages & attachments
├── marketplace_cities        # Active/planned EV rental operation cities
├── marketplace_vendors       # Vendor profiles & KYC verification state
├── marketplace_vehicles      # Vehicle fleet, pricing, & maintenance status
├── marketplace_customers     # Customer profiles & KYC status
├── marketplace_bookings      # Customer booking contracts & revenue
├── marketplace_pricings      # Hourly/daily/weekly/monthly pricing plans
├── marketplace_coupons       # Promotional discount coupons & usage limits
├── marketplace_kyc           # Vendor & customer compliance documentation
├── marketplace_support       # Operational support tickets & status
├── marketplace_reviews       # Customer & vendor review scores
├── notifications             # System notifications & broadcast messages
└── activity_logs             # Organization audit trail
```

---

## 🔒 6. Authentication & Security Architecture

1. **Password Hashing**: Stored strictly using `bcrypt` hashes via `passlib`. Plaintext passwords are never logged or stored.
2. **Dual JWT Token Architecture**:
   - **Access Token**: Short-lived JWT bearer token passed in the `Authorization: Bearer <token>` header for protected API routes.
   - **Refresh Token**: Stored in the `sessions` collection with user-agent, IP address, creation timestamp, and revocation boolean state.
3. **Backend Authorization Enforcement**:
   - API endpoints use FastAPI dependency injection (`get_current_user`, `require_roles("Founder", "Admin")`, `can(role, action)`).
   - Frontend UI hidden elements are strictly backed by server-side permission rejection (`HTTP 403 Forbidden`).
4. **Input Sanitization & NoSQL Protection**:
   - Pydantic v2 schemas reject malformed fields or direct query object injections.
5. **CORS & Environment Confidentiality**:
   - Strict CORS origins (`CORS_ORIGINS`). Database connection strings and JWT secrets are managed via `.env`.

---

## 🌐 7. REST API Endpoints Reference

| Module | Method | Endpoint Path | Description & Access |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & issue tokens |
| | `POST` | `/api/auth/register` | Register new user *(Founder/Admin only)* |
| | `POST` | `/api/auth/refresh` | Issue new access token using refresh token |
| | `POST` | `/api/auth/logout` | Revoke session & clear online status |
| | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| **Users** | `GET` | `/api/users/directory` | Fetch directory of active users |
| **Dashboard** | `GET` | `/api/dashboard/stats` | Fetch executive KPIs & role analytics |
| **Employees** | `GET` | `/api/employees/directory` | View employee list & departments |
| | `POST` | `/api/employees/invite` | Invite employee *(Founder/Admin)* |
| | `POST` | `/api/employees/attendance/check-in` | Log daily check-in timestamp |
| | `POST` | `/api/employees/attendance/check-out`| Log daily check-out timestamp |
| | `GET` / `POST`| `/api/employees/leaves` | List or submit leave requests |
| | `PUT` | `/api/employees/leaves/{id}` | Approve or reject leave request |
| **Tasks** | `GET` / `POST`| `/api/tasks` | List or create tasks |
| | `PATCH` | `/api/tasks/{id}/status` | Update task workflow status |
| | `POST` | `/api/tasks/{id}/comments` | Add comment thread to task |
| **Opportunities**| `GET` / `POST`| `/api/opportunities` | List or register business opportunities |
| | `PUT` | `/api/opportunities/{id}/assign` | Assign opportunity to employee |
| **Connect** | `GET` / `POST`| `/api/connect/channels` | List or create chat channels |
| | `GET` / `POST`| `/api/connect/messages` | List or post channel messages / DMs |
| **Marketplace** | `GET` / `POST`| `/api/marketplace/*` | Manage cities, vendors, vehicles, bookings *(Founder)* |
| **Activity** | `GET` | `/api/activity` | Retrieve system audit logs |
| **Notifications**| `GET` / `PATCH`| `/api/notifications` | Fetch alerts or mark as read |

---
*WavyGo ERP System — Empowering workforce efficiency, intelligent automation, and company growth.*
