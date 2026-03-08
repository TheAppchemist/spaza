import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProductsScreen } from "../screens/ProductsScreen";
import { ProductFormScreen } from "../screens/ProductFormScreen";

const Stack = createNativeStackNavigator();

export function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Products"
        component={ProductsScreen}
        options={{ title: "Products" }}
      />
      <Stack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={({ route }) => ({
          title: route?.params?.productId != null ? "Edit product" : "Add product",
        })}
      />
    </Stack.Navigator>
  );
}
