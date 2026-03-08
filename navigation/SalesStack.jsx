import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SalesScreen } from "../screens/SalesScreen";
import { NewPeriodScreen } from "../screens/NewPeriodScreen";
import { EditPeriodScreen } from "../screens/EditPeriodScreen";
import { PeriodEntriesScreen } from "../screens/PeriodEntriesScreen";

const Stack = createNativeStackNavigator();

export function SalesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="Sales" component={SalesScreen} options={{ title: "Sales" }} />
      <Stack.Screen name="NewPeriod" component={NewPeriodScreen} options={{ title: "New period" }} />
      <Stack.Screen name="EditPeriod" component={EditPeriodScreen} options={{ title: "Edit period" }} />
      <Stack.Screen
        name="PeriodEntries"
        component={PeriodEntriesScreen}
        options={{ title: "Enter sales" }}
      />
    </Stack.Navigator>
  );
}
