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
import { getPresetRange, toDateString } from "../utils/reportUtils";
import { useReportSalesRows } from "../hooks/useReportSales";

export function ReportsPLScreen() {
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

  const { rows, totals, error } = useReportSalesRows(rangeStart, rangeEnd);
  const hasData = rows.length > 0;

  return (
    <ScrollView flex={1} contentContainerStyle={{ padding: 16 }} bg="$white">
      <VStack gap="$4">
        <Text fontWeight="$semibold" size="lg">
          P&L (Profit & Loss)
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
            <Text size="sm">–</Text>
            <Input flex={1} size="sm">
              <InputField
                placeholder="To (YYYY-MM-DD)"
                value={toText || toDateString(range.end)}
                onChangeText={setToText}
              />
            </Input>
          </HStack>
        </Box>

        {error && (
          <Text color="$error500">Error: {error.message}</Text>
        )}

        {!hasData && !error && (
          <Text color="$textLight600">
            No sales data for this date range. Create periods and enter sales in the Sales tab.
          </Text>
        )}

        {hasData && (
          <VStack gap="$3" mt="$2">
            <HStack justifyContent="space-between">
              <Text color="$textLight600">Revenue</Text>
              <Text fontWeight="$semibold">R {totals.revenue.toFixed(2)}</Text>
            </HStack>
            <HStack justifyContent="space-between">
              <Text color="$textLight600">Cost</Text>
              <Text fontWeight="$semibold">R {totals.cost.toFixed(2)}</Text>
            </HStack>
            <HStack justifyContent="space-between">
              <Text color="$textLight600">Gross profit</Text>
              <Text fontWeight="$semibold">R {totals.profit.toFixed(2)}</Text>
            </HStack>
            <HStack justifyContent="space-between">
              <Text color="$textLight600">Gross margin</Text>
              <Text fontWeight="$semibold">{totals.margin.toFixed(1)}%</Text>
            </HStack>
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
