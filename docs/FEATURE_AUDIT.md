# MessFlow Pro — Feature Audit & Gap Analysis

> **Note:** Screenshots were not attached to this session. This audit is based on the MessManager page list you provided, standard mess-management workflows in Bangladesh, and a full review of the current codebase.

---

## PHASE 1 — FEATURE AUDIT

### FOUND FEATURES (Implemented)

| Feature | Status | Location |
|---------|--------|----------|
| Dashboard (month summary, member cards) | ✅ Rebuilt | `/dashboard` |
| Add Deposit | ✅ | `/dashboard/deposits/add` |
| Add Meal | ✅ | `/dashboard/meals/add` |
| Add Cost | ✅ | `/dashboard/expenses/add` |
| Current Month | ✅ | `/dashboard/current-month` |
| All Months | ✅ | `/dashboard/months` |
| Start New Month | ✅ | `/dashboard/months/new` |
| Members list | ✅ | `/dashboard/members` |
| Add Member | ✅ | `/dashboard/members/add` |
| Change Manager | ✅ | `/dashboard/settings/manager` |
| Settings | ✅ | `/dashboard/settings` |
| Monthly Settlement | ✅ | `/dashboard/settlement` |
| PDF Reports (gated) | ⚠️ Partial | `/dashboard/reports` |
| Email + Password Auth | ✅ | `/login`, `/register` |
| Google Login | ✅ (if env set) | `/login` |
| Forgot Password | ⚠️ UI only | `/forgot-password` |
| RBAC (8 roles) | ✅ | `lib/rbac.ts` |
| Meal Rate calculation | ✅ | `lib/calculations.ts` |
| Due / Balance / Advance | ✅ | `lib/calculations.ts` |
| Multi-tenant (Mess) | ✅ | `prisma/schema.prisma` |
| Subscription plans | ✅ Schema | `lib/plans.ts` |
| Bangla + English | ✅ | `messages/` |
| Marketing site | ✅ | `/`, `/pricing`, etc. |

### HIDDEN FEATURES (In schema/code, not in main nav)

- Room / Bed management (`/dashboard/rooms`)
- Bazaar / Vendor (`/dashboard/bazaar`)
- Notice board (`/dashboard/notices`)
- Tasks (`/dashboard/tasks`)
- Visitors (`/dashboard/visitors`)
- AI insights (`/dashboard/ai`)
- Super admin (`/admin`)
- Invite join (`/dashboard/messes/join`)
- API + Webhooks (`/api/v1`, `/api/webhooks`)

### MISSING FEATURES (vs MessManager + SaaS spec)

| Feature | Priority |
|---------|----------|
| Screenshot-verified UI parity | P0 |
| Bulk meal entry (daily grid) | P0 |
| Member edit / delete / ban | P0 |
| PDF download (jspdf implementation) | P0 |
| Email verification flow | P1 |
| Notification center UI | P1 |
| Dark mode toggle | P1 |
| Global search | P1 |
| Pagination on tables | P1 |
| CSV / Excel export | P1 |
| Receipt upload | P1 |
| QR join code | P1 |
| PWA / offline | P2 |
| SMS / push notifications | P2 |
| Recurring expenses/deposits | P2 |
| Auto backup / restore | P2 |

### INCOMPLETE FEATURES

- **PDF Reports** — plan gating exists; file generation not wired
- **Forgot password** — form only, no email send
- **Deposit/Expense approval** — auto-approved on add (MessManager style); approval UI exists for pending items
- **Membership system** — plans in DB; Stripe/bKash billing not integrated
- **Feature gating** — `lib/features.ts` ready; not enforced on all routes

### DUPLICATE FEATURES

- `/dashboard` vs `/dashboard/current-month` — same data, different layout entry
- `/dashboard/analytics` vs `/dashboard` charts — overlap
- Expenses list vs Add Cost — separate pages (correct for MessManager)

### WORKFLOW DEPENDENCIES

```
Create Mess → Auto-create MessMonth (ACTIVE)
     ↓
Add Members → Add Meals / Costs / Deposits (scoped to current month)
     ↓
Auto-recalculate → Meal Rate → Member Due/Balance
     ↓
Settlement (snapshot) OR Start New Month (close + archive + new month)
     ↓
PDF Report (Pro+ plan)
```

### REQUIRED DATABASE ENTITIES

All present in Prisma: User, Mess, **MessMonth** (new), Member, Meal, MealEntry, Expense, Deposit, Transaction, Report, Subscription, Plan, etc.

### REQUIRED CALCULATIONS

| Formula | Implementation |
|---------|----------------|
| Meal Rate = Total Cost ÷ Total Meals | `calculateMealRate()` |
| Meal Cost = Meals × Rate | `calculateMealCost()` |
| Balance = Deposit − Meal Cost − Shared Share | `calculateBalance()` |
| Due = max(0, −Balance) | `calculateDue()` |
| Advance = max(0, Balance) | `calculateAdvance()` |
| Shared Cost / Member | `calculateSharedCostPerMember()` |

### REQUIRED USER ROLES

SUPER_ADMIN, ADMIN, MESS_OWNER, MESS_MANAGER, ASSISTANT_MANAGER, ACCOUNTANT, MEMBER, GUEST — all in `lib/rbac.ts`.

---

## FOUND / MISSING / RECOMMENDED

### FOUND FEATURES
Core MessManager workflow: dashboard, monthly cycle, deposits, meals, costs, members, manager change, settlement, multi-month history.

### MISSING FEATURES
Screenshot-level UI clone, bulk meal grid, working PDF, billing integration, notifications UI, dark mode, search/filters/pagination.

### RECOMMENDED FEATURES
1. Attach screenshots for pixel-parity pass (P0)
2. Bulk meal calendar (P0)
3. bKash subscription for Bangladesh (P1)
4. Command menu (⌘K) (P2)

---

## IMPLEMENTATION ROADMAP

### P0 — Critical
- [x] MessMonth model + monthly scoping
- [x] MessManager navigation + core pages
- [x] Calculation engine
- [ ] Bulk meal entry grid
- [ ] PDF generation endpoint
- [ ] Screenshot UI parity review

### P1 — Important
- [ ] Feature gating on all premium routes
- [ ] Email verification + password reset
- [ ] Notification center
- [ ] Dark mode
- [ ] Export CSV/Excel

### P2 — Nice to Have
- [ ] PWA
- [ ] AI forecasts (enhance existing `/dashboard/ai`)
- [ ] Auto backup

---

## FEATURE MATRIX (Abbreviated)

| Feature | Free | Pro | Business | Enterprise |
|---------|------|-----|----------|------------|
| Members | 10 | 30 | 100 | ∞ |
| Meal/Cost/Deposit | ✅ | ✅ | ✅ | ✅ |
| PDF Export | ❌ | ✅ | ✅ | ✅ |
| Excel Export | ❌ | ✅ | ✅ | ✅ |
| AI Analytics | ❌ | ❌ | ✅ | ✅ |
| Branches | ❌ | ❌ | ✅ | ✅ |
| API/Webhooks | ❌ | ❌ | ❌ | ✅ |

---

*Re-attach MessManager screenshots to complete visual parity audit (Phase 1 item marked P0).*
