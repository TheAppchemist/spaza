import React from "react";
import { Box } from "@gluestack-ui/themed";
import { ProductForm } from "../components/ProductForm";

export function ProductFormScreen({ route, navigation }) {
  const editId = route?.params?.productId ?? null;

  return (
    <Box flex={1} bg="$white">
      <ProductForm
        productId={editId}
        onSuccess={() => navigation.goBack()}
        onCancel={() => navigation.goBack()}
      />
    </Box>
  );
}
