import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  VStack,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  FlatList,
  Pressable,
} from "@gluestack-ui/themed";
import { db, products, stockMovements } from "../db";
import { isNull, eq } from "drizzle-orm";
import { useDrizzleQuery } from "../hooks/useDrizzleQuery";

const stockOutSchema = z.object({
  productId: z.number({ required_error: "Select a product" }),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  reason: z.string().optional(),
});

export function StockOutScreen({ navigation }) {
  const { data: activeProducts = [] } = useDrizzleQuery(
    () => db.select().from(products).where(isNull(products.deletedAt)),
    []
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
  } = useForm({
    resolver: zodResolver(stockOutSchema),
    defaultValues: { productId: undefined, quantity: "", reason: "" },
  });

  const productId = watch("productId");
  const selectedProduct = activeProducts.find((p) => p.id === productId);
  const currentStock = selectedProduct?.currentStock ?? 0;

  const onSubmit = async (data) => {
    if (!db) return;
    const qty = Number(data.quantity);
    if (qty > currentStock) {
      setError("quantity", { type: "manual", message: "Quantity cannot exceed current stock" });
      return;
    }
    const now = new Date();
    try {
      await db.insert(stockMovements).values({
        productId: data.productId,
        quantityDelta: -qty,
        type: "out",
        reason: data.reason || null,
        createdAt: now,
      });
      await db
        .update(products)
        .set({ currentStock: Math.max(0, currentStock - qty), updatedAt: now })
        .where(eq(products.id, data.productId));
      navigation.goBack();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box flex={1} p="$4" bg="$white">
      <VStack gap="$4">
        <Box>
          <Text size="sm" mb="$1">Product</Text>
          <Controller
            control={control}
            name="productId"
            render={({ field: { onChange, value } }) => (
              <Box maxHeight={120} borderWidth={1} borderColor="$borderLight300" rounded="$md">
                <FlatList
                  data={activeProducts}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => onChange(item.id)}
                      p="$2"
                      bg={value === item.id ? "$primary100" : "transparent"}
                    >
                      <Text>{item.name} (stock: {item.currentStock ?? 0})</Text>
                    </Pressable>
                  )}
                />
              </Box>
            )}
          />
          {errors.productId && (
            <Text size="sm" color="$error500" mt="$1">{errors.productId.message}</Text>
          )}
        </Box>

        <Box>
          <Text size="sm" mb="$1">Quantity to remove (current: {currentStock})</Text>
          <Controller
            control={control}
            name="quantity"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input>
                <InputField
                  placeholder="0"
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              </Input>
            )}
          />
          {errors.quantity && (
            <Text size="sm" color="$error500" mt="$1">{errors.quantity.message}</Text>
          )}
        </Box>

        <Box>
          <Text size="sm" mb="$1">Reason (optional)</Text>
          <Controller
            control={control}
            name="reason"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input>
                <InputField placeholder="e.g. Damaged" value={value} onChangeText={onChange} onBlur={onBlur} />
              </Input>
            )}
          />
        </Box>

        <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
          <ButtonText>Record stock out</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
