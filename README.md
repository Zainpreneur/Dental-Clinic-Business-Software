# Dental Clinic Business Software

A full-stack practice management system for dental clinics: patient records with
per-tooth dental charts, appointment scheduling, a treatment catalog, billing &
invoicing with payments, staff/role management, and inventory tracking — all
behind role-based authentication.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, JWT auth (bcrypt-hashed passwords), Zod validation
- **Frontend:** React 18, TypeScript, Vite, React Router, Tailwind CSS, Axios
- **Infra:** Docker Compose (Postgres + API + static frontend behind nginx)

## Features

| Module | Capabilities |
|---|---|
| **Auth** | Register/login, JWT sessions, roles: Admin, Dentist, Receptionist, Assistant. First registered user becomes Admin. |
| **Patients** | CRUD, search, medical history, insurance info, allergies, per-tooth **dental chart** (Universal Numbering 1–32), document list |
| **Appointments** | Scheduling with conflict detection per dentist, day view, status workflow (Scheduled → Checked-in → In progress → Completed / No-show / Cancelled) |
| **Treatments** | Procedure catalog with pricing & duration, categorized; treatment records tied to patients & performing staff |
| **Billing** | Invoices with line items, discounts/tax, multiple payments per invoice, auto status (Unpaid/Partially Paid/Paid), running patient balance, void |
| **Inventory** | Stock items with reorder thresholds, restock/usage/waste movements with audit trail, low-stock alerts |
| **Staff** | Admin-managed staff directory with roles and specialties |
| **Dashboard** | Today's schedule, active patients, monthly revenue, outstanding balance, low-stock alerts |

## Project Structure

```
backend/    Express + TypeScript API, Prisma schema & migrations
frontend/   React + Vite single-page app
docker-compose.yml   Postgres + backend + frontend for one-command local deploy
```

## Getting Started (local development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or use `docker compose up db`)

### 1. Backend

```bash
cd backend
cp .env.example .env      # edit DATABASE_URL / JWT_SECRET as needed
npm install
npx prisma migrate dev --name init
npm run seed               # optional: creates demo users, treatments, a patient
npm run dev                 # http://localhost:4000
```

Seeded logins (all use password `Password123!`):
- `admin@dentalclinic.test` — Admin
- `dentist@dentalclinic.test` — Dentist
- `frontdesk@dentalclinic.test` — Receptionist

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :4000)
```

Open http://localhost:5173 and sign in (or register — the first account created
becomes the clinic Admin).

## Running with Docker Compose

```bash
docker compose up --build
```

This starts Postgres, runs Prisma migrations, and serves the API on `:4000`
and the frontend on `:5173`. Run the seed script once the backend is up:

```bash
docker compose exec backend npm run seed
```

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port (default 4000) |
| `JWT_SECRET` | Secret used to sign auth tokens — set a long random value in production |
| `JWT_EXPIRES_IN` | Token lifetime (default `8h`) |
| `CORS_ORIGIN` | Allowed origin(s) for the frontend, comma-separated |

## API Overview

All routes except `/api/auth/register` and `/api/auth/login` require a
`Authorization: Bearer <token>` header.

- `POST /api/auth/register` / `POST /api/auth/login` / `GET /api/auth/me`
- `GET/POST /api/patients`, `GET/PUT/DELETE /api/patients/:id`
- `GET/POST /api/patients/:id/dental-chart`
- `GET/POST /api/appointments`, `PUT /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `POST /api/appointments/:id/cancel`
- `GET/POST /api/treatments`, `PUT/DELETE /api/treatments/:id`
- `POST /api/treatments/records`, `GET /api/treatments/records/patient/:patientId`
- `GET/POST /api/invoices`, `GET /api/invoices/:id`, `POST /api/invoices/:id/payments`, `POST /api/invoices/:id/void`
- `GET/POST /api/staff`, `PUT/DELETE /api/staff/:id`, `GET /api/staff/dentists`
- `GET/POST /api/inventory`, `PUT/DELETE /api/inventory/:id`, `POST /api/inventory/:id/movements`
- `GET /api/dashboard/summary`

## Roles & Permissions

| Action | Admin | Dentist | Receptionist | Assistant |
|---|:-:|:-:|:-:|:-:|
| Manage patients | ✅ | view | ✅ | view |
| Manage appointments | ✅ | view/update status | ✅ | view/update status |
| Record dental chart / treatments | ✅ | ✅ | – | ✅ |
| Manage treatment catalog | ✅ | – | – | – |
| Billing & payments | ✅ | – | ✅ | – |
| Inventory | ✅ | usage only | view | ✅ |
| Staff management | ✅ | – | – | – |

## Notes for Production

- Set a strong, unique `JWT_SECRET`.
- Put the API behind HTTPS; the frontend nginx config here is a starting point, not a hardened production config.
- Add backups/retention policy for the Postgres volume.
- Consider adding rate limiting on `/api/auth/*`.
