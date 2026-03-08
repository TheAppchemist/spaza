import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StockScreen } from "../screens/StockScreen";
import { StockInScreen } from "../screens/StockInScreen";
import { StockOutScreen } from "../screens/StockOutScreen";

const Stack = createNativeStackNavigator();

export function StockStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="StockReport" component={StockScreen} options={{ title: "Stock" }} />
      <Stack.Screen name="StockIn" component={StockInScreen} options={{ title: "Stock in" }} />
      <Stack.Screen name="StockOut" component={StockOutScreen} options={{ title: "Stock out" }} />
    </Stack.Navigator>
  );
}
