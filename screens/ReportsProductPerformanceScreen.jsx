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
  Pressable,
} from "@gluestack-ui/themed";
import { getPresetRange, toDateString } from "../utils/reportUtils";
import { useReportSalesRows } from "../hooks/useReportSales";

export function ReportsProductPerformanceScreen() {
  const [preset, setPreset] = useState("this-month");
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [productPerfSort, setProductPerfSort] = useState("revenue");

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

  const { byProduct, error } = useReportSalesRows(rangeStart, rangeEnd);

  const sortedProductPerf = useMemo(() => {
    const arr = [...byProduct];
    const key = productPerfSort;
    arr.sort((a, b) => {
      if (key === "quantity") return b.quantity - a.quantity;
      if (key === "revenue") return b.revenue - a.revenue;
      if (key === "profit") return b.profit - a.profit;
      return b.margin - a.margin;
    });
    return arr;
  }, [byProduct, productPerfSort]);

  const hasData = byProduct.length > 0;

  return (
    <ScrollView flex={1} contentContainerStyle={{ padding: 16 }} bg="$white">
      <VStack gap="$4">
        <Text fontWeight="$semibold" size="lg">
          Product performance
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

        {error && <Text color="$error500">Error: {error.message}</Text>}

        <Pressable
          onPress={() => {
            const order = ["revenue", "quantity", "profit", "margin"];
            const i = order.indexOf(productPerfSort);
            setProductPerfSort(order[(i + 1) % order.length]);
          }}
          mb="$1"
        >
          <Text size="sm" color="$primary500">
            Sort by: {productPerfSort === "quantity" ? "Quantity" : productPerfSort === "revenue" ? "Revenue" : productPerfSort === "profit" ? "Profit" : "Margin %"}
          </Text>
        </Pressable>

        {!hasData && !error && (
          <Text size="sm" color="$textLight600">
            No product performance data in this date range.
          </Text>
        )}

        {hasData && (
          <VStack gap="$0">
            <HStack
              p="$2"
              bg="$backgroundLight100"
              borderBottomWidth={1}
              borderColor="$borderLight200"
            >
              <Text flex={1.5} size="xs" fontWeight="$semibold">
                Product
              </Text>
              <Text flex={0.6} size="xs" fontWeight="$semibold" textAlign="right">Qty</Text>
              <Text flex={0.9} size="xs" fontWeight="$semibold" textAlign="right">Revenue</Text>
              <Text flex={0.9} size="xs" fontWeight="$semibold" textAlign="right">Cost</Text>
              <Text flex={0.9} size="xs" fontWeight="$semibold" textAlign="right">Profit</Text>
              <Text flex={0.7} size="xs" fontWeight="$semibold" textAlign="right">Margin</Text>
            </HStack>
            {sortedProductPerf.map((row) => (
              <HStack
                key={row.productId}
                p="$2"
                borderBottomWidth={1}
                borderColor="$borderLight100"
              >
                <Text flex={1.5} size="xs" numberOfLines={1}>{row.name}</Text>
                <Text flex={0.6} size="xs" textAlign="right">{row.quantity}</Text>
                <Text flex={0.9} size="xs" textAlign="right">R {row.revenue.toFixed(2)}</Text>
                <Text flex={0.9} size="xs" textAlign="right">R {row.cost.toFixed(2)}</Text>
                <Text flex={0.9} size="xs" textAlign="right">R {row.profit.toFixed(2)}</Text>
                <Text flex={0.7} size="xs" textAlign="right">{row.margin.toFixed(0)}%</Text>
              </HStack>
            ))}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
