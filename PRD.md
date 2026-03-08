# Product Requirements Document (PRD)
# Spaza Shop Accounting App

**Version:** 1.0  
**Last Updated:** March 2025  
**Status:** Draft

---

## 1. Overview

### 1.1 Purpose
A **Spaza Shop Accounting App** is an offline-first mobile application used to record sales, manage product catalog (with cost and sell price), and generate profit/loss and other business reports. The app is **not** used at the point of sale in the shop; it is used separately to capture aggregated sales data over chosen time periods and to analyse performance.

### 1.2 Target Users
- Spaza shop owners or staff who do bookkeeping
- Users who may have intermittent or no internet (offline-only usage)

### 1.3 Key Constraints
- **Expo only:** App is built and run with Expo (managed or dev-client); no eject to bare React Native.
- **Offline-only:** No cloud sync or online dependency; all data stored on device.
- **Data storage:** SQLite with Drizzle ORM.
- **Migrations:** Must support schema migrations for future changes.

---

## 2. Goals & Success Criteria

| Goal | Success Criteria |
|------|------------------|
| Reliable data entry | Users can add/edit products, record sales, and update stock without data loss. |
| Clear financial view | Reports accurately reflect profit, loss, sales, and stock levels over time. |
| Maintainable schema | Migrations run safely and can be versioned and replayed. |
| Usable offline | Full functionality without network; no blocking on sync. |

---

## 3. Features & Requirements

### 3.1 Product Management

| ID | Requirement | Priority |
|----|-------------|----------|
| P1 | **Add product:** Name, sell price, cost price. All required. | Must |
| P2 | **Edit product:** Update name, sell price, cost price. | Must |
| P3 | **Soft delete product:** Mark as removed (e.g. `deletedAt`); exclude from active lists and new sales entry; keep in DB for historical reports. | Must |
| P4 | **List products:** Show active products only by default; optional filter to show removed (for undo/audit). | Must |
| P5 | **Restore product:** Undo soft delete to make product active again. | Should |
| P6 | **Product identity:** Stable ID (e.g. UUID or auto-increment) for linking to sales. | Must |

**Data model (conceptual):**
- `id`, `name`, `sellPrice`, `costPrice`, `createdAt`, `updatedAt`, `deletedAt` (nullable).

---

### 3.2 Stock Management

| ID | Requirement | Priority |
|----|-------------|----------|
| ST1 | **Current stock:** Track quantity on hand per product (e.g. `currentStock` on product or derived from movements). | Must |
| ST2 | **Stock in:** Record restock/purchase – product, quantity added, optional date/note. Increases quantity on hand. | Must |
| ST3 | **Stock out:** Record manual deduction (e.g. damage, write-off) – product, quantity, optional reason. Decreases quantity on hand. | Should |
| ST4 | **Sales deduction (optional):** When recording period sales, optionally reduce current stock by quantity sold (or keep stock and sales independent; configurable or documented). | Could |
| ST5 | **Stock report:** View current stock per product; sort/filter. Show low-stock items (e.g. below a threshold). | Must |
| ST6 | **Low-stock threshold:** Optional per-product or global threshold; flag or list products below threshold. | Should |

**Data model (conceptual):**
- **products:** add `currentStock` (integer, default 0) and optionally `lowStockThreshold` (nullable integer).
- **stockMovements** (optional audit): `id`, `productId`, `quantityDelta` (+ or −), `type` (e.g. 'in' | 'out' | 'adjust'), `reason` (optional), `createdAt`. If omitted, only `currentStock` is updated on in/out.

---

### 3.3 Sales Input (Aggregated by Period)

| ID | Requirement | Priority |
|----|-------------|----------|
| S1 | **Record sales by period:** Input total quantity sold per product for a given time range (e.g. “Week 1–7 March” or “March 2025”), not individual transactions. | Must |
| S2 | **Period definition:** Support at least one of: date range (from–to), or single period label (e.g. week/month) with clear date bounds. | Must |
| S3 | **Per-product quantities:** For each period, user enters quantity sold per product (only active products shown). | Must |
| S4 | **Avoid duplicate periods:** Either prevent overlapping/duplicate period entries or clearly label and allow one “official” period type (e.g. weekly only). | Must |
| S5 | **Edit/delete period sales:** Edit or remove a period’s sales entry; recalculated reports should reflect changes. | Should |
| S6 | **Validation:** Quantities ≥ 0; period dates valid; at least one product with quantity > 0. | Must |

**Data model (conceptual):**
- **Period/session:** e.g. `salesPeriods`: `id`, `label` (optional), `startDate`, `endDate`, `createdAt`.
- **Line items:** e.g. `salesEntries`: `id`, `salesPeriodId`, `productId`, `quantitySold`, `createdAt` (and optionally `updatedAt`).

---

### 3.4 Reports

| ID | Report | Description | Priority |
|----|--------|-------------|----------|
| R1 | **Profit & Loss (P&L)** | For a chosen period (or all time): total revenue (quantity × sell price), total cost (quantity × cost price), **gross profit** (revenue − cost), and optionally gross margin %. | Must |
| R2 | **Sales by product** | For a chosen period: quantity sold and revenue per product; sortable by quantity or revenue. | Must |
| R3 | **Period comparison** | Compare two periods (e.g. this week vs last week): revenue, cost, profit, and optionally % change. | Should |
| R4 | **Product performance** | Per product over a date range: total quantity sold, revenue, cost, profit, margin %. | Should |
| R5 | **Time range selector** | All reports support: custom date range, preset (e.g. this week, this month, last month). | Must |
| R6 | **Export** | Export report data (e.g. CSV or simple text summary) for backup or use in other tools. | Could |
| R7 | **Stock report** | Current stock per product; list low-stock items (below threshold). Sort by quantity or name. | Must |

