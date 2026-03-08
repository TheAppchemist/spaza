import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Box, VStack, Text, Input, InputField, Button, ButtonText } from "@gluestack-ui/themed";
import { db, salesPeriods } from "../db";
import { DatePickerField } from "../components/DatePickerField";
import { eq } from "drizzle-orm";
import { useDrizzleQuery } from "../hooks/useDrizzleQuery";

const periodSchema = z
  .object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    label: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return !Number.isNaN(start) && !Number.isNaN(end) && end >= start;
    },
    { message: "End date must be on or after start date", path: ["endDate"] }
  );

function toDateString(d) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function EditPeriodScreen({ route, navigation }) {
  const periodId = route?.params?.periodId;
  const { data: periods = [] } = useDrizzleQuery(
    () =>
      periodId
        ? db.select().from(salesPeriods).where(eq(salesPeriods.id, periodId))
        : Promise.resolve([]),
    [periodId]
  );
  const period = periods[0];

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({
    resolver: zodResolver(periodSchema),
    defaultValues: { startDate: "", endDate: "", label: "" },
  });

  useEffect(() => {
    if (period) {
      reset({
        startDate: toDateString(period.startDate),
        endDate: toDateString(period.endDate),
        label: period.label ?? "",
      });
    }
  }, [period, reset]);

  const onSubmit = async (data) => {
    if (!db || !periodId) return;
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    try {
      const existing = await db.select().from(salesPeriods);
      const overlaps = existing.some(
        (p) =>
          p.id !== periodId &&
          p.startDate &&
          p.endDate &&
          new Date(p.startDate).getTime() < end.getTime() &&
          new Date(p.endDate).getTime() > start.getTime()
      );
      if (overlaps) {
        setError("root", {
          type: "manual",
          message: "This period overlaps with another period.",
        });
        return;
      }

      await db
        .update(salesPeriods)
        .set({
          label: data.label?.trim() || null,
          startDate: start,
          endDate: end,
        })
        .where(eq(salesPeriods.id, periodId));

      if (navigation?.goBack) navigation.goBack();
    } catch (err) {
      console.error(err);
      setError("root", { type: "manual", message: err?.message || "Failed to update period." });
    }
  };

  if (!period) {
    return (
      <Box flex={1} p="$4" justifyContent="center">
        <Text color="$textLight600">Loading…</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} p="$4" bg="$white">
      <VStack gap="$4">
        <Controller
          control={control}
          name="startDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <DatePickerField
              label="Start date"
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              errorMessage={errors.startDate?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="endDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <DatePickerField
              label="End date"
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              errorMessage={errors.endDate?.message}
            />
          )}
        />

        <Box>
          <Text size="sm" mb="$1">
            Label (optional)
          </Text>
          <Controller
            control={control}
            name="label"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input>
                <InputField
                  placeholder="e.g. March 2025"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              </Input>
            )}
          />
        </Box>

        {errors.root && (
          <Text size="sm" color="$error500">
            {errors.root.message}
          </Text>
        )}

        <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
          <ButtonText>Save changes</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
