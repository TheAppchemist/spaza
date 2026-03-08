import React from "react";
import {
  Box,
  VStack,
  Text,
  ScrollView,
  Pressable,
} from "@gluestack-ui/themed";

const REPORT_OPTIONS = [
  { route: "ReportsPL", title: "P&L (Profit & Loss)", description: "Revenue, cost, gross profit and margin for a date range" },
  { route: "ReportsSalesByProduct", title: "Sales by product", description: "Quantity and revenue per product" },
  { route: "ReportsPeriodCompare", title: "Period comparison", description: "Compare two date ranges" },
  { route: "ReportsProductPerformance", title: "Product performance", description: "Revenue, cost, profit and margin by product" },
  { route: "ReportsGraphs", title: "Graphs", description: "Charts: revenue by period and by product" },
];

export function ReportsIndexScreen({ navigation }) {
  return (
    <ScrollView flex={1} contentContainerStyle={{ padding: 16 }} bg="$white">
      <Text size="sm" color="$textLight600" mb="$4">
        Choose a report to view.
      </Text>
      <VStack gap="$2">
        {REPORT_OPTIONS.map(({ route, title, description }) => (
          <Pressable
            key={route}
            onPress={() => navigation.navigate(route)}
            p="$4"
            rounded="$md"
            borderWidth={1}
            borderColor="$borderLight200"
            bg="$white"
            sx={{ ":active": { bg: "$backgroundLight100" } }}
          >
            <Text fontWeight="$semibold" size="md">
              {title}
            </Text>
            <Text size="sm" color="$textLight600" mt="$1">
              {description}
            </Text>
          </Pressable>
        ))}
      </VStack>
    </ScrollView>
  );
}
