"use client";

import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CalendarDays, FolderHeart, HandCoins, Settings, Users } from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { clerkEnabled } from "@/lib/clerk-enabled";
import { Container } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonationsAdmin } from "./donations-admin";
import { ProjectsAdmin } from "./projects-admin";
import { ActivitiesAdmin } from "./activities-admin";
import { CommitteeAdmin } from "./committee-admin";
import { SettingsAdmin } from "./settings-admin";
import { AdminSummary } from "./admin-summary";

export function AdminView() {
  return clerkEnabled ? <AdminWithAuth /> : <AdminSetupNeeded />;
}

function AdminSetupNeeded() {
  return (
    <Container className="grid max-w-lg justify-items-start gap-4 py-16">
      <h1 className="text-3xl font-extrabold">Administración</h1>
      <p className="text-muted-foreground">
        Falta conectar Clerk para poder entrar. Agrega NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY y CLERK_SECRET_KEY en .env.local
        (ver README) y reinicia el sitio.
      </p>
    </Container>
  );
}

function AdminWithAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.admin.me, isAuthenticated ? {} : "skip");

  if (isLoading || (isAuthenticated && me === undefined)) {
    return <Container className="py-16"><div className="h-40 animate-pulse rounded-2xl bg-muted" /></Container>;
  }

  if (!isAuthenticated) {
    return (
      <Container className="grid max-w-lg justify-items-start gap-4 py-16">
        <h1 className="text-3xl font-extrabold">Administración</h1>
        <p className="text-muted-foreground">Entra con tu cuenta para manejar proyectos, actividades y donaciones.</p>
        <SignInButton mode="modal">
          <Button>Entrar</Button>
        </SignInButton>
      </Container>
    );
  }

  if (!me?.isAdmin) {
    return (
      <Container className="grid max-w-lg justify-items-start gap-4 py-16">
        <h1 className="text-3xl font-extrabold">Sin acceso</h1>
        <p className="text-muted-foreground">
          La cuenta {me?.email ?? ""} no está en la lista de administradores. Pide a Robert que la agregue.
        </p>
        <SignOutButton>
          <Button variant="outline">Salir</Button>
        </SignOutButton>
      </Container>
    );
  }

  return <AdminPanel />;
}

const SECTIONS = [
  { id: "actividades", label: "Actividades", icon: CalendarDays, Panel: ActivitiesAdmin },
  { id: "donaciones", label: "Donaciones", icon: HandCoins, Panel: DonationsAdmin },
  { id: "proyectos", label: "Proyectos", icon: FolderHeart, Panel: ProjectsAdmin },
  { id: "comite", label: "Comité", icon: Users, Panel: CommitteeAdmin },
  { id: "ajustes", label: "Ajustes", icon: Settings, Panel: SettingsAdmin },
] as const;

/** Sections live in the URL hash, so "Ver sitio" and back returns to the same one. */
export function AdminPanel() {
  const [tab, setTab] = useState<string>("actividades");
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      if (SECTIONS.some((s) => s.id === h)) setTab(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const change = (v: string) => {
    setTab(v);
    history.replaceState(null, "", `#${v}`);
  };

  return (
    <Container className="grid max-w-7xl gap-6 py-6 sm:py-8">
      <AdminSummary />
      <Tabs value={tab} onValueChange={change} orientation="vertical" className="min-w-0 gap-6 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-start">
        <TabsList
          aria-label="Secciones"
          className="w-full min-w-0 flex-nowrap justify-start overflow-x-auto lg:sticky lg:top-20 lg:grid lg:w-full lg:gap-1 lg:rounded-2xl lg:bg-card lg:p-2 lg:ring-1 lg:ring-border"
        >
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="inline-flex shrink-0 items-center gap-2 lg:w-full lg:justify-start lg:rounded-xl lg:py-2.5 lg:data-[state=active]:bg-primary lg:data-[state=active]:text-primary-foreground">
              <Icon className="size-4" /> {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map(({ id, Panel }) => (
          <TabsContent key={id} value={id} className="min-w-0"><Panel /></TabsContent>
        ))}
      </Tabs>
    </Container>
  );
}
