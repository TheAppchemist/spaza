import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    sellPrice: real("sell_price").notNull(),
    costPrice: real("cost_price").notNull(),
    currentStock: integer("current_stock").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
  }
);

export const stockMovements = sqliteTable(
  "stock_movements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    quantityDelta: integer("quantity_delta").notNull(),
    type: text("type", { enum: ["in", "out", "adjust"] }).notNull(),
    reason: text("reason"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  }
);

export const salesPeriods = sqliteTable(
  "sales_periods",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    label: text("label"),
    startDate: integer("start_date", { mode: "timestamp" }).notNull(),
    endDate: integer("end_date", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  }
);

export const salesEntries = sqliteTable(
  "sales_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    salesPeriodId: integer("sales_period_id")
      .notNull()
      .references(() => salesPeriods.id),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    quantitySold: integer("quantity_sold").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  }
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
export type SalesPeriod = typeof salesPeriods.$inferSelect;
export type NewSalesPeriod = typeof salesPeriods.$inferInsert;
export type SalesEntry = typeof salesEntries.$inferSelect;
export type NewSalesEntry = typeof salesEntries.$inferInsert;
