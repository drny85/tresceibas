import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminView } from "@/components/admin/admin-view";

export const metadata: Metadata = { title: "Administración", robots: { index: false } };

export default function AdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  );
}
