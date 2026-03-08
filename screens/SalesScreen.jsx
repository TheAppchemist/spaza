import React, { useCallback } from "react";
import { Alert } from "react-native";
import {
  Box,
  VStack,
  Text,
  Button,
  ButtonText,
  FlatList,
  Pressable,
  HStack,
} from "@gluestack-ui/themed";
import { useFocusEffect } from "@react-navigation/native";
import { db, salesPeriods, salesEntries } from "../db";
import { desc, eq } from "drizzle-orm";
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

function PeriodRow({ item, onPress, onEdit, onDelete }) {
  return (
    <Box p="$3" borderBottomWidth={1} borderColor="$borderLight200">
      <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
        <Pressable flex={1} minWidth={120} onPress={() => onPress(item)}>
          <VStack>
            <Text fontWeight="$semibold">
              {item.label || `Period ${item.id}`}
            </Text>
            <Text size="sm" color="$textLight600">
              {formatDate(item.startDate)} – {formatDate(item.endDate)}
            </Text>
          </VStack>
        </Pressable>
        <HStack gap="$2">
          <Button size="sm" variant="outline" onPress={() => onEdit(item)}>
            <ButtonText>Edit</ButtonText>
          </Button>
          <Button size="sm" variant="outline" action="negative" onPress={() => onDelete(item)}>
            <ButtonText>Delete</ButtonText>
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
}

export function SalesScreen({ navigation }) {
  const { data: periods = [], error, refetch } = useDrizzleQuery(
    () => db.select().from(salesPeriods).orderBy(desc(salesPeriods.startDate)),
    []
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleNewPeriod = () => {
    navigation.navigate("NewPeriod");
  };

  const handlePeriodPress = (period) => {
    navigation.navigate("PeriodEntries", { periodId: period.id });
  };

  const handleEdit = (period) => {
    navigation.navigate("EditPeriod", { periodId: period.id });
  };

  const handleDelete = (period) => {
    Alert.alert(
      "Delete period?",
      "This will remove the period and all its sales entries. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!db) return;
            try {
              await db.delete(salesEntries).where(eq(salesEntries.salesPeriodId, period.id));
              await db.delete(salesPeriods).where(eq(salesPeriods.id, period.id));
              refetch();
            } catch (err) {
              console.error(err);
            }
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <Box flex={1} p="$4" justifyContent="center">
        <Text color="$error500">Error: {error.message}</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$white">
      <Box p="$4" borderBottomWidth={1} borderColor="$borderLight200">
        <Button onPress={handleNewPeriod}>
          <ButtonText>New period</ButtonText>
        </Button>
      </Box>
      {periods.length === 0 ? (
        <Box flex={1} p="$4" justifyContent="center">
          <Text color="$textLight600" textAlign="center">
            No sales periods yet. Create one to start recording sales.
          </Text>
        </Box>
      ) : (
        <FlatList
          data={periods}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PeriodRow
              item={item}
              onPress={handlePeriodPress}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        />
      )}
    </Box>
  );
}
