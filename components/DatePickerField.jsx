import React, { useState } from "react";
import { Platform } from "react-native";
import { Box, Text, Input, InputField, Pressable } from "@gluestack-ui/themed";

function toDateString(d) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateString(s) {
  if (!s || typeof s !== "string") return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Cross-platform date field: calendar picker on web/Electron (input type="date"),
 * native date picker on iOS/Android.
 */
export function DatePickerField({ value, onChange, onBlur, label, errorMessage }) {
  const [showNativePicker, setShowNativePicker] = useState(false);
  const dateObj = parseDateString(value) || new Date();
  const displayValue = value ? toDateString(value) : "";

  const handleChange = (nextDate) => {
    if (nextDate) onChange(toDateString(nextDate));
    setShowNativePicker(false);
  };

  if (Platform.OS === "web") {
    return (
      <Box>
        {label ? (
          <Text size="sm" mb="$1">
            {label}
          </Text>
        ) : null}
        <input
          type="date"
          value={displayValue}
          onChange={(e) => onChange(e.target.value || "")}
          onBlur={onBlur}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 16,
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            boxSizing: "border-box",
          }}
        />
        {errorMessage ? (
          <Text size="sm" color="$error500" mt="$1">
            {errorMessage}
          </Text>
        ) : null}
      </Box>
    );
  }

  let DateTimePicker;
  try {
    DateTimePicker = require("@react-native-community/datetimepicker").default;
  } catch {
    DateTimePicker = null;
  }

  return (
    <Box>
      {label ? (
        <Text size="sm" mb="$1">
          {label}
        </Text>
      ) : null}
      <Pressable onPress={() => DateTimePicker && setShowNativePicker(true)}>
        <Input pointerEvents="none" editable={false}>
          <InputField
            placeholder="Tap to pick date"
            value={displayValue}
            placeholderTextColor="#94a3b8"
          />
        </Input>
      </Pressable>
      {showNativePicker && DateTimePicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (event.type === "set") handleChange(selectedDate);
            else setShowNativePicker(false);
          }}
        />
      )}
      {errorMessage ? (
        <Text size="sm" color="$error500" mt="$1">
          {errorMessage}
        </Text>
      ) : null}
    </Box>
  );
}
