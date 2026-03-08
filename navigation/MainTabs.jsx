import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "@gluestack-ui/themed";
import { AppStack } from "./AppStack";
import { StockStack } from "./StockStack";
import { SalesStack } from "./SalesStack";
import { ReportsStack } from "./ReportsStack";
import { useIsTablet } from "../hooks/useBreakpoint";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const isTablet = useIsTablet();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: isTablet ? { paddingVertical: 12, paddingTop: 12 } : undefined,
        tabBarLabel: ({ children, focused }) => (
          <Text size={isTablet ? "md" : "sm"} color={focused ? "$primary500" : "$textLight600"}>{children}</Text>
        ),
      }}
    >
      <Tab.Screen name="ProductsTab" component={AppStack} options={{ title: "Products" }} />
      <Tab.Screen name="StockTab" component={StockStack} options={{ title: "Stock" }} />
      <Tab.Screen name="SalesTab" component={SalesStack} options={{ title: "Sales" }} />
      <Tab.Screen name="ReportsTab" component={ReportsStack} options={{ title: "Reports" }} />
    </Tab.Navigator>
  );
}
