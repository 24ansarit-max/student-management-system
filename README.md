# 🎓 StudentHub - Student Management System

A complete, modern, standalone academic administration web application built with **Node.js**, **Express.js**, **SQLite**, and **vanilla HTML5 / CSS3 / JavaScript**.

Designed specifically for educational institutions, universities, and academic departments to seamlessly manage student records, admissions, academic progress, and institutional reporting.

---

## 📌 Project Overview

**StudentHub** replaces legacy, disparate record-keeping files with an integrated, high-performance local web portal. It provides administrative officers and faculty registrars with a clean, responsive academic dashboard, live search and multi-filtering directories, rigorous roll number validation, profile inspection, data export to CSV, and printable institutional reports.

---

## ✨ Key Features

- **Academic Dashboard**:
  - Live statistics: Total Registry, Active Enrolled, Inactive, Graduated Alumni, and New Admissions.
  - Dynamic visual progress breakdowns for Engineering/Computing Departments and Academic Years.
  - Recent Admissions registry with instant quick-view modal.

- **Student Directory & Management**:
  - Full CRUD operations: Create, Read/Inspect, Update, and Delete.
  - Dynamic, debounced live search across student names, roll numbers, emails, and departments.
  - Combined multi-criteria filtering by Academic Department, Year level (1–4), and Enrollment Status.
  - Detailed student profile modals with categorized academic, contact, and guardian records.
  - Safe deletion workflow with confirmation modal.

- **Strict Roll Number Validation**:
  - Enforced uniqueness at both database schema (`UNIQUE` constraint) and application layers.
  - Alphanumeric format validation (e.g., `ECE001`, `RBU2026001`).
  - Clear error feedback for duplicates (`409 Conflict`), empty inputs, and invalid formats.

- **Academic Reports & Analytics**:
  - Summary metric cards and breakdown tables.
  - **Live CSV Export**: Generates authentic, RFC-compliant `.csv` downloads containing complete student profiles.
  - **Formatted Print View**: Dedicated print stylesheet formatted for official paper or PDF generation.

- **Institutional Settings**:
  - Configurable Institution Name, Administrator Profile, Academic Session, and Default Admission Status.
  - Local persistence across sessions.

- **User Experience & Reliability**:
  - Auto-dismissing Toast notification system (Success, Warning, Error).
  - Clean Academic Administration theme (`#172033` Navy, `#4F46E5` Indigo, `#F5F7FB` Canvas).
  - Fully responsive across desktop, laptop, tablet, and mobile devices.
  - Loading spinners and submission debouncing to prevent duplicate entries.
  - Friendly empty states for unpopulated databases and zero-match search results.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JS (ES6+) | Zero external UI libraries or paid CDNs |
| **Backend** | Node.js, Express.js | RESTful JSON API with parameterized queries |
| **Database** | SQLite (`sqlite3`) | Persistent local file `students.db` |
| **Dependencies** | `express`, `sqlite3`, `cors` | Lightweight, minimal, and secure |

---

## 🚀 Installation & Running Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher installed)
- npm (Node Package Manager)

### Step 1: Navigate to Project Directory
```bash
cd d:\student-management-system
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Application
```bash
npm start
```

### Step 4: Open in Your Web Browser
Navigate to:
```
http://localhost:3000
```

---

## 🧪 Automated Testing

The project includes an automated test suite verifying all 12 core CRUD, search, filter, roll-number uniqueness, and persistence criteria:

```bash
npm test
```
or:
```bash
node test/api-test.js
```

---

## 🗄️ Database Schema (`students.db`)

The SQLite database `students.db` is initialized automatically on first launch. If the table is empty, a seed of realistic sample students is added once without duplicate re-seeding on subsequent restarts.

```sql
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roll_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT,
  date_of_birth TEXT,
  course TEXT NOT NULL,
  department TEXT NOT NULL,
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  address TEXT,
  city TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  admission_date TEXT,
  status TEXT DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/departments` | Returns list of academic engineering departments |
| `GET` | `/api/stats` | Dynamic statistical metrics & distributions for dashboard |
| `GET` | `/api/students` | List students with optional query parameters (`q`, `department`, `year`, `status`, `sort`) |
| `GET` | `/api/students/search?q=:query` | Dynamic multi-field search |
| `GET` | `/api/students/:id` | Retrieve detailed record for a single student |
| `POST` | `/api/students` | Create new student record (with format & uniqueness validation) |
| `PUT` | `/api/students/:id` | Update student record (with uniqueness check excluding current ID) |
| `DELETE` | `/api/students/:id` | Permanently remove student record from SQLite |

---

## 📂 Project Structure

```
student-management-system/
├── package.json               # NPM package manifest & scripts
├── package-lock.json          # Dependency lockfile
├── server.js                  # Express.js REST API & static server
├── database.js                # SQLite connection, schema, seed & helpers
├── students.db                # Persistent SQLite database file
├── README.md                  # Project documentation
│
├── test/
│   └── api-test.js            # Automated test suite (12 test specifications)
│
└── public/
    ├── index.html             # Academic Dashboard view
    ├── students.html          # Student Directory & Records view
    ├── add-student.html       # Admission & Registration form
    ├── reports.html           # Reports, Analytics & CSV Export view
    ├── settings.html          # Institution & Administration configuration
    │
    ├── css/
    │   └── style.css          # Modern Academic Administration stylesheet
    │
    └── js/
        ├── app.js             # Global utilities, toasts, modals, header
        ├── dashboard.js       # Dashboard metrics & distribution charts
        ├── students.js        # Student directory table, search, filters & CRUD
        ├── student-form.js    # Add Student validation & submission
        ├── reports.js         # Report generation, CSV exporter & print view
        └── settings.js        # Institutional settings management
```

---

## 🖼️ User Interface Highlights

- **Dashboard**: Metric counter cards, departmental enrollment distribution progress bars, academic year breakdown, and recent student admissions table.
- **Student Directory**: Clean tabular layout with roll number chips, department tags, status badges (`Active`, `Inactive`, `Graduated`, `Suspended`), view modal, edit modal, and delete confirmation modal.
- **Add Student**: 4 distinct academic sections (Personal Info, Contact Info, Academic Info, Guardian Info) with instant inline error highlighting.
- **Reports**: Real-time summary tables, CSV file generator, and print-ready layout.

---

## 🔮 Future Scope

1. **Role-Based Access Control (RBAC)**: Support separate credentials for Deans, Faculty Advisors, and Registrars.
2. **Attendance & Grading Module**: Track semester attendance percentages and GPA / CGPA records per student.
3. **Document Attachments**: Secure local upload for student admission certificates, ID proofs, and transcripts.
4. **Batch CSV Import**: Ability to bulk-upload an incoming cohort from a single spreadsheet.

---

## 🎓 Academic Project Information

- **Project Title**: Student Management System (StudentHub)
- **Course**: Full-Stack Web Development / Academic Systems Engineering
- **Architecture**: Client-Server REST Architecture with Relational Database
- **Status**: Complete, Fully Functional & Verified
