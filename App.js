import { StatusBar } from "expo-status-bar";
import React, { Suspense, lazy, useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";
import { NavigationContainer } from "@react-navigation/native";
import { db, isDbAvailable, setElectronDb } from "./db";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "./drizzle/migrations";
import { initElectronDb, saveElectronDb } from "./db/electronDb";
import migrationSql from "./drizzle/0000_same_mac_gargan.sql";

const MainTabs = lazy(() => import("./navigation/MainTabs").then((m) => ({ default: m.MainTabs })));

const isElectron = typeof window !== "undefined" && window.electronPlatform === true;

function MigrationGate({ children }) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Migration error: {error.message}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loading}>Migration in progress...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return children;
}

export default function App() {
  const [electronDbReady, setElectronDbReady] = useState(false);

  useEffect(() => {
    if (isElectron && !isDbAvailable) {
      const sql = typeof migrationSql === "string" ? migrationSql : (migrationSql?.default ?? migrationSql);
      initElectronDb(sql, setElectronDb)
        .then(() => setElectronDbReady(true))
        .catch((e) => console.error("Electron DB init failed:", e));
    }
  }, []);

  useEffect(() => {
    if (!isElectron || !electronDbReady) return;
    const interval = setInterval(saveElectronDb, 15000);
    const onBeforeUnload = () => saveElectronDb();
    if (typeof window !== "undefined") window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isElectron, electronDbReady]);

  const dbReady = isDbAvailable || electronDbReady;

  if (!dbReady) {
    if (isElectron) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loading}>Loading database...</Text>
          <StatusBar style="auto" />
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Spaza Accounting</Text>
        <Text style={styles.subtitle}>
          This app runs on mobile. Use Expo Go on your device or an iOS/Android simulator.
        </Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (isElectron) {
    return (
      <GluestackUIProvider config={config}>
        <NavigationContainer>
          <Suspense fallback={<View style={styles.center}><ActivityIndicator size="large" /></View>}>
            <MainTabs />
          </Suspense>
        </NavigationContainer>
        <StatusBar style="auto" />
      </GluestackUIProvider>
    );
  }

  return (
    <GluestackUIProvider config={config}>
      <NavigationContainer>
        <MigrationGate>
          <Suspense fallback={<View style={styles.center}><ActivityIndicator size="large" /></View>}>
            <MainTabs />
          </Suspense>
        </MigrationGate>
      </NavigationContainer>
      <StatusBar style="auto" />
    </GluestackUIProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  loading: {
    marginTop: 16,
    fontSize: 14,
    color: "#666",
  },
  error: {
    color: "#c00",
    fontSize: 14,
    textAlign: "center",
  },
});
