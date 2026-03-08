import { useState, useEffect, useCallback, useMemo } from "react";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { isElectronDb } from "../db";

/**
 * Use a Drizzle query with live updates on native (expo-sqlite) or refetch on Electron (sql.js).
 * @param getQuery - Function that returns the query builder, e.g. () => db.select().from(products)
 * @param deps - Dependency array for when to refetch (Electron) or re-run (native)
 * @returns {{ data: unknown[], error: Error | undefined, refetch: function }}
 */
export function useDrizzleQuery(getQuery, deps = []) {
  const query = useMemo(() => getQuery(), deps);

  if (isElectronDb) {
    const [data, setData] = useState(undefined);
    const [error, setError] = useState(undefined);
    const refetch = useCallback(async () => {
      try {
        const result = await getQuery();
        const rows = Array.isArray(result) ? result : (result?.rows ?? result?.values ?? []);
        setData(Array.isArray(rows) ? rows : []);
        setError(undefined);
      } catch (e) {
        setError(e);
      }
    }, deps);
    useEffect(() => {
      refetch();
    }, deps);
    return { data: data ?? [], error, refetch };
  }

  const result = useLiveQuery(query, deps);
  const rawList = result?.data;
  const list = Array.isArray(rawList) ? rawList : [];
  return { data: list, error: result?.error, refetch: () => {} };
}
