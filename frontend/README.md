# FX Event Booking ERP — Frontend

React + Vite + Tailwind CSS, styled to match the FX Engineering College ERP theme
(dark navbar, blue primary accent, white rounded cards).

## 1. Install dependencies
```bash
cd frontend
npm install
```

## 2. Configure environment
```bash
cp .env.example .env
```
Set `VITE_API_BASE_URL` to your backend URL (default `http://localhost:5000`).

## 3. Run the dev server
```bash
npm run dev
```
Opens at `http://localhost:5173`.

## Pages
- `Login` — Google sign-in screen. Shows an error banner if the backend rejects
  an unregistered email (`?error=...` query param).
- `AuthCallback` — receives the JWT from the backend redirect, stores it, loads
  the current user, and forwards to `/dashboard`.
- `Dashboard` — lists events with status filters (pending HOD / Principal /
  Campus Manager, fully approved, rejected) and a "my events only" toggle.
  Shows a **Create Event** button only for `ap`/`hod` users.
- `CreateEvent` — event request form (ap/hod only).
- `EventDetails` — full event info, 3-step approval tracker, and role-gated
  Approve/Reject buttons that only appear for the user whose turn it currently is.

## Auth flow
1. User clicks **Continue with Google** → redirected to `GET {API}/auth/google`.
2. Backend completes OAuth, checks the email against `users`, issues a JWT, and
   redirects to `FRONTEND_URL/auth/callback?token=...` (or to `/login?error=...`
   if the email isn't registered).
3. Frontend stores the JWT in `localStorage`, fetches `/auth/me`, and routes to
   the dashboard.
4. Every subsequent API call sends `Authorization: Bearer <token>` via the axios
   interceptor in `src/services/api.js`.
