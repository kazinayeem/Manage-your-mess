# Manage-your-mess

**MessFlow Pro** — A modern SaaS platform to manage mess, hostel, PG, and student accommodation. Built for Bangladesh and beyond, with English and Bangla support.

[Live demo](#demo-accounts) · [Quick start](#quick-start) · [Documentation](docs/ARCHITECTURE.md)

---

## Features

- **Multi-tenant mess workspaces** — Each mess runs independently with isolated data
- **Meal tracking** — Breakfast, lunch, dinner with automatic meal-rate calculation
- **Expense management** — Categories, approvals, and receipt uploads
- **Deposit tracking** — bKash, Nagad, Rocket, Upay, bank transfer, and cash
- **Member management** — Invite codes, roles, and manager-only controls
- **Billing & subscriptions** — Plans, trials, payment requests, and read-only expiry mode
- **Reports** — Monthly summaries with PDF export
- **Portal & mobile UX** — Bottom navigation, FAB quick actions, PWA-ready shell
- **Super Admin** — Users, messes, plans, payments, audit logs, and platform settings
- **Multilingual** — English (`en`) and Bangla (`bn`) via next-intl

## Tech Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Prisma · NextAuth.js · Zustand · TanStack Table · Framer Motion · next-intl

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/kazinayeem/Manage-your-mess.git
cd Manage-your-mess
npm install
cp .env.example .env   # if present; otherwise create .env with DATABASE_URL and AUTH_SECRET
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Accounts

| Role        | Email              | Password      |
|-------------|--------------------|---------------|
| Super Admin | admin@messflow.pro | Admin@123456  |
| Demo Owner  | demo@messflow.pro  | Demo@123456   |

## Project Structure

```
app/[locale]/     Marketing, auth, portal, mess workspace, super-admin
actions/          Server Actions (CRUD, billing, admin)
components/       UI, dashboard, mobile nav, tables, forms
lib/              Auth, RBAC, billing, queries, validations
prisma/           Schema and seed data
messages/         i18n strings (en.json, bn.json)
docs/             Architecture and deployment notes
```

## Scripts

| Command            | Description                    |
|--------------------|--------------------------------|
| `npm run dev`      | Start development server       |
| `npm run build`    | Production build               |
| `npm run start`    | Run production server          |
| `npm run db:push`  | Push Prisma schema to database |
| `npm run db:seed`  | Seed plans, admin, demo data   |
| `npm run db:studio`| Open Prisma Studio             |

## Docker

```bash
docker-compose up -d
```

## Documentation

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for database design, auth flow, RBAC, and deployment guidance.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-change`)
3. Commit your changes (`git commit -m "Add my change"`)
4. Push to the branch (`git push origin feature/my-change`)
5. Open a Pull Request

## License

Proprietary — MessFlow Pro / Manage-your-mess
