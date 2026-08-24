# FX Event Booking ERP — Backend

Node.js + Express + MySQL (Sequelize) + Google OAuth (Passport) + JWT.

## 1. Install dependencies
```bash
cd backend
npm install
```
> If you previously ran `npm install` before switching from PostgreSQL to MySQL,
> delete `node_modules` and `package-lock.json` first, then reinstall, so the
> old `pg` driver is replaced by `mysql2`.

## 2. Configure environment
```bash
cp .env.example .env
```
Fill in `DB_*`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`.

### Getting Google OAuth credentials
1. Go to https://console.cloud.google.com/apis/credentials
2. Create an **OAuth client ID** -> Application type: **Web application**
3. Authorized redirect URI: `http://localhost:5000/auth/google/callback`
4. Copy the generated **Client ID** and **Client secret** into `.env`

## 3. Create the database and run the schema
```bash
mysql -u root -p -e "CREATE DATABASE fx_event_booking CHARACTER SET utf8mb4;"
mysql -u root -p fx_event_booking < schema.sql
```
`schema.sql` creates `users` and `events` exactly per the required schema (MySQL
`ENUM` columns, `AUTO_INCREMENT` PKs, `ON UPDATE CURRENT_TIMESTAMP` for
`updated_at`, FK + CHECK constraints), plus one sample user per designation
(ap, hod, principal, campus_manager) with placeholder
`@francisxavier.ac.in` emails - replace with real ones before go-live.
**Only emails present in `users` can sign in.**

> Note: the `CHECK (no_of_participants > 0)` constraint is enforced by MySQL
> 8.0.16+. On older MySQL/MariaDB versions it is silently ignored by the
> database, but the backend still validates `no_of_participants > 0` at the
> API layer (`express-validator`), so invalid values are rejected either way.

## 4. Run the server
```bash
npm run dev     # nodemon, auto-reload
# or
npm start
```
API is served at `http://localhost:5000`.

## API Endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | /auth/google | No | - | Start Google sign-in |
| GET | /auth/google/callback | No | - | OAuth callback, issues JWT, redirects to `FRONTEND_URL/auth/callback?token=...` |
| GET | /auth/me | Yes | any | Current user profile |
| POST | /auth/logout | Yes | any | Stateless logout (client discards token) |
| POST | /events | Yes | ap, hod | Create event. Body: `{ event_name, venue, purpose, organizer, no_of_participants, event_date, start_time, end_time }` |
| GET | /events | Yes | any | List events. Query: `?status=pending_hod|pending_principal|pending_campus_manager|fully_approved|rejected&department=&creator=` |
| GET | /events/:id | Yes | any | Get single event with computed `status` |
| PATCH | /events/:id/approve-hod | Yes | hod | Body: `{ status: 'approved' or 'rejected' }` |
| PATCH | /events/:id/approve-principal | Yes | principal | Body: `{ status: 'approved' or 'rejected' }` |
| PATCH | /events/:id/approve-campus-manager | Yes | campus_manager | Body: `{ status: 'approved' or 'rejected' }` |

Auth header for protected routes: `Authorization: Bearer <jwt>`

### Existing database migration

If the database was created before event cancellation was added, run this once:

```sql
ALTER TABLE events ADD COLUMN is_cancelled BOOLEAN NOT NULL DEFAULT FALSE;
```

If the database was created with the previous single-time schema, run this once
before starting the updated backend:

```sql
ALTER TABLE events ADD COLUMN start_time TIME NULL, ADD COLUMN end_time TIME NULL;
UPDATE events SET start_time = event_time, end_time = ADDTIME(event_time, '01:00:00');
ALTER TABLE events MODIFY start_time TIME NOT NULL, MODIFY end_time TIME NOT NULL;
ALTER TABLE events DROP INDEX idx_events_slot, DROP COLUMN event_time;
CREATE INDEX idx_events_slot ON events(venue, event_date, start_time, end_time);
```

### Example response — GET /events/:id
```json
{
  "id": 12,
  "venue": "Main Auditorium",
  "event_name": "Tech Symposium 2026",
  "purpose": "Annual department tech fest",
  "organizer": "CSE Association",
  "no_of_participants": 250,
  "hod_approved": "approved",
  "principal_approved": "pending",
  "campus_manager_approved": "pending",
  "status": "Approved by HOD, pending Principal approval",
  "creator": { "id": 4, "name": "Prof. Ravi Shankar", "email": "ravi.ap@francisxavier.ac.in", "designation": "ap", "department": "Computer Science and Engineering" }
}
```

### Login rejection example
If the Google account's email isn't in `users`, the callback redirects to:
`FRONTEND_URL/login?error=Your%20email%20is%20not%20registered.%20Contact%20admin.`
