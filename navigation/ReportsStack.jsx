import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ReportsIndexScreen } from "../screens/ReportsIndexScreen";
import { ReportsPLScreen } from "../screens/ReportsPLScreen";
import { ReportsSalesByProductScreen } from "../screens/ReportsSalesByProductScreen";
import { ReportsPeriodCompareScreen } from "../screens/ReportsPeriodCompareScreen";
import { ReportsProductPerformanceScreen } from "../screens/ReportsProductPerformanceScreen";
import { ReportsGraphsScreen } from "../screens/ReportsGraphsScreen";

const Stack = createNativeStackNavigator();

export function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="ReportsIndex"
        component={ReportsIndexScreen}
        options={{ title: "Reports" }}
      />
      <Stack.Screen
        name="ReportsPL"
        component={ReportsPLScreen}
        options={{ title: "P&L (Profit & Loss)" }}
      />
      <Stack.Screen
        name="ReportsSalesByProduct"
        component={ReportsSalesByProductScreen}
        options={{ title: "Sales by product" }}
      />
      <Stack.Screen
        name="ReportsPeriodCompare"
        component={ReportsPeriodCompareScreen}
        options={{ title: "Period comparison" }}
      />
      <Stack.Screen
        name="ReportsProductPerformance"
        component={ReportsProductPerformanceScreen}
        options={{ title: "Product performance" }}
      />
      <Stack.Screen
        name="ReportsGraphs"
        component={ReportsGraphsScreen}
        options={{ title: "Graphs" }}
      />
    </Stack.Navigator>
  );
}
