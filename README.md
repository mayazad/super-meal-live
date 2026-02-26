# 🍽️ SuperMeal

> **Mess Management System** — A full-stack web app for managing shared meal costs, utility bills, and monthly finances for a group house (mess). Built and designed by **MayazAD**.

---

## ✨ Features

### 👤 Member Management
- Add / deactivate members
- Per-member meal and utility tracking

### 🛒 Bazaar-to-Balance Engine
- Log grocery purchases with an optional **"Paid By"** member
- When a member pays for bazaar, a **meal deposit is automatically created** for them — no double entry needed
- Two-step delete protection on all records

### 🍛 Daily Meals Ledger
- Log regular and guest meals per member per day with `+` / `−` controls
- **Monthly History table** — filtered by selected month, auto-refreshed via Supabase Realtime
- Upsert logic — go back to any past date and correct a record safely

### ⚡ Utility Payment Matrix
- Add utility bills (WiFi, Gas, Water, etc.) with optional due dates
- Grid view: toggle each member's payment status (Paid / Pending) per bill
- Optimistic UI updates with automatic rollback on error

### 💰 Deposits
- Log meal fund deposits and utility deposits separately per member
- All deposits feed into the per-member balance calculation

### 📊 Public Summary Page (`/summary/YYYY-MM`)
- **Shareable URL** — roommates view their own balances without logging in
- **Month navigation** — ‹ / › arrows to browse any past month
- **🔒 Lock badge** — locked months show a permanent archive indicator
- **⚠ Pending Collections** — banner listing all members with negative balances
- **Status badges** — `✓ In Credit` / `Needs to Pay` / `✓ Settled` per card
- **Meal Rate tooltip** — hover `(i)` to see the exact formula used
- **Expandable Meal Log** — per-member day-by-day meal history
- **Expandable Bill Details** — each bill's paid/pending status per member
- **Save Image** — exports the summary card as a PNG via `html-to-image`
- **Download Report** — exports a full `.xlsx` file with 4 tabs:
  - `Meals` — day-wise meal ledger
  - `Utilities` — payment matrix
  - `Deposits` — all fund deposits
  - `Summary` — final per-member balance sheet
- **My Statement** — per-member `.xlsx` download filtered to their own data
- **Copy Breakdown** — WhatsApp/Messenger-ready text summary
- **Share Link** — copies the summary URL to clipboard

### 🗂️ Month Archive (Admin Dashboard)
- Navigate to any past month via dropdown or ‹ / › arrows
- **12-month Yearly Overview chart** — CSS bar chart showing expenses & meal rate fluctuations
- **Lock Month** — confirmation modal before locking; prevents further editing
- **Copy Due List** — generates WhatsApp reminders for all members who owe money
- **View Report** — one-click link to the public summary for any month

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Animation | Framer Motion |
| Icons | Lucide React |
| Image Export | `html-to-image` |
| Excel Export | `xlsx` |

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** v18 or later → [nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js)
- A **Supabase** project → [supabase.com](https://supabase.com)

### 2. Clone the repo

```bash
git clone https://github.com/mayazad/super-meal.git
cd super-meal
```

### 3. Install dependencies

```bash
npm install
```

> This installs Next.js, React, Tailwind, Supabase client, Framer Motion, xlsx, html-to-image, lucide-react, and all other packages listed in `package.json`. `node_modules` is **not** committed to the repo — this step is required before running.

### 4. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of [`supabase/schema.sql`](./supabase/schema.sql) to create all tables and RLS policies
3. Go to **Project Settings → API** and copy your:
   - Project URL
   - `anon` public key

### 5. Configure environment variables

The `.env.local` file is included in this repo (private). If setting up fresh:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Admin access

- Navigate to `/admin/login`
- Sign in with the email/password you set up in Supabase Auth (Authentication → Users)

---

## 📁 Project Structure

```
superMeal/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── (protected)/          # Auth-gated admin pages
│   │   │   │   ├── dashboard/        # Overview + Archive + Lock Month
│   │   │   │   ├── groceries/        # Bazaar log + auto-credit
│   │   │   │   ├── meals/            # Daily meal counters + ledger
│   │   │   │   ├── members/          # Member management
│   │   │   │   ├── utilities/        # Utility bills + payment matrix
│   │   │   │   ├── meal-deposits/    # Meal fund deposits
│   │   │   │   └── utility-deposits/ # Utility fund deposits
│   │   │   └── login/                # Admin login page
│   │   ├── summary/[month_year]/     # Public summary (shareable)
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── utils/supabase/               # Supabase client/server helpers
│   └── proxy.ts                      # Middleware proxy config
├── supabase/
│   └── schema.sql                    # Full DB schema + RLS policies
├── .env.local                        # Environment variables
└── package.json
```

---

## 🗄️ Database Schema (Tables)

| Table | Purpose |
|---|---|
| `members` | Roommate profiles |
| `groceries` | Bazaar/grocery purchases (with `purchased_by` for auto-credit) |
| `daily_meals` | Per-member, per-day meal counts |
| `utilities` | Monthly utility bills |
| `utility_payments` | Per-member paid/pending status per bill |
| `meal_deposits` | Meal fund deposits (including auto-credits from bazaar) |
| `utility_deposits` | Utility fund deposits |
| `locked_months` | Months locked as permanent read-only archives |

---

## 🔐 Security

- All tables use **Row Level Security (RLS)** via Supabase
- Admin routes are protected by middleware session checks
- The public summary page is **read-only** — no authenticated writes possible from it

---

## 📄 License

Private project. All rights reserved.

---

<div align="center">
  <strong>Crafted with ❤️ by <a href="https://github.com/mayazad">MayazAD</a></strong><br/>
  <sub>SuperMeal — Making mess life a little less messy.</sub>
</div>
