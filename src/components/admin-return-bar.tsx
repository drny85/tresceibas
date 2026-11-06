"use client";

import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { LayoutDashboard } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useQuery } from "@/hooks/use-live-query";
import { useI18n } from "@/i18n/provider";
import { clerkEnabled } from "@/lib/clerk-enabled";

/** A thin bar on the public site, only for signed-in admins, leading back to the panel. */
export function AdminReturnBar() {
  return clerkEnabled ? <Bar /> : null;
}

function Bar() {
  const { locale } = useI18n();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.admin.me, isAuthenticated ? {} : "skip");
  if (!me?.isAdmin) return null;
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-1.5 pr-[max(1rem,env(safe-area-inset-right,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] text-xs">
        <p className="min-w-0 truncate opacity-85">
          {locale === "es" ? "Estás viendo el sitio como lo ven los visitantes." : "You are seeing the site as visitors see it."}
        </p>
        <Link href={`/${locale}/admin`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold hover:bg-white/25">
          <LayoutDashboard className="size-3.5" /> {locale === "es" ? "Ir al panel" : "Go to admin"}
        </Link>
      </div>
    </div>
  );
}
