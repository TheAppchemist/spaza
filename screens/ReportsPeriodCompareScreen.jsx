import React, { useMemo, useState } from "react";
import {
  Box,
  VStack,
  Text,
  HStack,
  ScrollView,
} from "@gluestack-ui/themed";
import { db, salesEntries, salesPeriods, products } from "../db";
import { eq, and, lt, gt } from "drizzle-orm";
import { useDrizzleQuery } from "../hooks/useDrizzleQuery";
import { DatePickerField } from "../components/DatePickerField";
import { defaultCompareRanges } from "../utils/reportUtils";

export function ReportsPeriodCompareScreen() {
  const defaults = useMemo(() => defaultCompareRanges(), []);
  const [rangeAStart, setRangeAStart] = useState(defaults.rangeAStart);
  const [rangeAEnd, setRangeAEnd] = useState(defaults.rangeAEnd);
  const [rangeBStart, setRangeBStart] = useState(defaults.rangeBStart);
  const [rangeBEnd, setRangeBEnd] = useState(defaults.rangeBEnd);

  const compareRangeAStart = useMemo(() => {
    const d = new Date(rangeAStart);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [rangeAStart]);
  const compareRangeAEnd = useMemo(() => {
    const d = new Date(rangeAEnd);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [rangeAEnd]);
  const compareRangeBStart = useMemo(() => {
    const d = new Date(rangeBStart);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [rangeBStart]);
  const compareRangeBEnd = useMemo(() => {
    const d = new Date(rangeBEnd);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [rangeBEnd]);

  const queryCompareA = useMemo(
    () =>
      db
        .select({
          quantitySold: salesEntries.quantitySold,
          sellPrice: products.sellPrice,
          costPrice: products.costPrice,
        })
        .from(salesEntries)
        .innerJoin(salesPeriods, eq(salesEntries.salesPeriodId, salesPeriods.id))
        .innerJoin(products, eq(salesEntries.productId, products.id))
        .where(
          and(
            lt(salesPeriods.startDate, compareRangeAEnd),
            gt(salesPeriods.endDate, compareRangeAStart)
          )
        ),
    [compareRangeAStart, compareRangeAEnd]
  );
  const queryCompareB = useMemo(
    () =>
      db
        .select({
          quantitySold: salesEntries.quantitySold,
          sellPrice: products.sellPrice,
          costPrice: products.costPrice,
        })
        .from(salesEntries)
        .innerJoin(salesPeriods, eq(salesEntries.salesPeriodId, salesPeriods.id))
        .innerJoin(products, eq(salesEntries.productId, products.id))
        .where(
          and(
            lt(salesPeriods.startDate, compareRangeBEnd),
            gt(salesPeriods.endDate, compareRangeBStart)
          )
        ),
    [compareRangeBStart, compareRangeBEnd]
  );

  const { data: rowsCompareA = [] } = useDrizzleQuery(() => queryCompareA, [
    compareRangeAStart.getTime(),
    compareRangeAEnd.getTime(),
  ]);
  const { data: rowsCompareB = [] } = useDrizzleQuery(() => queryCompareB, [
    compareRangeBStart.getTime(),
    compareRangeBEnd.getTime(),
  ]);

  const periodCompareTotals = useMemo(() => {
    let revA = 0, costA = 0, revB = 0, costB = 0;
    for (const r of rowsCompareA) {
      const q = Number(r.quantitySold) || 0;
      revA += q * (Number(r.sellPrice) || 0);
      costA += q * (Number(r.costPrice) || 0);
    }
    for (const r of rowsCompareB) {
      const q = Number(r.quantitySold) || 0;
      revB += q * (Number(r.sellPrice) || 0);
      costB += q * (Number(r.costPrice) || 0);
    }
    const profitA = revA - costA;
    const profitB = revB - costB;
    const diffRev = revB - revA;
    const diffCost = costB - costA;
    const diffProfit = profitB - profitA;
    const pctRev = revA !== 0 ? (diffRev / revA) * 100 : (revB !== 0 ? 100 : 0);
    const pctCost = costA !== 0 ? (diffCost / costA) * 100 : (costB !== 0 ? 100 : 0);
    const pctProfit = profitA !== 0 ? (diffProfit / profitA) * 100 : (profitB !== 0 ? 100 : 0);
    return {
      a: { revenue: revA, cost: costA, profit: profitA },
      b: { revenue: revB, cost: costB, profit: profitB },
      diff: { revenue: diffRev, cost: diffCost, profit: diffProfit },
      pct: { revenue: pctRev, cost: pctCost, profit: pctProfit },
    };
  }, [rowsCompareA, rowsCompareB]);

  return (
    <ScrollView flex={1} contentContainerStyle={{ padding: 16 }} bg="$white">
      <VStack gap="$4">
        <Text fontWeight="$semibold" size="lg">
          Period comparison
        </Text>
        <Text size="sm" color="$textLight600">
          Select two date ranges to compare Revenue, Cost and Profit.
        </Text>

        <Box>
          <Text size="sm" fontWeight="$semibold" mb="$2">Range A</Text>
          <HStack gap="$2" alignItems="flex-end" flexWrap="wrap">
            <Box flex={1} minWidth={120}>
              <DatePickerField
                label="From"
                value={rangeAStart}
                onChange={setRangeAStart}
              />
            </Box>
            <Box flex={1} minWidth={120}>
              <DatePickerField
                label="To"
                value={rangeAEnd}
                onChange={setRangeAEnd}
              />
            </Box>
          </HStack>
        </Box>
        <Box>
          <Text size="sm" fontWeight="$semibold" mb="$2">Range B</Text>
          <HStack gap="$2" alignItems="flex-end" flexWrap="wrap">
            <Box flex={1} minWidth={120}>
              <DatePickerField
                label="From"
                value={rangeBStart}
                onChange={setRangeBStart}
              />
            </Box>
            <Box flex={1} minWidth={120}>
              <DatePickerField
                label="To"
                value={rangeBEnd}
                onChange={setRangeBEnd}
              />
            </Box>
          </HStack>
        </Box>

        <VStack gap="$2" mt="$2">
          <HStack justifyContent="space-between" flexWrap="wrap">
            <Text size="sm" fontWeight="$semibold">
              Range A ({rangeAStart} – {rangeAEnd})
            </Text>
            <Text size="sm" color="$textLight600">
              Rev: R {periodCompareTotals.a.revenue.toFixed(2)} · Cost: R {periodCompareTotals.a.cost.toFixed(2)} · Profit: R {periodCompareTotals.a.profit.toFixed(2)}
            </Text>
          </HStack>
          <HStack justifyContent="space-between" flexWrap="wrap">
            <Text size="sm" fontWeight="$semibold">
              Range B ({rangeBStart} – {rangeBEnd})
            </Text>
            <Text size="sm" color="$textLight600">
              Rev: R {periodCompareTotals.b.revenue.toFixed(2)} · Cost: R {periodCompareTotals.b.cost.toFixed(2)} · Profit: R {periodCompareTotals.b.profit.toFixed(2)}
            </Text>
          </HStack>
          <Box mt="$2" p="$2" bg="$backgroundLight100" rounded="$sm">
            <Text size="sm" fontWeight="$semibold">Difference (B − A)</Text>
            <Text size="sm">
              Revenue: R {periodCompareTotals.diff.revenue.toFixed(2)} ({periodCompareTotals.pct.revenue >= 0 ? "+" : ""}{periodCompareTotals.pct.revenue.toFixed(0)}%)
            </Text>
            <Text size="sm">
              Cost: R {periodCompareTotals.diff.cost.toFixed(2)} ({periodCompareTotals.pct.cost >= 0 ? "+" : ""}{periodCompareTotals.pct.cost.toFixed(0)}%)
            </Text>
            <Text size="sm">
              Profit: R {periodCompareTotals.diff.profit.toFixed(2)} ({periodCompareTotals.pct.profit >= 0 ? "+" : ""}{periodCompareTotals.pct.profit.toFixed(0)}%)
            </Text>
          </Box>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
