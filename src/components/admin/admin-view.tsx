"use client";

import { SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Container } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonationsAdmin } from "./donations-admin";
import { ProjectsAdmin } from "./projects-admin";
import { ActivitiesAdmin } from "./activities-admin";
import { CommitteeAdmin } from "./committee-admin";
import { SettingsAdmin } from "./settings-admin";

export function AdminView() {
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

  return (
    <Container className="grid gap-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">Administración</h1>
        <UserButton />
      </div>
      <Tabs defaultValue="donations">
        <TabsList className="w-full flex-nowrap justify-start overflow-x-auto sm:w-fit">
          <TabsTrigger value="donations">Donaciones</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="activities">Actividades</TabsTrigger>
          <TabsTrigger value="committee">Comité</TabsTrigger>
          <TabsTrigger value="settings">Ajustes</TabsTrigger>
        </TabsList>
        <TabsContent value="donations"><DonationsAdmin /></TabsContent>
        <TabsContent value="projects"><ProjectsAdmin /></TabsContent>
        <TabsContent value="activities"><ActivitiesAdmin /></TabsContent>
        <TabsContent value="committee"><CommitteeAdmin /></TabsContent>
        <TabsContent value="settings"><SettingsAdmin /></TabsContent>
      </Tabs>
    </Container>
  );
}
