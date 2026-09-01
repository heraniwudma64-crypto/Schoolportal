# School Management Portal

A full-stack school management system with role-based dashboards for Admins, Teachers (including Homeroom Teachers), Students, and Parents.

**Stack:** NestJS · Prisma · PostgreSQL (Supabase) · React · Vite · TypeScript · Tailwind CSS

---

## Project Structure

```
school-portal-main/
├── backend/          # NestJS API server
│   ├── prisma/       # Schema and migrations
│   └── src/          # Modules: auth, users, students, teachers, results, roster, …
└── frontend/         # React + Vite SPA
    └── src/          # Pages, components, API clients
```

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- A PostgreSQL database (project uses [Supabase](https://supabase.com))

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/heraniwudma64-crypto/Schoolportal.git
cd Schoolportal
```

### 2. Configure environment variables

**Backend**

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in every value. See the comments in `.env.example` for guidance on each key:

| Key | Description |
|-----|-------------|
| `DATABASE_URL` | Pooled Postgres connection string (pgBouncer, port 6543) |
| `DIRECT_URL` | Direct Postgres connection string (port 5432, used by migrations) |
| `JWT_SECRET` | Long random string for signing JWT tokens |
| `PORT` | Port the API listens on (default `3000`) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (keep secret) |
| `MAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `MAIL_PORT` | SMTP port (e.g. `587`) |
| `MAIL_USER` | SMTP login email |
| `MAIL_PASSWORD` | SMTP app password |
| `MAIL_FROM` | Sender address shown in outgoing emails |

> **Never commit `backend/.env`** — it is listed in `.gitignore`.

**Frontend**

```bash
cp frontend/.env.example frontend/.env
```

Set `VITE_API_URL` to the URL of your running backend (default `http://localhost:3000`).

---

### 3. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Run database migrations

```bash
cd backend
npx prisma migrate deploy   # apply all migrations
npx prisma generate         # generate the Prisma client
```

To seed an initial admin account:

```bash
node seed-admin.js
```

### 5. Start development servers

**Backend** (runs on port 3000 by default)

```bash
cd backend
npm run start:dev
```

**Frontend** (runs on port 5173)

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Available Scripts

### Backend (`/backend`)

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with hot-reload (development) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | Run compiled production build |
| `npx prisma migrate dev` | Create and apply a new migration |
| `npx prisma migrate deploy` | Apply pending migrations (CI/production) |
| `npx prisma studio` | Open Prisma database browser |

### Frontend (`/frontend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production bundle |
| `npm run typecheck` | TypeScript check without emitting |
| `npm run lint` | ESLint check |
| `npm run preview` | Preview the production build locally |

---

## Key Features

- **Role-based access** — Admin, Teacher, Homeroom Teacher, Student, Parent
- **Homeroom dashboard** — Submission matrix, consolidated class roster, report card generation
- **Academic structure** — Grade levels, class sections, academic years, timetables
- **Examinations & grades** — Exam creation, grade entry, quarter results, subject results
- **Assignments** — Creation, publishing, student submission with file upload
- **Attendance** — Per-session recording and student attendance history
- **Notices** — Targeted announcements by role, grade, section, or individual
- **Materials** — File uploads scoped to class sections or roles
- **Fee management** — Invoices and payment tracking
- **Student registration** — Full demographic profile with enrollment flow

---

## Database Migrations

All migrations live in `backend/prisma/migrations/`. Never edit them manually — use `npx prisma migrate dev --name <description>` to create new ones.

| Migration | Description |
|-----------|-------------|
| `20260829120000_add_material_section_target` | Links materials to class sections |
| `20260831120000_add_submission_work` | Adds file fields to submissions |
| `20260831130000_add_student_registration_profile` | Extended student demographic fields |
| `20260901110000_canonical_class_section_enrollment` | Canonical enrollment + SectionSubjectTeacher |

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Open a pull request — do not force-push to `main` directly

---

## Security Notes

- All secret values must be kept in `.env` files, which are git-ignored
- `.env.example` files contain **only key names**, never real values
- JWT tokens are validated on every protected route via `JwtAuthGuard`
- Role enforcement uses `RolesGuard` with `@Roles()` decorators
