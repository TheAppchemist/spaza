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

export function ReportsSalesByProductScreen() {
  const [preset, setPreset] = useState("this-month");
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [salesByProductSort, setSalesByProductSort] = useState("quantity");

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

  const sortedByProduct = useMemo(() => {
    const arr = [...byProduct];
    arr.sort((a, b) =>
      salesByProductSort === "quantity"
        ? b.quantity - a.quantity
        : b.revenue - a.revenue
    );
    return arr;
  }, [byProduct, salesByProductSort]);

  const hasData = byProduct.length > 0;

  return (
    <ScrollView flex={1} contentContainerStyle={{ padding: 16 }} bg="$white">
      <VStack gap="$4">
        <Text fontWeight="$semibold" size="lg">
          Sales by product
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
          onPress={() =>
            setSalesByProductSort((s) => (s === "quantity" ? "revenue" : "quantity"))
          }
          mb="$1"
        >
          <Text size="sm" color="$primary500">
            Sort by: {salesByProductSort === "quantity" ? "Quantity" : "Revenue"}
          </Text>
        </Pressable>

        {!hasData && !error && (
          <Text size="sm" color="$textLight600">
            No sales by product in this date range.
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
              <Text flex={2} size="sm" fontWeight="$semibold">
                Product
              </Text>
              <Text flex={1} size="sm" fontWeight="$semibold" textAlign="right">
                Qty
              </Text>
              <Text flex={1} size="sm" fontWeight="$semibold" textAlign="right">
                Revenue
              </Text>
            </HStack>
            {sortedByProduct.map((row) => (
              <HStack
                key={row.productId}
                p="$2"
                borderBottomWidth={1}
                borderColor="$borderLight100"
              >
                <Text flex={2} size="sm" numberOfLines={1}>
                  {row.name}
                </Text>
                <Text flex={1} size="sm" textAlign="right">
                  {row.quantity}
                </Text>
                <Text flex={1} size="sm" textAlign="right">
                  R {row.revenue.toFixed(2)}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
