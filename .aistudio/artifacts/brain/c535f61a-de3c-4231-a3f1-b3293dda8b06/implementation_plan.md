# Personal Finance Tracker — Native Mobile Application (iOS & Android)

A native personal finance mobile application for iOS and Android built with an Apple Clean minimalist design system, multi-currency support (KRW, USD, EUR, PKR), comprehensive offline persistence, interactive mobile device preview shell (iPhone 16 Pro, Pixel 9 Pro, Fullscreen), and a dedicated "Pending Charity to Give" commitment tracker.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core product and architectural choices were confirmed from your specifications:

- **Visual Theme & Aesthetic**: **Apple Clean** — Crisp iOS-inspired design system with light and dark mode, SF-style typography hierarchy, frosted glass navigation bars (`backdrop-blur-xl`), hairline dividers, and tactile $44\text{px}+$ touch targets.
- **Mobile Presentation Mode**: **Interactive Device Shell + Installable PWA** — Features a realistic top switcher to view the app inside an iPhone 16 Pro frame (with Dynamic Island and iOS home bar), a Google Pixel 9 Pro frame (with Android punch hole and gesture pill), or Edge-to-Edge full mobile screen. Fully compliant PWA manifest and service worker enable 1-tap installation directly to real iPhone and Android home screens.
- **Multi-Currency Engine**: Full support for **KRW (₩)**, **USD ($)**, **EUR (€)**, and **PKR (₨)**. Users can switch their active view currency with instant conversion, while preserving original transaction amounts and exchange rates.
- **Starter Accounts**: Pre-configured Checking (Bank), High-Yield Savings, Credit Card (with balance and credit limit), and Cash Wallet.
- **Dedicated Section — "Pending Charity to Give"**: A dedicated tracker for pledged charitable obligations (e.g. Zakat, Sadaqah, tithes, recurring donor pledges). Tracks total pledged, pending distribution, fulfilled payments, and quick-fulfill action converting a pending pledge into an account transfer/expense.

---

## 1. Overview & Core Concept

### What It Does
A privacy-first, offline-capable personal finance mobile application that empowers users to log income, expenses, and inter-account transfers in seconds, monitor category budgets, track credit card liabilities without double-counting, manage multi-currency holdings (KRW, USD, EUR, PKR), and oversee dedicated philanthropic commitments ("Pending Charity to Give").

### Target Audience & Persona
Individuals, multi-currency earners, and conscientious savers who want a fast, friction-free native mobile experience to manage daily spending, monitor multiple accounts, and ensure their pledged charitable gifts and zakat are tracked accurately.

### Key Value
- **Zero-Friction Daily Logging**: 3-tap transaction entry with smart category prediction, split-expenses, and receipt attachment.
- **Multi-Currency Accuracy**: Real-time decimal-safe conversion across KRW, USD, EUR, and PKR with unified net worth calculation.
- **Charity Stewardship**: Built-in dedication to track "Pending Charity to Give" separately from standard expenses until fulfilled.
- **Local-First & Resilient**: Works 100% offline via local storage with sync readiness, instant loading, and biometric-ready design.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Onboarding & First Launch**:
   - Welcome carousel introducing native features, quick currency selection (USD, EUR, KRW, PKR), monthly budget cycle date, and opening balances.
   - Quick seed data option or blank slate start.

2. **Daily Logging (The 3-Tap Journey)**:
   - Tap the central floating `+` button in the bottom navigation bar.
   - Enter amount on a numeric mobile keypad, select Income / Expense / Transfer, pick Category & Account.
   - Optional: Attach receipt photo, tags, or mark as "Charity Contribution".
   - Balances update immediately with tactile feedback.

3. **Pending Charity Stewardship**:
   - Dedicated dashboard widget and navigation sub-view showing "Pledged Charity", "Distributed", and "Pending to Give".
   - Add new pledge (e.g., Annual Zakat calculation, monthly orphan sponsorship, crisis relief commitment).
   - "Fulfill Pledge" button instantly records a corresponding transaction from Cash or Checking account, updating both the charity ledger and account balances without discrepancy.

4. **Budgets & Utilization**:
   - Visual progress rings for category spending (Groceries, Transport, Dining, Housing, Utilities).
   - Dynamic alert states: Normal (green/neutral), Warning (>80% amber), Over-budget (crimson).

5. **Multi-Currency Switcher**:
   - One-tap currency chip selector on the top dashboard bar to view total net worth in KRW, USD, EUR, or PKR with live exchange conversion.

### Visual Identity & Theme (Apple Clean)
- **Palette**:
  - Light Canvas: `#F2F2F7` (iOS system background), `#FFFFFF` (elevated grouped cards), hairline borders `#E5E5EA`.
  - Dark Canvas: `#000000` (deep OLED black), `#1C1C1E` (system elevated card), `#2C2C2E` (secondary card).
  - Accents: Apple Blue (`#007AFF`), Emerald Green (`#34C759` for income & fulfilled charity), Crimson (`#FF3B30` for expense), Amber (`#FF9500` for pending charity & budget warnings), Indigo (`#5856D6` for savings).
- **Typography**: Clean neo-grotesque sans (`Plus Jakarta Sans` / `SF Pro` fallbacks), tabular figures (`tabular-nums`) for currency values and dates.
- **Ergonomics & Safe Areas**:
  - iOS Dynamic Island & Android camera punch-out simulation.
  - Native bottom tab bar with 5 primary destinations (Home, Transactions, Charity, Budgets, Settings).
  - Minimum touch hitboxes $\ge 44\text{px}$.
  - Mobile bottom sheets for transaction entry and filters with grab handles.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale & Trade-Off |
