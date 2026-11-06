"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload, errorText } from "./fields";

type Member = Doc<"committee"> & { imageUrl: string | null };

function MemberRow({ m }: { m: Member }) {
  const save = useMutation(api.committee.save);
  const remove = useMutation(api.committee.remove);
  const [name, setName] = useState(m.name);
  const [es, setEs] = useState(m.role.es);
  const [en, setEn] = useState(m.role.en);
  const [order, setOrder] = useState(String(m.order));
  const [confirm, setConfirm] = useState(false);
  const dirty = name !== m.name || es !== m.role.es || en !== m.role.en || order !== String(m.order);

  const persist = async (imageId?: Id<"_storage"> | null) => {
    try {
      await save({ id: m._id, name, role: { es, en }, order: Number(order) || 0, imageId: imageId === null ? undefined : (imageId ?? m.imageId) });
      toast.success("Guardado.");
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <li className="grid gap-3 rounded-xl border border-border p-3">
      <div className="grid gap-2 md:grid-cols-[1.3fr_1fr_1fr_5rem]">
        <Input aria-label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <Input aria-label="Rol (español)" value={es} onChange={(e) => setEs(e.target.value)} placeholder="Rol" />
        <Input aria-label="Rol (inglés)" value={en} onChange={(e) => setEn(e.target.value)} placeholder="Role (English)" />
        <Input aria-label="Orden" inputMode="numeric" value={order} onChange={(e) => setOrder(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ImageUpload value={m.imageId} previewUrl={m.imageUrl} onChange={(id) => persist(id ?? null)} />
        <div className="flex gap-2">
          {dirty && <Button size="sm" onClick={() => persist()}>Guardar</Button>}
          {confirm ? (
            <Button size="sm" variant="destructive" onClick={async () => { await remove({ id: m._id }); }}>Confirmar</Button>
          ) : (
            <Button size="icon" variant="ghost" aria-label="Quitar miembro" onClick={() => setConfirm(true)}><Trash2 /></Button>
          )}
        </div>
      </div>
    </li>
  );
}

export function CommitteeAdmin() {
  const members = useQuery(api.committee.list);
  const save = useMutation(api.committee.save);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comité organizador</CardTitle>
        <CardDescription>Aparece en la página Nosotros.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <ul className="grid gap-3">
          {(members ?? []).map((m) => <MemberRow key={m._id} m={m} />)}
        </ul>
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => save({ name: "Nuevo miembro", role: { es: "", en: "" }, order: (members?.length ?? 0) + 1 }).catch((e) => toast.error(errorText(e)))}
        >
          <Plus /> Agregar miembro
        </Button>
      </CardContent>
    </Card>
  );
}
