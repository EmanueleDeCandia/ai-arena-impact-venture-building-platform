import type { ReactNode } from "react";
import { ensureSeeded, loadUsers } from "@/lib/loaders";
import { RoleProvider } from "@/components/role-provider";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  const users = await loadUsers();

  return (
    <RoleProvider users={users}>
      <div className="flex min-h-screen bg-transparent">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
