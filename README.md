# AI-Based Budget Utilization Monitoring System (MEAN Stack)

Built to the attached project requirements: MongoDB + Express + Angular + Node.js,
with role-based access control, budget/expenditure tracking, rule-based anomaly
detection, alerting, dashboards, an admin panel, and CSV/PDF reporting.

## What's included

**backend/** — Node.js + Express + MongoDB (Mongoose) REST API
- JWT authentication, enforced on every route via middleware (not just issued and ignored)
- Roles: `admin`, `finance_officer`, `department_head`, each with different permissions
- Department, Budget, Expenditure, Alert, AuditLog, Threshold models
- Rule-based anomaly detection engine (`services/anomalyDetection.js`):
  under-utilization (low spend late in the fiscal year), overspending/deviation,
  and spending-spike detection (a transaction far above the recent average) —
  runs automatically after every new expenditure and hourly via a cron job
- Admin-configurable thresholds (no hardcoded magic numbers in the UI)
- Audit log written on every create/update/delete of financial data
- CSV export (budgets/expenditures/alerts) and a PDF summary report
- Supporting-document upload for expenditures (multer)
- Seed script with realistic reference data (real Indian ministry names and
  scheme categories — MGNREGA, PM-KISAN, Ayushman Bharat, etc. — per the brief's
  "realistic, not randomly generated" requirement)

**frontend/** — Angular (standalone components) SPA, 8 functional pages
1. Login
2. Register
3. Dashboard (summary cards, bar chart of allocated vs. spent by department,
   pie chart of expenditure by category, recent activity, open alerts)
4. Departments (CRUD)
5. Budgets (CRUD, per-department allocation)
6. Expenditures (record transactions, upload supporting documents)
7. Alerts (view/resolve anomaly alerts, trigger detection manually)
8. Reports (CSV/PDF export)
9. Admin Panel (user & role management, detection threshold configuration, audit log viewer)

## Important — what I could and couldn't do here

I built and wrote every file in this project, but two things are outside what I
can do directly from this environment:

- **I cannot run `npm install`** — this sandbox has no network access, so
  dependencies aren't downloaded/verified here. Run the install step yourself
  (below) before starting either app.
- **I cannot deploy this live** to AWS/Azure/Render/Vercel — that requires your
  own hosting accounts and credentials. Instructions for a free-tier deploy
  (Render for backend + MongoDB Atlas + Vercel/Render static for frontend) are
  below; this satisfies the brief's "only a live deployed link should be
  submitted" requirement once you complete it.

## Local setup

### 1. MongoDB
Use a local MongoDB instance or a free MongoDB Atlas cluster. Get a connection string.

### 2. Backend
```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI and a real JWT_SECRET
npm install
npm run seed      # loads sample departments/budgets/expenditures + an admin user
npm run dev        # starts on http://localhost:5000
```

Seeded logins (from the seed script output):
- Admin: `admin@gbms.gov.in` / `Admin@12345`
- Finance Officer: `finance.officer@gbms.gov.in` / `Officer@123`
- Department Head: `head.mohfw@gbms.gov.in` / `DeptHead@123` (also `head.moe@`, `head.mord@`, `head.morth@`, `head.moafw@`)

**Change these passwords before any real deployment.**

### 3. Frontend
```bash
cd frontend
npm install
# edit src/environments.ts if your backend isn't on localhost:5000
npm start           # starts on http://localhost:4200
```

## Deploying it live (to satisfy "only a live deployed link should be submitted")

1. **Database**: create a free MongoDB Atlas cluster, whitelist all IPs (0.0.0.0/0)
   for simplicity, get the connection string.
2. **Backend**: push `backend/` to its own GitHub repo, deploy to Render
   (or Railway/Fly.io) as a Node web service. Set environment variables
   (`MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN` = your frontend's URL) in the
   host's dashboard. Run the seed script once via the host's shell/console,
   or trigger it as a one-off job.
3. **Frontend**: update `src/environments.ts` to point `apiBaseUrl` at your
   deployed backend URL, then `npm run build`, and deploy the `dist/gbms-frontend`
   folder to Vercel, Netlify, or Render's static site hosting.
4. Confirm CORS: the backend's `CORS_ORIGIN` env var must match your deployed
   frontend's exact origin.

## Mapping to the project brief

| Requirement | Where |
|---|---|
| Secure login & RBAC (Finance Officer/Dept Head/Admin) | `backend/middleware/auth.js`, all routes |
| Budget allocation entry/management | Budgets page + `/api/budgets` |
| Expenditure tracking + supporting docs | Expenditures page + multer upload |
| Real-time utilization % | `budgetController.utilization`, dashboard |
| Under-utilization detection (<40% used, 70%+ of year elapsed) | `services/anomalyDetection.js` (thresholds admin-configurable) |
| Spending spike / deviation detection | Same service, `spikeMultiplier` |
| Alerts & dashboard visualizations | Alerts page, Dashboard bar/pie charts |
| Downloadable reports (PDF/CSV) | Reports page + `/api/reports/*` |
| Admin: thresholds, users, audit logs | Admin Panel page |
| Minimum 6-7 interconnected pages | 9 pages, shared nav/auth state |
| Realistic (not fake/random) data | `backend/seed/seed.js` |

## Known simplifications (worth knowing before you submit this as final)

- Anomaly detection is rule-based (as the brief allows: "with optional AI
  enhancements") — it is not a trained ML model. If you specifically need a
  ML/statistical forecasting component for full marks, that's a separate
  addition (e.g. a linear regression or moving-average forecast layered onto
  `budget_prediction`-style logic).
- File uploads are stored on local disk under `backend/uploads/` — fine for a
  single-instance deploy; would need S3/Cloud Storage for a multi-instance
  production setup.
- No automated test suite is included; add Jest/Supertest for the backend and
  Karma/Jasmine (default Angular) specs if your submission requires tests.
