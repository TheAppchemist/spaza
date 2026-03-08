import React, { useMemo } from "react";
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
  HStack,
  ScrollView,
} from "@gluestack-ui/themed";
import { db, salesPeriods, salesEntries, products } from "../db";
import { eq, isNull } from "drizzle-orm";
import { useDrizzleQuery } from "../hooks/useDrizzleQuery";

function formatDate(d) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const quantityValue = z
  .union([z.string(), z.number()])
  .transform((v) => (v === "" ? 0 : Number(v)));

function buildEntriesSchema() {
  return z
    .object({
      quantities: z.record(z.string(), quantityValue),
    })
    .refine(
      (data) => {
        const vals = Object.values(data.quantities || {});
        return vals.every((n) => Number.isFinite(n) && n >= 0);
      },
      { message: "Quantities must be ≥ 0", path: ["quantities"] }
    )
    .refine(
      (data) => {
        const vals = Object.values(data.quantities || {});
        return vals.some((n) => Number(n) > 0);
      },
      { message: "Enter at least one quantity greater than 0", path: ["quantities"] }
    );
}

export function PeriodEntriesScreen({ route, navigation }) {
  const periodId = route?.params?.periodId;

  const { data: periods = [] } = useDrizzleQuery(
    () =>
      periodId
        ? db.select().from(salesPeriods).where(eq(salesPeriods.id, periodId))
        : Promise.resolve([]),
    [periodId]
  );
  const { data: activeProducts = [] } = useDrizzleQuery(
    () => db.select().from(products).where(isNull(products.deletedAt)),
    []
  );
  const { data: existingEntries = [] } = useDrizzleQuery(
    () =>
      periodId
        ? db.select().from(salesEntries).where(eq(salesEntries.salesPeriodId, periodId))
        : Promise.resolve([]),
    [periodId]
  );

  const period = periods[0];

  const defaultQuantities = useMemo(() => {
    const map = {};
    for (const p of activeProducts) {
      map[String(p.id)] = 0;
    }
    for (const e of existingEntries) {
      const key = String(e.productId);
      const current = map[key] ?? 0;
      map[key] = current + (e.quantitySold ?? 0);
    }
    return map;
  }, [activeProducts, existingEntries]);

  const oldQtyByProduct = useMemo(() => {
    const map = {};
    for (const e of existingEntries) {
      const key = String(e.productId);
      map[key] = (map[key] ?? 0) + (e.quantitySold ?? 0);
    }
    return map;
  }, [existingEntries]);

  const schema = useMemo(() => buildEntriesSchema(), []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { quantities: defaultQuantities },
    values: { quantities: defaultQuantities },
  });

  const onSubmit = async (data) => {
    if (!db || !periodId) return;
    const now = new Date();
    const quantities = data.quantities || {};

    try {
      for (const product of activeProducts) {
        const pid = String(product.id);
        const oldQty = oldQtyByProduct[pid] ?? 0;
        const newQty = Number(quantities[pid] ?? 0);
        if (oldQty === 0 && newQty === 0) continue;

        const rows = await db.select().from(products).where(eq(products.id, product.id));
        const currentStock = rows[0]?.currentStock ?? 0;
        const afterRestore = currentStock + oldQty;
        const afterSale = afterRestore - newQty;

        if (afterSale < 0) {
          setError("root", {
            type: "manual",
            message: `Not enough stock for "${product.name}". Current (after restoring period sales): ${afterRestore}, requested sale: ${newQty}.`,
          });
          return;
        }
      }

      for (const product of activeProducts) {
        const pid = String(product.id);
        const oldQty = oldQtyByProduct[pid] ?? 0;
        if (oldQty === 0) continue;
        const rows = await db.select().from(products).where(eq(products.id, product.id));
        const current = rows[0]?.currentStock ?? 0;
        await db
          .update(products)
          .set({ currentStock: current + oldQty, updatedAt: now })
          .where(eq(products.id, product.id));
      }

      await db.delete(salesEntries).where(eq(salesEntries.salesPeriodId, periodId));

      for (const product of activeProducts) {
        const qty = Number(quantities[String(product.id)] ?? 0);
        if (qty > 0) {
          await db.insert(salesEntries).values({
            salesPeriodId: periodId,
            productId: product.id,
            quantitySold: qty,
            createdAt: now,
            updatedAt: now,
          });
          const rows = await db.select().from(products).where(eq(products.id, product.id));
          const current = rows[0]?.currentStock ?? 0;
          await db
            .update(products)
            .set({ currentStock: Math.max(0, current - qty), updatedAt: now })
            .where(eq(products.id, product.id));
        }
      }
      if (navigation?.goBack) navigation.goBack();
    } catch (err) {
      console.error(err);
      setError("root", { type: "manual", message: err?.message || "Failed to save." });
    }
  };

  if (!period) {
    return (
      <Box flex={1} p="$4" justifyContent="center">
        <Text color="$textLight600">Loading…</Text>
      </Box>
    );
  }

  if (activeProducts.length === 0) {
    return (
      <Box flex={1} p="$4" bg="$white">
        <VStack gap="$2">
          <Text fontWeight="$semibold">{period.label || `Period ${period.id}`}</Text>
          <Text size="sm" color="$textLight600">
            {formatDate(period.startDate)} – {formatDate(period.endDate)}
          </Text>
          <Text size="sm" color="$textLight500" mt="$4">
            No active products. Add products first, then enter sales.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$white">
      <ScrollView flex={1} contentContainerStyle={{ padding: 16 }}>
        <VStack gap="$4">
          <VStack gap="$1">
            <Text fontWeight="$semibold">{period.label || `Period ${period.id}`}</Text>
            <Text size="sm" color="$textLight600">
              {formatDate(period.startDate)} – {formatDate(period.endDate)}
            </Text>
          </VStack>

          <Text size="sm" color="$textLight600">
            Quantity sold per product (enter 0 to leave out)
          </Text>

          <VStack gap="$3">
            {activeProducts.map((product) => (
              <HStack
                key={product.id}
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap="$2"
              >
                <Text flex={1} minWidth={120} numberOfLines={1}>
                  {product.name}
                </Text>
                <Box width={100}>
                  <Controller
                    control={control}
                    name={`quantities.${product.id}`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input size="sm">
                        <InputField
                          placeholder="0"
                          keyboardType="numeric"
                          value={value === undefined || value === null ? "" : String(value)}
                          onChangeText={(t) => onChange(t === "" ? "" : t)}
                          onBlur={onBlur}
                        />
                      </Input>
                    )}
                  />
                </Box>
              </HStack>
            ))}
          </VStack>

          {(errors.quantities || errors.root) && (
            <Text size="sm" color="$error500">
              {errors.quantities?.message || errors.root?.message}
            </Text>
          )}

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
            <ButtonText>Save sales</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
}
