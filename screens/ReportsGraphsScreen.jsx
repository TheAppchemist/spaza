import React, { useMemo, useState } from "react";
import {
  Box,
  VStack,
  Text,
  HStack,
  Button,
  ButtonText,
  Input,
  InputField,
  ScrollView,
} from "@gluestack-ui/themed";
import { useWindowDimensions } from "react-native";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import { getPresetRange, toDateString } from "../utils/reportUtils";
import { useReportSalesRows } from "../hooks/useReportSales";

function formatPeriodLabel(p) {
  const start = p.periodStart instanceof Date ? p.periodStart : new Date(p.periodStart);
  const d = start.getDate();
  const m = start.getMonth() + 1;
  const y = start.getFullYear();
  return p.periodLabel ? `${p.periodLabel}` : `${d}/${m}`;
}

const CHART_COLORS = {
  revenue: "#22c55e",
  cost: "#ef4444",
  profit: "#3b82f6",
  barBg: "#f1f5f9",
};

function BarChartByProduct({ data, width, barHeight = 20, gap = 6 }) {
  if (!data || data.length === 0) return null;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const chartWidth = width - 80;
  const height = data.length * (barHeight + gap) + 30;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((item, i) => {
        const y = 20 + i * (barHeight + gap);
        const barW = maxRevenue > 0 ? (item.revenue / maxRevenue) * chartWidth : 0;
        const label = (item.name || `Product ${item.productId}`).slice(0, 12);
        return (
          <G key={item.productId}>
            <SvgText x={0} y={y + barHeight / 2 + 4} fontSize={10} fill="#64748b">
              {label}
            </SvgText>
            <Rect
              x={80}
              y={y}
              width={chartWidth}
              height={barHeight}
              rx={4}
              fill={CHART_COLORS.barBg}
            />
            <Rect
              x={80}
              y={y}
              width={barW}
              height={barHeight}
              rx={4}
              fill={CHART_COLORS.revenue}
            />
          </G>
        );
      })}
    </Svg>
  );
}