**Report rules:**
- Use **sell price** and **cost price** from product at time of report (or optionally at time of sale if you store snapshot; see Out of scope).  
- Only include products that are active at report time (or define policy for soft-deleted products in history).  
- Periods are defined by `salesPeriods`; report “for March” = all periods that fall within March.

---

### 3.5 Data Storage & Migrations

| ID | Requirement | Priority |
|----|-------------|----------|
| D1 | **SQLite:** All persistent data stored in a single SQLite database on device. | Must |
| D2 | **Drizzle ORM:** Use Drizzle for schema definition, queries, and type safety. | Must |
| D3 | **Migrations:** Use Drizzle Kit (or equivalent) to generate and run migrations; app must run pending migrations on startup (or via explicit flow) so schema is always up to date. | Must |
| D4 | **Migration safety:** Migrations must be reversible where possible (e.g. down migrations) and non-destructive (e.g. add column, don’t drop without deprecation). | Should |
| D5 | **Single source of truth:** Schema defined in code; migration files versioned in repo. | Must |

---

### 3.6 Offline & Reliability

| ID | Requirement | Priority |
|----|-------------|----------|
| O1 | **No network dependency:** App works fully without internet. | Must |
| O2 | **Local SQLite path:** Database file stored in app’s local storage via expo-sqlite. | Must |
| O3 | **No sync:** No cloud sync, no multi-device merge; single device only. | Must |
| O4 | **Backup (optional):** Option to export DB or key data (e.g. CSV) for user backup. | Could |

---

## 4. User Flows (High Level)

1. **Setup:** Open app → run migrations (automatic) → add products (name, cost, sell price, optional initial stock).
2. **Stock:** Record stock in (restock) and stock out (write-offs); view current stock and low-stock report.
3. **Ongoing:** When a period ends (e.g. end of day/week), create a “sales period” (e.g. 1–7 March), then enter quantity sold per product for that period.
4. **Reporting:** Open Reports → choose report type → date range (or stock report) → view P&L, sales by product, stock levels, etc.
5. **Maintenance:** Edit/soft-delete products as needed; edit/delete period sales if correction required.

---

## 5. Technical Stack (Expo Only)

| Layer | Choice | Notes |
|-------|--------|--------|
| App | **Expo only** | Expo (~55); no eject to bare React Native. Use Expo APIs and compatible libraries throughout. |
| DB | SQLite | Local file via **expo-sqlite** (Expo’s SQLite API). |
| ORM | Drizzle | Schema, queries, migrations via Drizzle Kit; use Drizzle’s SQLite adapter with expo-sqlite. |
| Migrations | Drizzle Kit | Generate and run migrations; run pending migrations on app startup. |

**Note:** For offline-only, use **expo-sqlite** as the SQLite driver. `@libsql/client` in current `package.json` targets remote SQLite (e.g. Turso) and should be removed or replaced with expo-sqlite when implementing the DB layer.

---

## 6. Data Model (Summary)

- **products:** id, name, sellPrice, costPrice, currentStock (default 0), lowStockThreshold (optional), createdAt, updatedAt, deletedAt.
- **stockMovements** (optional): id, productId, quantityDelta, type ('in'|'out'|'adjust'), reason (optional), createdAt.
- **salesPeriods:** id, label (optional), startDate, endDate, createdAt.
- **salesEntries:** id, salesPeriodId, productId, quantitySold, createdAt (updatedAt optional).

Indexes: `salesEntries(salesPeriodId)`, `salesEntries(productId)`, `salesPeriods(startDate, endDate)`, `products(deletedAt)`, `stockMovements(productId)` (if used).

---

## 7. Out of Scope (V1)

- Cloud sync, multi-device, or user accounts.
- Point-of-sale (POS) or barcode scanning.
- Per-transaction sales (only aggregated period sales).
- Storing sell/cost price at time of sale (reports use current product prices unless we add snapshot later).
- Multi-currency or multi-shop.
- In-app authentication (device is the boundary).

---

## 8. Future Considerations

- **Price snapshots:** Store sell/cost at time of sale for accurate historical P&L.
- **Categories:** Product categories for grouped reports.
- **Expenses:** Non-product expenses for fuller P&L.
- **Charts:** Simple charts for trends (e.g. profit over weeks).

---

## 9. Appendix: Report Definitions (Detail)

### 9.1 Profit & Loss (P&L)
- **Input:** Date range (from, to).
- **Logic:** Sum over all `salesEntries` in `salesPeriods` that overlap or fall within the range:  
  - Revenue = Σ (quantitySold × product.sellPrice)  
  - Cost = Σ (quantitySold × product.costPrice)  
  - Gross profit = Revenue − Cost  
  - Gross margin % = (Gross profit / Revenue) × 100 (if Revenue > 0).
- **Output:** Revenue, Cost, Gross profit, Gross margin %.

### 9.2 Sales by Product
- **Input:** Date range.
- **Logic:** For each product, sum quantity sold and revenue in that range (same period filter as above).
- **Output:** Table: Product name, Quantity sold, Revenue, (optional) Cost, Profit.

### 9.3 Period Comparison
- **Input:** Period A (e.g. 1–7 March), Period B (e.g. 8–14 March).
- **Output:** For each period: Revenue, Cost, Profit; and difference (absolute and %).

### 9.4 Stock Report
- **Input:** Optional low-stock filter (show only products where currentStock is below lowStockThreshold or below a chosen value).
- **Logic:** List products with currentStock (and lowStockThreshold if set). Sort by quantity or name.
- **Output:** Table: Product name, Current stock, Low-stock threshold (if set), Status (e.g. OK / Low).

---

**Document End**
