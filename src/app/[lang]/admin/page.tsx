import { Suspense } from "react";
import { AdminView } from "@/components/admin/admin-view";


export default function AdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  );
}