function BarChartByPeriod({ data, width, barWidth = 24, gap = 8 }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(
    ...data.flatMap((d) => [d.revenue, d.cost]),
    1
  );
  const chartWidth = width - 60;
  const groupWidth = barWidth * 2 + gap;
  const totalGroupWidth = data.length * groupWidth + (data.length - 1) * 10;
  const scale = totalGroupWidth <= chartWidth ? 1 : chartWidth / totalGroupWidth;
  const height = 180;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Y-axis line */}
      <Line x1={50} y1={20} x2={50} y2={height - 30} stroke="#e2e8f0" strokeWidth={1} />
      <Line x1={50} y1={height - 30} x2={width} y2={height - 30} stroke="#e2e8f0" strokeWidth={1} />
      {data.map((item, i) => {
        const x = 60 + i * (groupWidth + 10) * scale;
        const revH = maxVal > 0 ? (item.revenue / maxVal) * (height - 50) : 0;
        const costH = maxVal > 0 ? (item.cost / maxVal) * (height - 50) : 0;
        return (
          <G key={item.periodId}>
            <Rect
              x={x}
              y={height - 30 - revH}
              width={barWidth * scale}
              height={revH}
              rx={4}
              fill={CHART_COLORS.revenue}
            />
            <Rect
              x={x + barWidth * scale + gap}
              y={height - 30 - costH}
              width={barWidth * scale}
              height={costH}
              rx={4}
              fill={CHART_COLORS.cost}
            />
            <SvgText
              x={x + (barWidth * 2 + gap) * scale / 2 - 8}
              y={height - 12}
              fontSize={9}
              fill="#64748b"
            >
              {formatPeriodLabel(item)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export function ReportsGraphsScreen() {
  const { width: winWidth } = useWindowDimensions();
  const chartWidth = Math.min(winWidth - 32, 400);

  const [preset, setPreset] = useState("this-month");
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");

  const range = useMemo(() => getPresetRange(preset), [preset]);
  const fromDate = fromText ? new Date(fromText) : range.start;
  const toDate = toText ? new Date(toText) : range.end;

  const rangeStart = useMemo(() => {
    const d = fromDate instanceof Date ? fromDate : new Date(fromDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [fromDate]);
  const rangeEnd = useMemo(() => {
    const d = toDate instanceof Date ? toDate : new Date(toDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [toDate]);

  const { byProduct, byPeriod, totals, error } = useReportSalesRows(rangeStart, rangeEnd);

  const sortedByProduct = useMemo(() => {
    return [...byProduct].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [byProduct]);

  const hasData = byProduct.length > 0 || byPeriod.length > 0;

  return (
    <ScrollView flex={1} contentContainerStyle={{ padding: 16 }} bg="$white">
      <VStack gap="$5">
        <Text fontWeight="$semibold" size="lg">
          Graphs
        </Text>

        <Box>
          <Text size="sm" mb="$2" color="$textLight600">
            Date range
          </Text>
          <HStack gap="$2" flexWrap="wrap" mb="$2">
            {[
              { key: "this-week", label: "This week" },
              { key: "this-month", label: "This month" },
              { key: "last-month", label: "Last month" },
              { key: "all-time", label: "All time" },
            ].map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                variant={preset === key ? "solid" : "outline"}
                onPress={() => {
                  setPreset(key);
                  setFromText("");
                  setToText("");
                }}
              >
                <ButtonText>{label}</ButtonText>
              </Button>
            ))}
          </HStack>
          <HStack gap="$2" alignItems="center">
            <Input flex={1} size="sm">
              <InputField
                placeholder="From (YYYY-MM-DD)"
                value={fromText || toDateString(range.start)}
                onChangeText={setFromText}
              />
            </Input>
            <Text size="sm">-</Text>
            <Input flex={1} size="sm">
              <InputField
                placeholder="To (YYYY-MM-DD)"
                value={toText || toDateString(range.end)}
                onChangeText={setToText}
              />
            </Input>
          </HStack>
        </Box>

        {error && <Text color="$error500">Error: {error.message}</Text>}

        {!hasData && !error && (
          <Text color="$textLight600">
            No sales data for this date range. Create periods and enter sales in the Sales tab.
          </Text>
        )}

        {hasData && (
          <>
            <Box>
              <Text size="sm" fontWeight="$semibold" mb="$2" color="$textLight600">
                Revenue & cost by period
              </Text>
              <Box bg="$backgroundLight50" p="$3" rounded="$md">
                <BarChartByPeriod data={byPeriod} width={chartWidth} />
              </Box>
              <HStack gap="$4" mt="$2">
                <HStack alignItems="center" gap="$1">
                  <Box w="$3" h="$3" rounded="$sm" bg={CHART_COLORS.revenue} />
                  <Text size="xs" color="$textLight600">Revenue</Text>
                </HStack>
                <HStack alignItems="center" gap="$1">
                  <Box w="$3" h="$3" rounded="$sm" bg={CHART_COLORS.cost} />
                  <Text size="xs" color="$textLight600">Cost</Text>
                </HStack>
              </HStack>
            </Box>

            <Box>
              <Text size="sm" fontWeight="$semibold" mb="$2" color="$textLight600">
                Revenue by product (top 10)
              </Text>
              <Box bg="$backgroundLight50" p="$3" rounded="$md">
                <BarChartByProduct
                  data={sortedByProduct}
                  width={chartWidth}
                  barHeight={18}
                  gap={6}
                />
              </Box>
            </Box>

            <Box p="$3" bg="$backgroundLight100" rounded="$md">
              <Text size="sm" fontWeight="$semibold" mb="$2">Summary</Text>
              <Text size="sm">Revenue: R {totals.revenue.toFixed(2)}</Text>
              <Text size="sm">Cost: R {totals.cost.toFixed(2)}</Text>
              <Text size="sm">Profit: R {totals.profit.toFixed(2)} ({totals.margin.toFixed(0)}% margin)</Text>
            </Box>
          </>
        )}
      </VStack>
    </ScrollView>
  );
}
