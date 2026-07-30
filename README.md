# Learnora Institute Platform (`learnora.in`)

An intuitive, full-stack Academic Operations & Coaching Schedule Manager designed specifically for **Learnora Institute** (accessible live at [learnora.in](https://learnora.in)). This platform powers standard curriculum coordination, role-authenticated ledger operations, and interactive learning trackers for students, coordinators, and administrators.

---

## 🚀 Welcome to Learnora Institute

At **Learnora**, we bridge the gap between structured curriculum planning and student-centered results tracking. Our professional LMS & coaching dashboard allows instructors to manage day-to-day lectures, publish assignments, review submission pipelines, and execute instant automatic student admissions via our integrated online English Placement Exam.

For resources, course details, and community admissions, visit the main portal at **[learnora.in](https://learnora.in)**.

---

## 🎨 Key Features

### 👤 Role-Based Portals & Dashboards
Support for four key administrative, teaching, and student user roles:
*   **Admins & Sub-Admins:** Complete dashboard metrics, manual student/instructor accounts creation, Fast Registration request processing, backup logs, and database ledger status resets.
*   **Instructors:** Schedule live classes, publish new cohorts/batches, issue homework assignments, grade submissions inline, and oversee individual students' progression cards.
*   **Students:** Review personal ongoing program timetables, join active virtual meetings, complete and submit pending code/theory assignments, and track academic milestone trends.

### 📚 Curriculum & Batch Publishing Directory
*   Define master course blueprints over customizable month-by-month roadmaps.
*   Roll out active course batches with standard and customized codes, custom intake targets, and designated lead instructors.

### ✍️ Instant Admissions & Auto-Admission Exam
*   Interested applicants can apply via the public **Admissions Portal**.
*   A custom **Mandatory English Placement Exam** provides instant qualification screening. If the applicant passes (Threshold: 25%), an account is automatically provisioned inside our Firebase Database, and full login credentials are secure-dispatched immediately.

### 📅 Advanced Live Class Coordinations
*   Check daily active timelines, calendar dates, track upcoming vs. completed classes.
*   Supports live meeting links, session summaries, attachments, and batch filtering.

### 🎯 Homework Assignment & Submissions Pipeline
*   Set due dates, description files, and maximum grades.
*   Supports full student drag-and-drop or manual text answers and ZIP uploads.
*   Instructors benefit from a visual **Assignment Status Tracker** table with inline scoring inputs and feedback comment triggers to simplify administrative paperwork.

---

## 🛠️ Technology Stack
*   **Framework:** React 18+ with Vite (TypeScript build system)
*   **Styling:** Custom Tailwind CSS configuration for deep-midnight slate and responsive bento grids.
*   **Backend:** Node.js backend proxy wrapper (`server.ts`)
*   **Database:** Persistent Firebase Firestore cloud database synchronizing all operations in real-time.

---

## 📂 Project Architecture
*   `src/App.tsx` - Main router, auth state engine, navigation shell, and core administration tabs.
*   `src/components/HomePage.tsx` - Interactive home admissions screen, course cards, and enrollment requests.
*   `src/components/ScheduleManager.tsx` - Curriculum planning boards, live class schedules, and calendar logs.
*   `src/components/AssignmentTracker.tsx` - Detailed view of student assignments, submitted tasks, and inline instructor grading forms.
*   `src/components/EnrollmentManager.tsx` - Process and oversee fast enrollment admissions, manual registers, and system records.

---

© 2026 **Learnora Institute** — [learnora.in](https://learnora.in). All rights reserved. Registered Sandbox Portal.
