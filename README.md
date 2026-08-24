# FX Event Booking ERP — Overall Setup

Full-stack event booking app for Francis Xavier Engineering College: Node/Express/
MySQL backend + React/Vite/Tailwind frontend, Google OAuth login, and a
3-level HOD → Principal → Campus Manager approval workflow.

## Folder structure
```
FX (ERP)/
  backend/
    src/
      config/       db.js, passport.js
      models/       User.js, Event.js, index.js
      routes/       authRoutes.js, eventRoutes.js
      controllers/  authController.js, eventController.js
      services/     eventService.js (computed status)
      middleware/   authMiddleware.js (JWT + role guard)
      app.js
      server.js
    schema.sql
    .env.example
    package.json
    README.md
  frontend/
    src/
      components/   Navbar, EventForm, EventList, EventCard, StatusBadge,
                     LoginButton, ProtectedRoute
      pages/        Login, AuthCallback, Dashboard, CreateEvent, EventDetails
      services/     api.js, authService.js, eventService.js
      context/      AuthContext.jsx
      App.jsx, main.jsx, index.css
    .env.example
    package.json
    README.md
```

## Running both together
1. **Database**: create it and load the schema (MySQL).
   ```bash
   mysql -u root -p -e "CREATE DATABASE fx_event_booking CHARACTER SET utf8mb4;"
   mysql -u root -p fx_event_booking < backend/schema.sql
   ```
2. **Backend**:
   ```bash
   cd backend
   cp .env.example .env   # fill in DB + Google OAuth + JWT secret
   npm install
   npm run dev             # http://localhost:5000
   ```
3. **Frontend**:
   ```bash
   cd frontend
   cp .env.example .env   # VITE_API_BASE_URL=http://localhost:5000
   npm install
   npm run dev             # http://localhost:5173
   ```
4. Open `http://localhost:5173` in the browser.

## How Google login works end-to-end
1. Frontend "Continue with Google" button sends the browser to
   `GET {backend}/auth/google`.
2. Passport's Google strategy handles the OAuth handshake and returns to
   `GET {backend}/auth/google/callback`.
3. The callback looks up the returned email in the `users` table:
   - **Found** → updates `google_id`/`avatar_url` if needed, issues a JWT, and
     redirects to `{frontend}/auth/callback?token=<jwt>`.
   - **Not found** → no account is created; the browser is redirected to
     `{frontend}/login?error=Your%20email%20is%20not%20registered.%20Contact%20admin.`
4. The frontend's `AuthCallback` page stores the JWT in `localStorage`, calls
   `GET /auth/me` to hydrate the user in `AuthContext`, then routes to
   `/dashboard`.
5. All further API calls attach `Authorization: Bearer <jwt>`; the backend's
   `ensureAuthenticated` middleware re-verifies the user still exists in
   `users` on every request.

## How the approval workflow works
- Each event has three independent status columns: `hod_approved`,
  `principal_approved`, `campus_manager_approved` (`pending` | `approved` |
  `rejected`).
- **Creating an event**: only `ap` or `hod` users can create events.
  - If an **ap** creates it, all three columns start `pending`.
  - If an **hod** creates it, `hod_approved` starts `approved` (their own step
    is auto-cleared) and the other two start `pending`.
- **Approving**: each role can only act on its own step, and only once the
  previous step is `approved` (enforced both by the UI, which hides buttons
  that aren't relevant, and by the backend, which checks role + event state).
- **Computed status** (`eventService.js` on the backend) turns the three enum
  columns into one human-readable string shown everywhere in the UI:
  - `Pending HOD approval`
  - `Approved by HOD, pending Principal approval`
  - `Approved by HOD and Principal, pending Campus Manager approval`
  - `Fully approved`
  - `Rejected by HOD` / `Rejected by Principal` / `Rejected by Campus Manager`
- The `EventDetails` page renders this as a 3-step tracker (✓ / ✕ / …) plus a
  colored `StatusBadge`, and only shows Approve/Reject buttons to the signed-in
  user whose turn it currently is.

## MySQL notes
- Uses `mysql2` as the Sequelize driver (`dialect: 'mysql'` in `src/config/db.js`).
- Default port `3306`, default user `root` in `.env.example` — adjust to your
  local setup.
- `ENUM` columns and `AUTO_INCREMENT` are native MySQL syntax in `schema.sql`
  (no separate `CREATE TYPE` step like Postgres needed).
- `updated_at` auto-refreshes via `ON UPDATE CURRENT_TIMESTAMP` — no triggers
  required.
- The `CHECK (no_of_participants > 0)` constraint requires MySQL 8.0.16+ (or
  MariaDB 10.2+) to be enforced at the DB level; it's backed up by API-level
  validation regardless.
