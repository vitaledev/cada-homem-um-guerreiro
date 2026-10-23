"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Session } from "@guerreiros/contracts";
import { session } from "@/lib/browser";
const Context = createContext<{
  value: Session | null;
  refresh: () => Promise<void>;
  set: (s: Session) => void;
}>({ value: null, refresh: async () => {}, set: () => {} });
export function SessionProvider({ children }: { children: ReactNode }) {
  const [value, set] = useState<Session | null>(null);
  const refresh = useCallback(async () => {
    set(await session());
  }, []);
  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);
  return (
    <Context.Provider value={{ value, refresh, set }}>
      {children}
    </Context.Provider>
  );
}
export const useSession = () => useContext(Context);
