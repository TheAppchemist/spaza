import React, { useState, useCallback } from "react";
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
import { db } from "../db";
import { products } from "../db/schema";
import { isNull, isNotNull, eq } from "drizzle-orm";
import { useIsTablet } from "../hooks/useBreakpoint";
import { useDrizzleQuery } from "../hooks/useDrizzleQuery";
import { ProductForm } from "../components/ProductForm";

function ProductRow({ item, onEdit, onDelete, onRestore, showDeleted }) {
  const isDeleted = item.deletedAt != null;
  return (
    <Pressable
      onPress={() => !isDeleted && onEdit(item)}
      p="$3"
      borderBottomWidth={1}
      borderColor="$borderLight200"
    >
      <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
        <VStack flex={1} minW={120}>
          <Text fontWeight="$semibold">{item.name}</Text>
          <Text size="sm" color="$textLight600">
            Sell R{item.sellPrice?.toFixed(2)} · Cost R{item.costPrice?.toFixed(2)} · Stock {item.currentStock ?? 0}
          </Text>
        </VStack>
        {isDeleted && showDeleted ? (
          <Button size="sm" variant="outline" onPress={() => onRestore(item)}>
            <ButtonText>Restore</ButtonText>
          </Button>
        ) : !isDeleted ? (
          <Button size="sm" variant="outline" action="negative" onPress={() => onDelete(item)}>
            <ButtonText>Remove</ButtonText>
          </Button>
        ) : null}
        {isDeleted && <Badge action="muted" size="sm"><BadgeText>Deleted</BadgeText></Badge>}
      </HStack>
    </Pressable>
  );
}

export function ProductsScreen({ navigation }) {
  const [showDeleted, setShowDeleted] = useState(false);
  const isTablet = useIsTablet();
  const [panelMode, setPanelMode] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const { data: list, error, refetch } = useDrizzleQuery(
    () =>
      db.select().from(products).where(
        showDeleted ? isNotNull(products.deletedAt) : isNull(products.deletedAt)
      ),
    [showDeleted]
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleEdit = (product) => {
    if (isTablet) {
      setPanelMode("edit");
      setEditingId(product.id);
    } else {
      navigation.navigate("ProductForm", { productId: product.id });
    }
  };

  const handleAdd = () => {
    if (isTablet) {
      setPanelMode("add");
      setEditingId(null);
    } else {
      navigation.navigate("ProductForm", {});
    }
  };

  const handleClosePanel = () => {
    setPanelMode(null);
    setEditingId(null);
  };

  const handleDelete = async (product) => {
    if (!db) return;
    await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, product.id));
    refetch();
    if (isTablet && editingId === product.id) handleClosePanel();
  };

  const handleRestore = async (product) => {
    if (!db) return;
    await db.update(products).set({ deletedAt: null }).where(eq(products.id, product.id));
    refetch();
  };

  const handleFormSuccess = () => {
    refetch();
    handleClosePanel();
  };

  if (error) {
    return (
      <Box flex={1} p="$4" justifyContent="center">
        <Text color="$error500">Error loading products: {error.message}</Text>
      </Box>
    );
  }

  const listContent = (
    <Box flex={1} minWidth={isTablet ? 280 : undefined}>
      <Box p="$4" borderBottomWidth={1} borderColor="$borderLight200">
        <HStack justifyContent="space-between" alignItems="center" mb="$3">
          <Text fontSize="$xl" fontWeight="$bold">Products</Text>
          <Button onPress={handleAdd}>
            <ButtonText>Add product</ButtonText>
          </Button>
        </HStack>
        <Pressable onPress={() => setShowDeleted((v) => !v)}>
          <Text size="sm" color="$primary500">{showDeleted ? "Hide deleted" : "Show deleted"}</Text>
        </Pressable>
      </Box>

      {list.length === 0 ? (
        <Box flex={1} justifyContent="center" alignItems="center" p="$6">
          <Text color="$textLight600" textAlign="center">
            {showDeleted ? "No deleted products." : "No products yet. Tap “Add product” to add one."}
          </Text>
        </Box>
      ) : (
        <FlatList
          data={list}
          style={{ flex: 1 }}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductRow
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              showDeleted={showDeleted}
            />
          )}
        />
      )}
    </Box>
  );

  if (isTablet) {
    return (
      <Box flex={1} flexDirection="row" bg="$white">
        {listContent}
        <Box flex={1} borderLeftWidth={1} borderColor="$borderLight200" bg="$white">
          {panelMode ? (
            <ProductForm
              productId={editingId}
              onSuccess={handleFormSuccess}
              onCancel={handleClosePanel}
            />
          ) : (
            <Box flex={1} justifyContent="center" alignItems="center" p="$8">
              <Text color="$textLight500" textAlign="center">
                Select a product to edit or tap “Add product”.
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return <Box flex={1} bg="$white">{listContent}</Box>;
}
