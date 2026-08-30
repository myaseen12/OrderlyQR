# OrderlyQR 🍽️ • Digital QR Menu & Kitchen Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Realtime-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**OrderlyQR** is an enterprise-grade, multi-tenant digital ordering and kitchen management platform designed for modern dining establishments. Guests scan table QR codes to view real-time digital menus and place orders without app downloads, while kitchen staff manage incoming tickets on a live digital Kitchen Display System (KDS/KOT) integrated with WhatsApp Cloud notifications.

---

## 🚀 Key Features

### 📱 Customer Guest Menu & Checkout
- **Contactless Table QR Access**: Table-specific QR verification (`?table=[token]`) locks orders directly to active dining tables.
- **Persistent Cart & Customizations**: Browser-side cart retention (`localStorage`) with item quantity controls, dish add-ons, and special preparation notes.
- **Zero-Trust Server-Side Pricing**: Prices and totals are computed strictly on the backend via Server Actions to prevent browser price manipulation.
- **Live Realtime Order Tracker**: Interactive timeline (`Order Received` ➔ `Accepted` ➔ `Preparing` ➔ `Ready` ➔ `Served`) powered by Supabase Realtime WebSocket subscriptions.

### 👨‍🍳 Kitchen Display System (KDS / KOT)
- **Kanban Board Workflow**: 4 distinct live columns (`NEW`, `PREPARING`, `READY`, `SERVED`).
- **One-Touch Actions**: Sequential status progression (`Accept` ➔ `Start Preparing` ➔ `Mark Ready` ➔ `Mark Served`) with instant ticket cancellation.
- **Visual Alert System**: Flashing amber warning badges for new tickets, red pulsing animations for delayed orders (>15m), and sound chimes.
- **Multi-Tenant Isolation**: RLS-enforced data boundaries ensuring kitchen staff only access their designated restaurant's orders.

### ⚡ Admin Console & Analytics
- **Live Performance Dashboard**: Sales revenue tracking, ticket counts, queue metrics, and recent activity logs.
- **Interactive Menu Manager**: Real-time category and dish creation, instant availability toggles, price updates, and drag-and-drop category/item ordering.
- **Table & QR Generator**: Dine-in table creation, unique token generation, and high-resolution printable table cards (`@media print` flyers).
- **Historical Orders Ledger**: Searchable historical database with print-ready receipt view modals.

### 💬 WhatsApp Cloud API Integration
- **Server-Side Architecture**: Isolated backend service (`src/utils/whatsapp.ts`) utilizing Meta WhatsApp Cloud API (`v20.0`).
- **Automated Dispatch**: Order receipts to customers, new ticket alerts to restaurant managers, and live cooking status updates.
- **Sandbox Fallback Mode**: Safe development mode that logs payloads when API keys are unconfigured, preventing checkout failures.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router with Server Components & Server Actions)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 + Custom Design Tokens (Vanilla CSS variables)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Auth, Storage)
- **Realtime**: Supabase Realtime Channels
- **QR Engine**: `qrcode` Node library
- **Icons & Effects**: Lucide React, Canvas Confetti

---

## 🏗️ Architecture

```
                               ┌─────────────────────────┐
                               │   Customer Mobile UI    │
                               │ (/menu/[slug]?table=X)  │
                               └────────────┬────────────┘
                                            │
                                 Server Action (placeOrder)
                                            │
                                            ▼
┌────────────────────────┐     ┌─────────────────────────┐     ┌────────────────────────┐
│  WhatsApp Cloud API    │ ◄───┤   Next.js Server Layer  ├───► │   Supabase Postgres    │
│  (Async Notifications) │     │ (Zero-Trust Validation) │     │ (RLS & Realtime Engine)│
└────────────────────────┘     └─────────────────────────┘     └───────────┬────────────┘
                                                                           │
                                                                 Realtime WebSockets
                                                                           │
                                                                           ▼
                                                               ┌────────────────────────┐
                                                               │  Kitchen KOT Console   │
                                                               │    (/admin/kitchen)    │
                                                               └────────────────────────┘
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Supabase Credentials (Required for Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# WhatsApp Cloud API Credentials (Optional for Dev, Required for Production WA)
WHATSAPP_API_TOKEN=your-meta-system-user-access-token
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
WHATSAPP_RESTAURANT_NOTIFICATION_NUMBER=+15550199
WHATSAPP_USE_TEMPLATES=false
```

