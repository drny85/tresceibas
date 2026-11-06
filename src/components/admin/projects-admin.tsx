"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BilingualField, Field, ImageUpload, Select, emptyText, errorText, parseMoney, type I18nText } from "./fields";
import { formatDop, percent } from "@/lib/format";

type Project = FunctionReturnType<typeof api.projects.listAll>[number];
type Status = "draft" | "active" | "completed";
type Draft = {
  id?: Id<"projects">;
  slug: string;
  title: I18nText;
  summary: I18nText;
  description: I18nText;
  goal: string;
  uses: { label: I18nText; amount: string }[];
  imageId?: Id<"_storage">;
  imageUrl?: string | null;
  status: Status;
  featured: boolean;
  order: string;
};

const fromProject = (p: Project): Draft => ({
  id: p._id,
  slug: p.slug,
  title: p.title,
  summary: p.summary,
  description: p.description,
  goal: String(p.goalDop),
  uses: p.uses.map((u) => ({ label: u.label, amount: String(u.amountDop) })),
  imageId: p.imageId,
  imageUrl: p.imageUrl,
  status: p.status,
  featured: p.featured,
  order: String(p.order),
});

const blank = (order: number): Draft => ({
  slug: "",
  title: emptyText(),
  summary: emptyText(),
  description: emptyText(),
  goal: "",
  uses: [],
  status: "draft",
  featured: false,
  order: String(order),
});

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const STATUS_LABEL: Record<Status, string> = { draft: "Borrador", active: "Recibiendo donaciones", completed: "Meta alcanzada" };

function ProjectForm({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const save = useMutation(api.projects.save);
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const usesTotal = d.uses.reduce((s, u) => s + parseMoney(u.amount), 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.es.trim()) return toast.error("Escribe el título en español.");
    setBusy(true);
    try {
      await save({
        id: d.id,
        slug: d.slug || slugify(d.title.es),
        title: d.title,
        summary: d.summary,
        description: d.description,
        goalDop: parseMoney(d.goal),
        uses: d.uses.filter((u) => u.label.es.trim()).map((u) => ({ label: u.label, amountDop: parseMoney(u.amount) })),
        imageId: d.imageId,
        status: d.status,
        featured: d.featured,
        order: Number(d.order) || 0,
      });
      toast.success("Proyecto guardado.");
      onDone();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{d.id ? "Editar proyecto" : "Nuevo proyecto"}</CardTitle>
        <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onDone}><X /></Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-5">
          <BilingualField id="p-title" label="Título" value={d.title} onChange={(v) => set("title", v)} placeholder={{ es: "Ej.: Terreno para el club comunitario", en: "E.g. Land for the community club" }} />
          <BilingualField id="p-summary" label="Resumen corto" value={d.summary} onChange={(v) => set("summary", v)} placeholder={{ es: "Ej.: Compramos el terreno donde construiremos nuestro club.", en: "E.g. We are buying the land where we will build our club." }} />
          <BilingualField id="p-description" label="Descripción" value={d.description} onChange={(v) => set("description", v)} multiline placeholder={{ es: "Explica para qué es el dinero, cuánto hace falta y qué cambiará en la comunidad.", en: "Explain what the money is for, how much is needed and what will change for the community." }} />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Meta (RD$)" htmlFor="p-goal">
              <Input id="p-goal" inputMode="numeric" value={d.goal} onChange={(e) => set("goal", e.target.value)} placeholder="2,000,000" />
            </Field>
            <Field label="Enlace" htmlFor="p-slug" hint={`/proyectos/${d.slug || slugify(d.title.es) || "…"}`}>
              <Input id="p-slug" value={d.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={slugify(d.title.es)} />
            </Field>
            <Field label="Estado" htmlFor="p-status">
              <Select id="p-status" value={d.status} onChange={(e) => set("status", e.target.value as Status)}>
                {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </Select>
            </Field>
          </div>

          <fieldset className="grid gap-3">
            <legend className="mb-1.5 text-sm font-semibold">En qué se usarán los fondos</legend>
            {d.uses.map((u, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-[1fr_1fr_10rem_auto] md:items-center">
                <Input aria-label="Concepto (español)" placeholder="Concepto" value={u.label.es} onChange={(e) => set("uses", d.uses.map((x, j) => (j === i ? { ...x, label: { ...x.label, es: e.target.value } } : x)))} />
                <Input aria-label="Concepto (inglés)" placeholder="Item (English)" value={u.label.en} onChange={(e) => set("uses", d.uses.map((x, j) => (j === i ? { ...x, label: { ...x.label, en: e.target.value } } : x)))} />
                <Input aria-label="Monto RD$" inputMode="numeric" placeholder="RD$" value={u.amount} onChange={(e) => set("uses", d.uses.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
                <Button type="button" variant="ghost" size="icon" aria-label="Quitar concepto" onClick={() => set("uses", d.uses.filter((_, j) => j !== i))}><Trash2 /></Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => set("uses", [...d.uses, { label: emptyText(), amount: "" }])}>
                <Plus /> Agregar concepto
              </Button>
              {d.uses.length > 0 && (
                <p className="tabular text-sm text-muted-foreground">
                  Suma: {formatDop(usesTotal, "es")}
                  {parseMoney(d.goal) > 0 && usesTotal !== parseMoney(d.goal) && <span className="text-destructive"> (la meta es {formatDop(parseMoney(d.goal), "es")})</span>}
                </p>
              )}
            </div>
          </fieldset>

          <Field label="Foto principal">
            <ImageUpload value={d.imageId} previewUrl={d.imageUrl} onChange={(id) => set("imageId", id)} />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch id="p-featured" checked={d.featured} onCheckedChange={(v) => set("featured", v)} />
                <Label htmlFor="p-featured">Mostrar en la portada</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="p-order">Orden</Label>
                <Input id="p-order" className="w-20" inputMode="numeric" placeholder="1" value={d.order} onChange={(e) => set("order", e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={busy}>Guardar proyecto</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ProjectsAdmin() {
  const projects = useQuery(api.projects.listAll);
  const remove = useMutation(api.projects.remove);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (editing) return <ProjectForm key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />;

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing(blank((projects?.length ?? 0) + 1))}><Plus /> Nuevo proyecto</Button>
      </div>
      {(projects ?? []).map((p) => (
        <Card key={p._id} className="py-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg font-bold">{p.title.es}</p>
                <Badge variant={p.status === "active" ? "success" : "secondary"}>{STATUS_LABEL[p.status]}</Badge>
                {p.featured && <Badge variant="warning">Portada</Badge>}
              </div>
              <p className="tabular text-sm text-muted-foreground">
                {formatDop(p.raisedDop, "es")} de {formatDop(p.goalDop, "es")} ({percent(p.raisedDop, p.goalDop)}%) · {p.donorCount} donantes
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(fromProject(p))}><Pencil /> Editar</Button>
              {confirmId === p._id ? (
                <Button variant="destructive" size="sm" onClick={async () => {
                  try { await remove({ id: p._id }); toast.success("Proyecto eliminado."); } catch (err) { toast.error(errorText(err)); }
                  setConfirmId(null);
                }}>Confirmar</Button>
              ) : (
                <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => setConfirmId(p._id)}><Trash2 /></Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {projects?.length === 0 && <p className="text-muted-foreground">Todavía no hay proyectos.</p>}
    </div>
  );
}
