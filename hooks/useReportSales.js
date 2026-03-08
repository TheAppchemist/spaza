import { useMemo } from "react";
import { db, salesEntries, salesPeriods, products } from "../db";
import { eq, and, lt, gt } from "drizzle-orm";
import { useDrizzleQuery } from "./useDrizzleQuery";

/**
 * Sales rows and aggregates for a date range (periods overlapping range).
 * @param {{ start: Date, end: Date }} range - rangeStart (00:00:00) and rangeEnd (23:59:59)
 * @returns {{ rows: array, totals: { revenue, cost, profit, margin }, byProduct: array, error }}
 */
export function useReportSalesRows(rangeStart, rangeEnd) {
  const query = useMemo(
    () =>
      db
        .select({
          productId: products.id,
          productName: products.name,
          quantitySold: salesEntries.quantitySold,
          sellPrice: products.sellPrice,
          costPrice: products.costPrice,
          periodId: salesPeriods.id,
          periodStart: salesPeriods.startDate,
          periodLabel: salesPeriods.label,
        })
        .from(salesEntries)
        .innerJoin(salesPeriods, eq(salesEntries.salesPeriodId, salesPeriods.id))
        .innerJoin(products, eq(salesEntries.productId, products.id))
        .where(
          and(
            lt(salesPeriods.startDate, rangeEnd),
            gt(salesPeriods.endDate, rangeStart)
          )
        ),
    [rangeStart, rangeEnd]
  );

  const { data: rows = [], error } = useDrizzleQuery(() => query, [
    rangeStart.getTime(),
    rangeEnd.getTime(),
  ]);

  const totals = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    for (const r of rows) {
      const q = Number(r.quantitySold) || 0;
      revenue += q * (Number(r.sellPrice) || 0);
      cost += q * (Number(r.costPrice) || 0);
    }
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, cost, profit, margin };
  }, [rows]);

  const byProduct = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const id = r.productId;
      const name = r.productName ?? `Product ${id}`;
      const q = Number(r.quantitySold) || 0;
      const sell = Number(r.sellPrice) || 0;
      const costPrice = Number(r.costPrice) || 0;
      const rev = q * sell;
      const cost = q * costPrice;
      const existing = map.get(id);
      if (existing) {
        existing.quantity += q;
        existing.revenue += rev;
        existing.cost += cost;
      } else {
        map.set(id, { name, quantity: q, revenue: rev, cost });
      }
    }
    return Array.from(map.entries()).map(([id, v]) => {
      const profit = v.revenue - v.cost;
      const margin = v.revenue > 0 ? (profit / v.revenue) * 100 : 0;
      return { productId: id, ...v, profit, margin };
    });
  }, [rows]);

  const byPeriod = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const id = r.periodId;
      const start = r.periodStart;
      const label = r.periodLabel;
      const q = Number(r.quantitySold) || 0;
      const rev = q * (Number(r.sellPrice) || 0);
      const cost = q * (Number(r.costPrice) || 0);
      const existing = map.get(id);
      if (existing) {
        existing.revenue += rev;
        existing.cost += cost;
      } else {
        map.set(id, { periodId: id, periodStart: start, periodLabel: label, revenue: rev, cost });
      }
    }
    return Array.from(map.entries())
      .map(([, v]) => ({ ...v, profit: v.revenue - v.cost }))
      .sort((a, b) => (a.periodStart?.getTime?.() ?? 0) - (b.periodStart?.getTime?.() ?? 0));
  }, [rows]);

  return { rows, totals, byProduct, byPeriod, error };
}
