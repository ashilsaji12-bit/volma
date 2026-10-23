# Volunteer Management System (VMS)

A web-based volunteer organization and event coordination platform developed as a college project for **Group 12 (S3 CSE DS)**. Converted from a Java Object-Oriented console/desktop application into a responsive, modular, full-stack web application.

---

## 👥 Project Team & Credits
**Group 12 (S3 CSE DS)**
- **Aadhi Lakshmi S** (Roll No: 01)
- **Anusree Anilkumar** (Roll No: 17)
- **Sooraj Rajendran** (Roll No: 50)
- **George Thankachan** (Roll No: 55)

---

## 🚀 Key Features

1. **Executive Dashboard**:
   - Stat summary cards (Total Volunteers, Active Activities, Open Task Slots, Assignments Made).
   - SVG Donut Chart visualizing task slot fulfillment (Filled vs Open).
   - Horizontal bar distribution chart for top in-demand skills.
   - Upcoming campus events list with live slot capacity progress bars.

2. **Volunteers Management**:
   - Register, edit, delete, and view comprehensive volunteer profiles.
   - Multi-criteria real-time filtering: search by name/email/phone, filter by skill, availability schedule, and status (Active/Inactive).
   - Volunteer profile modal featuring polymorphic role summaries, skills list, and complete participation history (tasks assigned, completed, and canceled).

3. **Campus Activities & Programs**:
   - Create, edit, and delete activities categorized into *College Event*, *Community Program*, or *Workshop*.
   - Live slot progress bar per activity (filled slots vs total capacity).
   - Activity inspection modal displaying all child tasks and currently assigned volunteers.

4. **Task Allocation & Work Packages**:
   - Define tasks with required skill qualifications, capacity slots, and designated time slots (Morning, Afternoon, Evening, Full Day).
   - Direct shortcut to launch the volunteer recommendation engine for any task.

5. **Smart Volunteer Assignment Engine**:
   - **Recommendation Algorithm**: Ranks available volunteers by skill match (+50 pts), availability match (+30 pts), active status (+15 pts), and current workload balance.
   - **Conflict Prevention Safeguards**:
     - *Duplicate Prevention*: Prohibits assigning the same volunteer twice to the same task.
     - *Capacity Guard*: Prohibits assignments beyond the task's maximum slot limit.
     - *Schedule Double-Booking Guard*: Detects and prevents booking the same volunteer into two tasks on the same event date during overlapping time slots.
   - Status transitions: Mark assignments as `Completed` or `Cancelled`.

6. **Reports & Data Export**:
   - Instant one-click CSV spreadsheet downloads for Volunteers, Activities, and Assignments.
   - Clean, print-friendly summary view (`@media print` stylesheet).
   - "Reset Demo Data" button to reload the initial sample college dataset.

7. **Design & UX**:
   - Calming teal/indigo palette with card-based layout, glassmorphic header, and responsive drawer navigation.
   - Dark / Light mode toggle with automatic `localStorage` persistence.
   - Form validations (regex email validation, 10-digit phone enforcement), modal confirmations for destructive actions, and non-blocking toast notifications.

---

## 🏛️ OOP Concepts in Code (Viva / Presentation Reference)

This project strictly preserves the Object-Oriented Programming (OOP) foundation of the original Java codebase using modern JavaScript (ES6+):

| OOP Concept | Original Java Implementation | JavaScript ES6 Web Implementation | File Reference |
| :--- | :--- | :--- | :--- |
| **Encapsulation** | `private` instance variables with getters & setters | `#` private class fields (`#id`, `#name`, `#email`, `#phone`, `#skills`), accessible strictly through validated `get`/`set` property accessors. | [`js/models/Person.js`](js/models/Person.js), [`js/models/Volunteer.js`](js/models/Volunteer.js) |
| **Inheritance** | `public class Volunteer extends Person` | `class Volunteer extends Person` and `class Coordinator extends Person` inheriting base identity attributes via `super()`. | [`js/models/Volunteer.js`](js/models/Volunteer.js), [`js/models/Coordinator.js`](js/models/Coordinator.js) |
| **Polymorphism (Method Overriding)** | Subclasses override base methods `@Override public String getRoleDescription()` | `Volunteer` and `Coordinator` override `getRoleDescription()` and `getSummary()`. When called on a collection of `Person` references, each executes its subclass-specific logic. | [`js/models/Volunteer.js`](js/models/Volunteer.js) |
| **Abstraction** | DAO / Repository interface decoupling storage from logic | `StorageService` encapsulates and abstracts `localStorage` operations. The business logic interacts only with high-level CRUD methods (`getAll`, `save`, `update`, `delete`). | [`js/services/StorageService.js`](js/services/StorageService.js) |
| **Composition & Aggregation** | `Activity` has-many `Task`, `Task` has-many `Assignment` | Activities maintain tasks by ID relationships, aggregated cleanly in `ActivityService` and `AssignmentService`. | [`js/services/ActivityService.js`](js/services/ActivityService.js) |

