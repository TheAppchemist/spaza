import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Box, VStack, Text, Input, InputField, Button, ButtonText } from "@gluestack-ui/themed";
import { db, salesPeriods } from "../db";
import { DatePickerField } from "../components/DatePickerField";

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

export function NewPeriodScreen({ navigation }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(periodSchema),
    defaultValues: { startDate: "", endDate: "", label: "" },
  });

  const onSubmit = async (data) => {
    if (!db) return;
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const now = new Date();

    try {
      const existing = await db.select().from(salesPeriods);
      const overlaps = existing.some(
        (p) =>
          (p.startDate && p.endDate &&
            new Date(p.startDate).getTime() < end.getTime() &&
            new Date(p.endDate).getTime() > start.getTime())
      );
      if (overlaps) {
        setError("root", {
          type: "manual",
          message: "This period overlaps with an existing period.",
        });
        return;
      }

      await db.insert(salesPeriods).values({
        label: data.label?.trim() || null,
        startDate: start,
        endDate: end,
        createdAt: now,
      });
      navigation.goBack();
    } catch (err) {
      console.error(err);
      setError("root", { type: "manual", message: err?.message || "Failed to save period." });
    }
  };

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
          <ButtonText>Create period</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
