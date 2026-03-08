import React, { useMemo, useState, useCallback } from "react";
import {
  Box,
  VStack,
  Text,
  Button,
  ButtonText,
  HStack,
  FlatList,
  Pressable,
  Badge,
  BadgeText,
} from "@gluestack-ui/themed";
import { useFocusEffect } from "@react-navigation/native";
import { db, products } from "../db";
import { isNull } from "drizzle-orm";
import { useIsTablet } from "../hooks/useBreakpoint";
import { useDrizzleQuery } from "../hooks/useDrizzleQuery";

// When a product has no lowStockThreshold set, we use this (show as low when stock below this).
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

function StockRow({ item, sortBy, isLow }) {
  return (
    <Box p="$3" borderBottomWidth={1} borderColor="$borderLight200" bg={isLow ? "$error50" : undefined}>
      <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
        <VStack flex={1} minW={120}>
          <Text fontWeight="$semibold">{item.name}</Text>
          <Text size="sm" color="$textLight600">
            Stock: {item.currentStock ?? 0}
            {` · Alert below ${item.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD}`}
          </Text>
        </VStack>
        {isLow && (
          <Badge action="error" size="sm">
            <BadgeText>Low stock</BadgeText>
          </Badge>
        )}
      </HStack>
    </Box>
  );
}

export function StockScreen({ navigation }) {
  const [sortBy, setSortBy] = useState("quantity");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const isTablet = useIsTablet();

  const { data: list = [], error, refetch } = useDrizzleQuery(
    () => db.select().from(products).where(isNull(products.deletedAt)),
    []
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const sortedAndFiltered = useMemo(() => {
    let result = [...list];
    if (lowStockOnly) {
      result = result.filter((p) => {
        const stock = p.currentStock ?? 0;
        const threshold = p.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
        return stock < threshold;
      });
    }
    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name ?? "").localeCompare(b.name ?? "");
      }
      return (a.currentStock ?? 0) - (b.currentStock ?? 0);
    });
    return result;
  }, [list, sortBy, lowStockOnly]);

  const isLow = (item) => {
    const stock = item.currentStock ?? 0;
    const threshold = item.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    return stock < threshold;
  };

  if (error) {
    return (
      <Box flex={1} p="$4" justifyContent="center">
        <Text color="$error500">Error: {error.message}</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$white" alignItems={isTablet ? "center" : undefined}>
      <Box width={isTablet ? "100%" : "100%"} maxWidth={isTablet ? 720 : undefined} flex={1}>
      <Box p="$4" borderBottomWidth={1} borderColor="$borderLight200">
        <HStack justifyContent="space-between" alignItems="center" mb="$3" flexWrap="wrap" gap="$2">
          <Text fontSize="$xl" fontWeight="$bold">Stock</Text>
          <HStack gap="$2">
            <Button size="sm" variant="outline" onPress={() => navigation.navigate("StockIn")}>
              <ButtonText>Stock in</ButtonText>
            </Button>
            <Button size="sm" variant="outline" onPress={() => navigation.navigate("StockOut")}>
              <ButtonText>Stock out</ButtonText>
            </Button>
          </HStack>
        </HStack>
        <HStack gap="$3" alignItems="center" flexWrap="wrap">
          <Pressable onPress={() => setSortBy((s) => (s === "quantity" ? "name" : "quantity"))}>
            <Text size="sm" color="$primary500">Sort: {sortBy === "quantity" ? "Quantity" : "Name"}</Text>
          </Pressable>
          <Pressable onPress={() => setLowStockOnly((v) => !v)}>
            <Text size="sm" color="$primary500">{lowStockOnly ? "Show all" : "Low stock only"}</Text>
          </Pressable>
        </HStack>
      </Box>

      {sortedAndFiltered.length === 0 ? (
        <Box flex={1} justifyContent="center" alignItems="center" p="$6">
          <Text color="$textLight600" textAlign="center">
            {lowStockOnly ? "No low-stock products." : "No products. Add products in the Products tab."}
          </Text>
        </Box>
      ) : (
        <FlatList
          data={sortedAndFiltered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <StockRow item={item} sortBy={sortBy} isLow={isLow(item)} />
          )}
        />
      )}
      </Box>
    </Box>
  );
}
