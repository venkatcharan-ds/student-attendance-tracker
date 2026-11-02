# Student Attendance Tracker

React (Vite) frontend + Spring Boot 3 REST API + H2 file database (PostgreSQL optional).

## Run

Backend (port 8080) — data is saved to `backend/data/attendancedb`:

```bash
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

Frontend (port 5173):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

To use PostgreSQL instead of H2, set `DATABASE_URL`, `DATABASE_USERNAME` and `DATABASE_PASSWORD` before starting the backend.

## Features (Attendly UI)

- **Dashboard** – KPI cards (total students, present / absent today, attendance rate with change vs the previous session), last-7-days chart, today's summary ring and a "needs attention" list.
- **Students** – searchable, sortable table with today's status; **Add student** modal with validation; remove with confirmation.
- **Attendance** – calendar date picker (days with saved attendance are dotted), search, status filter, Present/Absent toggles, bulk marking, **Save attendance** / **Update attendance** (Ctrl + S) and a live saved summary. Unsaved marks are protected by a confirmation when switching date or page.
- **Reports** – month view of saved sessions: average rate, totals, daily chart and session table.
- **Settings** – theme (system / light / dark), display name, API connection test.
- Loading skeletons, empty states, toast notifications, keyboard-accessible dropdowns and dialogs, Ctrl + K student search, responsive layout with a drawer sidebar on phones.

Frontend structure: `src/pages` (one file per sidebar page), `src/components` (layout, ui primitives, shared cards), `src/context` (API data, toasts, confirm dialog), `src/services/attendanceService.js` (all REST calls). Icons come from `lucide-react`.

## One record per student per date

- Database: unique constraint on `(student_id, attendance_date)`.
- Service: saving a mark for a student who already has one on that date updates it instead of inserting.

## REST API

| Method | URL | Body / params | Result |
|---|---|---|---|
| GET | `/api/students` | | list of students |
| POST | `/api/students` | `{ "name": "Anu", "rollNumber": "R01" }` | 201, 400 invalid, 409 duplicate roll |
| DELETE | `/api/students/{id}` | | 204, 404 |
| GET | `/api/attendance?date=2026-11-02` | | `{ date, records[], presentCount, absentCount, totalStudents }` |
| GET | `/api/attendance/days?from=2026-11-01&to=2026-11-30` | | `[{ date, presentCount, absentCount }]` for dates with saved attendance |
| POST | `/api/attendance` | `{ "date": "2026-11-02", "records": [ { "studentId": 1, "status": "PRESENT" } ] }` | same summary as GET |

## Tests

```bash
cd backend
./mvnw test
```
