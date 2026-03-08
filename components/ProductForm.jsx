import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
} from "@gluestack-ui/themed";
import { db, products } from "../db";
import { eq } from "drizzle-orm";

export const productSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    sellPrice: z.coerce.number().min(0, "Sell price must be ≥ 0"),
    costPrice: z.coerce.number().min(0, "Cost price must be ≥ 0"),
    initialStock: z.union([z.string(), z.number()]).optional().transform((v) => {
      if (v === "" || v == null) return undefined;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    }),
    lowStockThreshold: z.union([z.string(), z.number()]).optional().transform((v) => {
      if (v === "" || v == null) return undefined;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    }),
  })
  .refine((d) => d.lowStockThreshold == null || d.lowStockThreshold >= 0, {
    message: "Threshold must be ≥ 0",
    path: ["lowStockThreshold"],
  });

export function ProductForm({ productId, onSuccess, onCancel }) {
  const isEditing = productId != null;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", sellPrice: "", costPrice: "", initialStock: "", lowStockThreshold: "" },
  });

  React.useEffect(() => {
    if (isEditing && db) {
      const run = async () => {
        const rows = await db.select().from(products).where(eq(products.id, productId));
        const p = rows[0];
        if (p) {
          reset({
            name: p.name,
            sellPrice: String(p.sellPrice),
            costPrice: String(p.costPrice),
            lowStockThreshold: p.lowStockThreshold != null ? String(p.lowStockThreshold) : "",
          });
        }
      };
      run();
    }
  }, [productId, isEditing, reset]);

  const onSubmit = async (data) => {
    if (!db) return;
    const now = new Date();
    try {
      const lowThresh = data.lowStockThreshold !== "" && data.lowStockThreshold != null ? Number(data.lowStockThreshold) : null;
      if (isEditing) {
        await db
          .update(products)
          .set({
            name: data.name,
            sellPrice: Number(data.sellPrice),
            costPrice: Number(data.costPrice),
            lowStockThreshold: lowThresh,
            updatedAt: now,
          })
          .where(eq(products.id, productId));
      } else {
        const initialStock = data.initialStock !== "" && data.initialStock != null ? Number(data.initialStock) : 0;
        await db.insert(products).values({
          name: data.name,
          sellPrice: Number(data.sellPrice),
          costPrice: Number(data.costPrice),
          currentStock: initialStock >= 0 ? initialStock : 0,
          lowStockThreshold: lowThresh,
          createdAt: now,
          updatedAt: now,
        });
      }
      onSuccess?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box flex={1} p="$4" bg="$white">
      <VStack gap="$4">
        <Box>
          <Text size="sm" mb="$1">Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input>
                <InputField placeholder="Product name" value={value} onChangeText={onChange} onBlur={onBlur} />
              </Input>
            )}
          />
          {errors.name && <Text size="sm" color="$error500" mt="$1">{errors.name.message}</Text>}
        </Box>

        <Box>
          <Text size="sm" mb="$1">Sell price</Text>
          <Controller
            control={control}
            name="sellPrice"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input>
                <InputField placeholder="0.00" keyboardType="decimal-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
              </Input>
            )}
          />
          {errors.sellPrice && <Text size="sm" color="$error500" mt="$1">{errors.sellPrice.message}</Text>}
        </Box>

        <Box>
          <Text size="sm" mb="$1">Cost price</Text>
          <Controller
            control={control}
            name="costPrice"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input>
                <InputField placeholder="0.00" keyboardType="decimal-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
              </Input>
            )}
          />
          {errors.costPrice && <Text size="sm" color="$error500" mt="$1">{errors.costPrice.message}</Text>}
        </Box>

        {!isEditing && (
          <Box>
            <Text size="sm" mb="$1">Initial stock (optional)</Text>
            <Controller
              control={control}
              name="initialStock"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input>
                  <InputField placeholder="0" keyboardType="number-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
                </Input>
              )}
            />
          </Box>
        )}

        <Box>
          <Text size="sm" mb="$1">Low stock threshold (optional)</Text>
          <Controller
            control={control}
            name="lowStockThreshold"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input>
                <InputField placeholder="Alert when below this" keyboardType="number-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
              </Input>
            )}
          />
          {errors.lowStockThreshold && <Text size="sm" color="$error500" mt="$1">{errors.lowStockThreshold.message}</Text>}
        </Box>

        <HStack gap="$3">
          <Button flex={1} onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
            <ButtonText>{isEditing ? "Save" : "Add product"}</ButtonText>
          </Button>
          {onCancel && (
            <Button flex={1} variant="outline" onPress={onCancel}>
              <ButtonText>Cancel</ButtonText>
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}
