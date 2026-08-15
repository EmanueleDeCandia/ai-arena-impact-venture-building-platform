"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserDTO } from "@/lib/types";

type RoleState = {
  user: UserDTO;
  users: UserDTO[];
  setUserId: (id: number) => void;
};

const RoleCtx = createContext<RoleState | null>(null);

export function RoleProvider({ users, children }: { users: UserDTO[]; children: ReactNode }) {
  const fallback = users[0];
  const [userId, setUserId] = useState<number>(fallback?.id ?? 0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("impactforge-user");
      if (saved && users.some((u) => u.id === Number(saved))) {
        setUserId(Number(saved));
      }
    } catch {
      // localStorage non disponibile
    }
    setHydrated(true);
  }, [users]);

  const changeUser = (id: number) => {
    setUserId(id);
    try {
      localStorage.setItem("impactforge-user", String(id));
    } catch {
      // ignore
    }
  };

  const user = users.find((u) => u.id === userId) ?? fallback;

  if (!user) return null;

  return (
    <RoleCtx.Provider value={{ user, users, setUserId: changeUser }}>
      {hydrated ? children : children}
    </RoleCtx.Provider>
  );
}

export function useRole(): RoleState {
  const ctx = useContext(RoleCtx);
  if (!ctx) throw new Error("useRole deve essere usato dentro RoleProvider");
  return ctx;
}