---

## 📁 Folder Structure

```text
volunteer-management-system/
├── index.html                   # Main application entry point & semantic HTML layout
├── README.md                    # Project documentation, OOP mapping & team details
├── css/
│   └── styles.css               # Design system, themes (light/dark), components & print styles
└── js/
    ├── app.js                   # Application bootstrap, routing & event wiring
    ├── models/                  # Domain Object-Oriented Classes
    │   ├── Person.js            # Base class (#id, #name, #email, #phone, validation)
    │   ├── Volunteer.js         # Inherits Person (#skills, #availability, #status)
    │   ├── Coordinator.js       # Inherits Person (#department)
    │   ├── Activity.js          # Activity entity (#title, #category, #date, #venue)
    │   ├── Task.js              # Task entity (#requiredSkill, #slots, #timeSlot)
    │   └── Assignment.js        # Assignment entity (#volunteerId, #taskId, #status)
    ├── services/                # Business Logic & Data-Access Layer
    │   ├── StorageService.js    # Repository pattern abstraction over localStorage
    │   ├── SeedData.js          # Realistic demo dataset & options
    │   ├── VolunteerService.js  # Volunteer CRUD, filters & profile statistics
    │   ├── ActivityService.js   # Activity & task management, slot calculations
    │   └── AssignmentService.js # Conflict guards & smart volunteer suggestion algorithm
    ├── ui/                      # View Controllers & UI Modals
    │   ├── DashboardView.js     # Stat metrics, SVG donut chart, skill distributions
    │   ├── VolunteersView.js    # Volunteers table, filter bar, profile drawer & forms
    │   ├── ActivitiesView.js    # Activity cards, slot progress & detail modal
    │   ├── TasksView.js         # Tasks listing & creation modal
    │   ├── AssignmentsView.js   # Assignment management & suggestion popup
    │   ├── ReportsView.js       # CSV exporter, print trigger & data reset
    │   ├── Toast.js             # Toast notifications (success, error, warning)
    │   ├── Modal.js             # Accessible modal dialogs & delete confirmations
    │   └── AboutModal.js        # Project info & Group 12 credits modal
    └── utils/                   # Helper Utilities
        ├── validators.js        # Email format, 10-digit phone, non-empty checks
        ├── formatters.js        # Date formatting, HTML sanitization, badge styles
        └── exportCsv.js         # UTF-8 BOM CSV generator & download trigger
```

---

## 💻 How to Run

### Option 1: Simply Open `index.html` (Double-click in Explorer)
You can directly double-click [`index.html`](index.html) to open it in Chrome, Edge, Firefox, or Safari (`file:///` protocol). It runs immediately with zero configuration and zero build steps.

### Option 2: Using `npx serve` (Node.js)
```bash
npx serve .
```
Then open `http://localhost:3000`.

### Option 3: Using Python 3
```bash
python -m http.server 5500
```
Then open `http://localhost:5500`.

### Option 4: VS Code Live Server
Right-click `index.html` and select **"Open with Live Server"**.

---

## 🔮 Future Enhancements

1. **Persistent Backend & Database Integration**: Replace `StorageService` with a Java Spring Boot REST API backed by PostgreSQL or H2 database.
2. **Role-Based Authentication (RBAC)**: Secure logins for Volunteers (view their assigned tasks, self-schedule) and Coordinators (create events, approve sign-ups).
3. **QR Code Attendance Tracking**: Generate unique digital check-in QR codes for volunteers upon arrival at the venue.
4. **Automated Notification System**: Real-time SMS and email alerts for schedule updates, task reminders, and emergency cancellations.
5. **Volunteer Gamification & Hours Certificate**: Digital certificates of appreciation based on verified hours served and skill badges earned.