| :--- | :--- | :--- |
| **Mobile Architecture** | React 19 + Tailwind CSS 4 + Vite PWA with Native Shell Simulators | Provides a zero-setup, instant preview of iOS (iPhone 16 Pro) and Android (Pixel 9 Pro) viewports, while remaining 100% installable as a standalone PWA on real devices and export-ready for Capacitor native builds. |
| **Data Persistence** | Local-First Reactive Store (IndexedDB / LocalStorage with schema migrations) | Ensures full offline functionality with zero network latency. All financial records, receipts, and budgets work without internet, with deterministic export/import JSON and CSV features. |
| **Currency Handling** | Central Multi-Currency Engine with base rates (USD, EUR, KRW, PKR) | Decimal-safe arithmetic avoiding floating-point rounding errors. Original amounts preserved alongside converted primary totals. |
| **Charity Section** | First-Class Module ("Pending Charity to Give") | Distinguishes between money *committed/pledged* to charity and actual cash outflows. Prevents inflating expenses until the donation is actually transferred, keeping accounting accurate. |
| **Credit Card Handling** | Liability Ledger (No Double Counting) | Purchases on credit cards increase card liability. Card payments transfer cash from checking to credit card, reducing debt without inflating expense metrics. |

---

## 4. Technical Architecture & Data Strategy

### System Component Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Device Frame Switcher                           │
│     [ iPhone 16 Pro ]      [ Pixel 9 Pro ]      [ Full Screen ]        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Native Mobile Container (Viewport)                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Status Bar (Battery, WiFi, Dynamic Island / Punch Hole, Clock)    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Header: Currency Toggle [USD|EUR|KRW|PKR] · Theme · Search       │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Active Screen (Scrollable, Safe Area Insets):                    │  │
│  │  • Home View (Balances, Net Worth, Cash Flow, Pending Charity)   │  │
│  │  • Transactions View (Filters, Search, Split, Receipts)          │  │
│  │  • Charity View (Pledged, Pending, Fulfilled, Quick Distribute)  │  │
│  │  • Budgets View (Category Bars, Over-budget Alerts, Rollover)    │  │
│  │  • Insights & More (Trends, Multi-Currency Rates, CSV/PDF Export)│  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Bottom Navigation Tab Bar (Home · Ledger · [+] · Charity · More) │  │
│  │ Home Indicator / Gesture Bar                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                 State & Business Logic Layer                           │
│  • AccountStore (Balances, Credit Limits, Transfers)                   │
│  • TransactionStore (Income, Expense, Split, Receipts, Tags)           │
│  • CharityStore (Pledges, Pending Ledger, Fulfillment Linkage)        │
│  • BudgetStore (Category Thresholds, Utilization Math)                 │
│  • CurrencyStore (Exchange Rates: USD ↔ EUR ↔ KRW ↔ PKR)               │
│  • OfflinePersistenceEngine (Auto-sync, localStorage / IndexedDB)      │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Data Models

- **Account**: `id`, `name`, `type` (`checking` | `savings` | `credit` | `cash`), `currency`, `balance`, `creditLimit`, `institution`, `icon`, `color`.
- **Transaction**: `id`, `type` (`income` | `expense` | `transfer`), `amount`, `currency`, `date`, `categoryId`, `accountId`, `toAccountId` (for transfers), `merchant`, `notes`, `receiptUrl` (base64 photo), `isCharity`, `charityPledgeId`, `createdAt`.
- **Category**: `id`, `name`, `type` (`expense` | `income`), `icon`, `color`, `isDefault`.
- **CharityPledge**: `id`, `title` (e.g. "Ramadan Zakat 2026", "Local Food Bank"), `pledgedAmount`, `currency`, `dueDate`, `status` (`pending` | `partially_fulfilled` | `fulfilled`), `fulfilledAmount`, `notes`.
- **Budget**: `id`, `categoryId`, `amount`, `currency`, `period` (`monthly` | `weekly`), `warningThreshold` (default 80%).

---

## 5. Implementation Roadmap (Phases 1 & 2 First)

### Phase 1: Mobile App Foundation & UI Shell
- Setup PWA manifest, service worker registration, and icons.
- Build the interactive Mobile Device Frame (iPhone 16 Pro, Pixel 9 Pro, Fullscreen) with realistic bezels, dynamic island, status bar, and native bottom tab bar.
- Implement Apple Clean light/dark theme toggle with persistent user preferences.
- Implement responsive touch-first layout with haptic touch feel and bottom sheet drawer.

### Phase 2: Accounts, Multi-Currency, Charity Ledger & Transactions
- Build the financial calculation engine (decimal-safe balance math, multi-currency converter for KRW, USD, EUR, PKR).
- Pre-seed accounts: Checking, High-Yield Savings, Credit Card, Cash Wallet.
- Implement the "Pending Charity to Give" ledger and fulfillment workflow.
- Build the 3-step native transaction modal with receipt attachment (camera/file upload emulation), category selector, split-tagging, and transfer mechanics.
- Add transaction filtering, search by merchant/note, and account ledger drill-down.
- Add unit tests via `node:test` verifying account balance math, transfer neutrality, credit card liability updates, and charity fulfillment calculations.
