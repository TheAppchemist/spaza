import { Platform } from "react-native";
import * as schema from "./schema";

let db: ReturnType<typeof import("drizzle-orm/expo-sqlite").drizzle> | ReturnType<typeof import("drizzle-orm/sql-js").drizzle> | null = null;
let isDbAvailable = false;
export let isElectronDb = false;

if (Platform.OS !== "web") {
  const { drizzle } = require("drizzle-orm/expo-sqlite");
  const { openDatabaseSync } = require("expo-sqlite");
  const expoDb = openDatabaseSync("accounting.db", { enableChangeListener: true });
  db = drizzle(expoDb, { schema });
  isDbAvailable = true;
}

export function setElectronDb(d) {
  db = d;
  isDbAvailable = true;
  isElectronDb = true;
}

export { isDbAvailable, db };
export * from "./schema";
