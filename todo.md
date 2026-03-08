# Spaza Shop Accounting App – Todo List

Use `[x]` to mark complete, `[ ]` for pending.

---

## 1. Setup

- [x] Install expo-sqlite
- [x] Remove or replace @libsql/client
- [x] Configure Drizzle to use SQLite adapter with expo-sqlite
- [x] Create db client module (open DB, get connection for Drizzle)

---

## 2. Schema

- [x] Define `products` table (id, name, sellPrice, costPrice, currentStock, lowStockThreshold, createdAt, updatedAt, deletedAt)
- [x] Define `stockMovements` table (id, productId, quantityDelta, type, reason, createdAt) – optional for audit trail
- [x] Define `salesPeriods` table (id, label, startDate, endDate, createdAt)
- [x] Define `salesEntries` table (id, salesPeriodId, productId, quantitySold, createdAt, updatedAt)
- [ ] Add indexes: salesEntries(salesPeriodId), salesEntries(productId), salesPeriods(startDate, endDate), products(deletedAt), stockMovements(productId)
- [x] Export schema from single source file

---

## 3. Migrations

- [x] Add drizzle.config.js (or .ts) for SQLite
- [x] Add npm script to generate migrations (e.g. `drizzle-kit generate`)
- [x] Add npm script to run migrations (e.g. `drizzle-kit migrate` or custom runner)
- [x] Generate initial migration from schema
- [x] Run migrations on app startup (before rendering main UI)
- [x] Handle migration errors gracefully (log, show user-friendly message)

---

## 4. Products – Add

- [x] Create Products screen / tab
- [x] Create Add Product form (name, sell price, cost price)
- [x] Validate: all fields required, prices ≥ 0
- [x] Wire form to Drizzle insert
- [x] Navigate back or show success after add
- [x] Show new product in list immediately

---

## 5. Products – Edit, Delete, List

- [x] List active products (exclude deletedAt)
- [x] Add optional filter to show soft-deleted products
- [x] Edit product: load existing values, update via Drizzle
- [x] Soft delete: set deletedAt, hide from default list
- [x] Restore: clear deletedAt
- [x] Prevent selecting deleted products in new sales entries

---

## 6. Stock – Management

- [x] Add initial stock when adding product (optional field)
- [x] Show current stock on product list/detail
- [x] Stock in: form (product, quantity, optional note/date), update product.currentStock (and optional stockMovements row)
- [x] Stock out: form (product, quantity, optional reason), decrease currentStock; validate quantity ≤ currentStock
- [x] Optional: per-product lowStockThreshold (edit product); validate threshold ≥ 0
- [x] Prevent negative stock (block or warn on stock out when result would be negative)

---

## 7. Stock – Report

- [x] Stock report screen or tab: list all products with current stock (and threshold if set)
- [x] Sort by quantity or name
- [x] Filter: show all / show low stock only (currentStock below threshold or below chosen value)
- [x] Display low-stock status (e.g. badge or row highlight)
- [x] Empty state when no products

---

## 8. Sales – Create Period

- [x] Create Sales screen / tab
- [x] Create “New period” flow: start date, end date, optional label
- [x] Validate: endDate ≥ startDate, no overlapping periods (or define overlap policy)
- [x] Save period via Drizzle
- [x] Show list of existing periods

---

## 9. Sales – Enter Quantities

- [x] For a period, show form with one row per active product
- [x] Input quantity sold per product (default 0)
- [x] Validate: quantities ≥ 0, at least one product with quantity > 0
- [x] Save salesEntries (salesPeriodId, productId, quantitySold)
- [x] Support editing: load existing entries, update on save

---

## 10. Sales – Edit / Delete Period

- [x] Edit period: change dates/label, update salesEntries
- [x] Delete period: remove period and its salesEntries (or soft delete if preferred)
- [x] Prevent duplicate/overlapping periods (or document allowed overlap)
- [x] Confirm before delete

---

## 11. Reports – P&L

- [x] Create Reports screen / tab
- [x] Date range selector (from, to)
- [x] Preset options: this week, this month, last month, all time
- [x] Query: sum revenue and cost for periods in range
- [x] Display: Revenue, Cost, Gross profit, Gross margin %
- [x] Handle empty data (no periods in range)

---

## 12. Reports – Sales by Product

- [x] Reuse date range selector from P&L
- [x] Query: per product, sum quantity and revenue in range
- [x] Display table: Product name, Quantity sold, Revenue
- [x] Sort by quantity or revenue (toggle)
- [x] Handle empty data

---

## 13. Reports – Period Comparison & Product Performance (Should-have)

- [x] Period comparison: select two periods, show Revenue/Cost/Profit for each + diff and % change
- [x] Product performance: per product over range, show quantity, revenue, cost, profit, margin %
- [x] Handle empty data for both

---

## 14. Navigation & Polish

- [x] Add tab or stack navigation (Products, Stock, Sales, Reports)
- [x] Empty states: no products, no periods, no data for report
- [x] Error handling: DB errors, validation errors, user-friendly messages
- [x] Loading states where async work happens

---

**Suggested order:** 1 → 2 → 3 (foundation), then 4–5 (products), 6–7 (stock), 8–10 (sales), 11–13 (reports), 14 (polish).