*Note: If `NEXT_PUBLIC_SUPABASE_URL` contains placeholder text, the application automatically launches in **Sandbox Mock Mode** using in-memory databases.*

---

## 🗄️ Supabase Setup & Database Migrations

### 1. Initialize Supabase Schema
Execute the initial schema script in your Supabase SQL Editor:
- Location: [`supabase/schema.sql`](file:///d:/OrderlyQR/supabase/schema.sql)

### 2. Apply Storage Policies
Run the storage bucket setup script to enable image uploads:
- Location: [`supabase/migrations/20260830000000_storage_setup.sql`](file:///d:/OrderlyQR/supabase/migrations/20260830000000_storage_setup.sql)

### 3. Run Security & RLS Migration
Apply the security hardening migration:
- Location: [`supabase/migrations/20260830100000_security_fixes.sql`](file:///d:/OrderlyQR/supabase/migrations/20260830100000_security_fixes.sql)

---

## 💻 Local Development

1. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/your-org/orderly-qr.git
   cd orderly-qr
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Access Local Routes**:
   - Customer Menu: `http://localhost:3001/menu/bistro-rustique`
   - Admin Dashboard: `http://localhost:3001/admin`
   - Kitchen Display: `http://localhost:3001/admin/kitchen`

---

## 📦 Production Deployment (Vercel)

1. **Build Verification**:
   Ensure project compiles cleanly locally:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   - Import repository into Vercel.
   - Configure Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `WHATSAPP_API_TOKEN`, etc.).
   - Deploy!

---

## 📖 Operational Workflows

### 🍽️ Customer Ordering Flow
1. Guest scans QR code on dining table (`/menu/bistro-rustique?table=[token]`).
2. Guest selects items, customizes add-ons, and adjusts quantities.
3. Guest clicks **Review & Checkout**, optionally providing customer name and phone.
4. `placeOrderAction` validates prices server-side, generates receipt ticket `#T-1001`, and redirects to `/order/[orderId]`.
5. Customer views live cooking status updates via Realtime WebSockets.

### 👨‍🍳 Admin & Kitchen Operations
1. Manager logs into `/admin` to inspect real-time metrics and revenue.
2. Kitchen staff open `/admin/kitchen` on desktop or tablet KDS display.
3. New incoming orders trigger chime alerts and highlight in yellow under `NEW`.
4. Staff click `Accept` ➔ `Start Preparing` ➔ `Mark Ready` ➔ `Mark Served`.
5. WhatsApp notification engine automatically sends updates to the customer's phone!

---

## 🌐 Multi-Language (i18n & RTL) & PWA
- **Progressive Web App**: Configured manifest [`public/manifest.json`](file:///d:/OrderlyQR/public/manifest.json) and service worker [`public/sw.js`](file:///d:/OrderlyQR/public/sw.js) for installable home-screen menu experience.
- **English & Urdu Support**: Built-in language switcher (`EN` | `اردو`) on customer menus with native **RTL layout direction** (`dir="rtl"`) support.

---

## 💳 Payments, Feedback & Reservations
- **Payment Options**: Supports both `Counter / Cash` and `Online Pay` modes during checkout.
- **5-Star Order Feedback**: Customers can submit star ratings and food comments after their order is marked `Served`.
- **Table Reservation System**: Dedicated manager panel at `/admin/reservations` for approving/declining dining booking requests.

---

## 📊 Business Reporting & CI/CD
- **CSV Ledger Export**: Single-click CSV spreadsheet export for historical order logs.
- **GitHub Actions Quality Gate**: Automated type checks and production build validation workflow (`.github/workflows/ci.yml`).

---

## 🛡️ Backup & Disaster Recovery
- **Supabase Automatic Backups**: Daily PostgreSQL database backups managed natively via Supabase dashboard.
- **Manual Data Export**: Export table data as CSV/JSON directly from Supabase SQL Editor or Admin Ledger.

---

## 📄 License
Released under the MIT License. Developed with Next.js, Supabase, and Tailwind CSS.
