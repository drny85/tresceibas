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
import { BilingualField, Field, ImageUpload, Select, emptyText, errorText, type I18nText } from "./fields";
import { formatDateRange } from "@/lib/format";

type Activity = FunctionReturnType<typeof api.activities.listAll>[number];
type Day = { day: I18nText; items: { time: string; label: I18nText; responsible?: string }[] };
type Draft = {
  id?: Id<"activities">;
  slug: string;
  title: I18nText;
  summary: I18nText;
  description: I18nText;
  startDate: string;
  endDate: string;
  location: string;
  projectId?: Id<"projects">;
  schedule: Day[];
  imageId?: Id<"_storage">;
  imageUrl?: string | null;
  published: boolean;
  parentId?: Id<"activities">;
  time?: string;
  category?: Category;
  responsible?: string;
};

type Category = "cultural" | "religious" | "sports" | "community";
export const CATEGORY_LABEL: Record<Category, string> = {
  cultural: "Cultural",
  religious: "Religiosa",
  sports: "Deportiva",
  community: "Comunitaria",
};

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const fromActivity = (a: Activity): Draft => ({
  id: a._id, slug: a.slug, title: a.title, summary: a.summary, description: a.description,
  startDate: a.startDate, endDate: a.endDate, location: a.location, projectId: a.projectId,
  schedule: a.schedule, imageId: a.imageId, imageUrl: a.imageUrl, published: a.published,
  parentId: a.parentId, time: a.time, category: a.category, responsible: a.responsible,
});

const blank = (): Draft => ({
  slug: "", title: emptyText(), summary: emptyText(), description: emptyText(),
  startDate: "", endDate: "", location: "Tres Ceibas, Villa Magante, R.D.", schedule: [], published: false,
});

function ScheduleEditor({ value, onChange }: { value: Day[]; onChange: (v: Day[]) => void }) {
  const setDay = (i: number, day: Day) => onChange(value.map((d, j) => (j === i ? day : d)));
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1.5 text-sm font-semibold">Programa</legend>
      {value.map((day, i) => (
        <div key={i} className="grid gap-3 rounded-xl border border-border p-3">
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <Input aria-label="Día (español)" placeholder="Viernes 19: apertura" value={day.day.es} onChange={(e) => setDay(i, { ...day, day: { ...day.day, es: e.target.value } })} />
            <Input aria-label="Día (inglés)" placeholder="Friday 19: opening" value={day.day.en} onChange={(e) => setDay(i, { ...day, day: { ...day.day, en: e.target.value } })} />
            <Button type="button" variant="ghost" size="icon" aria-label="Quitar día" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 /></Button>
          </div>
          {day.items.map((item, k) => {
            const setItem = (patch: Partial<Day["items"][number]>) =>
              setDay(i, { ...day, items: day.items.map((x, m) => (m === k ? { ...x, ...patch } : x)) });
            return (
              <div key={k} className="grid gap-2 md:grid-cols-[7rem_1fr_1fr_10rem_auto]">
                <Input aria-label="Hora" placeholder="4:00 p. m." value={item.time} onChange={(e) => setItem({ time: e.target.value })} />
                <Input aria-label="Actividad (español)" placeholder="Actividad" value={item.label.es} onChange={(e) => setItem({ label: { ...item.label, es: e.target.value } })} />
                <Input aria-label="Actividad (inglés)" placeholder="Activity (English)" value={item.label.en} onChange={(e) => setItem({ label: { ...item.label, en: e.target.value } })} />
                <Input aria-label="Responsable" placeholder="Responsable" value={item.responsible ?? ""} onChange={(e) => setItem({ responsible: e.target.value || undefined })} />
                <Button type="button" variant="ghost" size="icon" aria-label="Quitar" onClick={() => setDay(i, { ...day, items: day.items.filter((_, m) => m !== k) })}><X /></Button>
              </div>
            );
          })}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setDay(i, { ...day, items: [...day.items, { time: "", label: emptyText() }] })}>
            <Plus /> Agregar hora
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => onChange([...value, { day: emptyText(), items: [] }])}>
        <Plus /> Agregar día
      </Button>
    </fieldset>
  );
}

function ActivityForm({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const save = useMutation(api.activities.save);
  const projects = useQuery(api.projects.listAll);
  const all = useQuery(api.activities.listAll);
  const events = (all ?? []).filter((a) => !a.parentId && a._id !== initial.id);
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.es.trim()) return toast.error("Escribe el título en español.");
    setBusy(true);
    try {
      await save({
        id: d.id, slug: d.slug || slugify(d.title.es), title: d.title, summary: d.summary, description: d.description,
        startDate: d.startDate, endDate: d.endDate || d.startDate, location: d.location, projectId: d.projectId,
        schedule: d.schedule.map((day) => ({ ...day, items: day.items.filter((x) => x.label.es.trim()) })),
        imageId: d.imageId, published: d.published,
        parentId: d.parentId, time: d.time, category: d.category, responsible: d.responsible,
      });
      toast.success("Actividad guardada.");
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
        <CardTitle>{d.id ? "Editar actividad" : "Nueva actividad"}</CardTitle>
        <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onDone}><X /></Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-5">
          <BilingualField id="a-title" label="Título" value={d.title} onChange={(v) => set("title", v)} />
          <BilingualField id="a-summary" label="Resumen corto" value={d.summary} onChange={(v) => set("summary", v)} />
          <BilingualField id="a-description" label="Descripción" value={d.description} onChange={(v) => set("description", v)} multiline />
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Fecha de inicio" htmlFor="a-start"><Input id="a-start" type="date" value={d.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
            <Field label="Fecha final" htmlFor="a-end"><Input id="a-end" type="date" value={d.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
            <Field label="Lugar" htmlFor="a-location" className="md:col-span-2"><Input id="a-location" value={d.location} onChange={(e) => set("location", e.target.value)} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="A beneficio del proyecto" htmlFor="a-project">
              <Select id="a-project" value={d.projectId ?? ""} onChange={(e) => set("projectId", (e.target.value || undefined) as Id<"projects"> | undefined)}>
                <option value="">Ninguno</option>
                {(projects ?? []).map((p) => <option key={p._id} value={p._id}>{p.title.es}</option>)}
              </Select>
            </Field>
            <Field label="Enlace" htmlFor="a-slug" hint={`/actividades/${d.slug || slugify(d.title.es) || "…"}`}>
              <Input id="a-slug" value={d.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={slugify(d.title.es)} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Parte del evento" htmlFor="a-parent" hint="Déjalo en «Ninguno» si es un evento principal." className="md:col-span-2">
              <Select
                id="a-parent"
                value={d.parentId ?? ""}
                onChange={(e) => {
                  const parentId = (e.target.value || undefined) as Id<"activities"> | undefined;
                  const parent = events.find((x) => x._id === parentId);
                  setD((x) => ({
                    ...x,
                    parentId,
                    // Inherit place and project from the event when they are still empty.
                    location: parent && !x.location.trim() ? parent.location : x.location,
                    projectId: parent && !x.projectId ? parent.projectId : x.projectId,
                  }));
                }}
              >
                <option value="">Ninguno</option>
                {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title.es}</option>)}
              </Select>
            </Field>
            <Field label="Hora" htmlFor="a-time" hint="Ej.: 4:00 p. m.">
              <Input id="a-time" value={d.time ?? ""} onChange={(e) => set("time", e.target.value)} placeholder="4:00 p. m." />
            </Field>
            <Field label="Tipo" htmlFor="a-category">
              <Select id="a-category" value={d.category ?? ""} onChange={(e) => set("category", (e.target.value || undefined) as Category | undefined)}>
                <option value="">Sin tipo</option>
                {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </Select>
            </Field>
            <Field label="Responsable" htmlFor="a-responsible" className="md:col-span-2">
              <Input id="a-responsible" value={d.responsible ?? ""} onChange={(e) => set("responsible", e.target.value)} placeholder="Comité deportivo" />
            </Field>
          </div>
          {!d.parentId && <ScheduleEditor value={d.schedule} onChange={(v) => set("schedule", v)} />}
          <Field label="Foto"><ImageUpload value={d.imageId} previewUrl={d.imageUrl} onChange={(id) => set("imageId", id)} /></Field>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch id="a-published" checked={d.published} onCheckedChange={(v) => set("published", v)} />
              <Label htmlFor="a-published">Publicada</Label>
            </div>
            <Button type="submit" disabled={busy}>Guardar actividad</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ActivitiesAdmin() {
  const all = useQuery(api.activities.listAll);
  // Events first, each followed by the activities of its program.
  const activities = all
    ?.filter((a) => !a.parentId)
    .flatMap((ev) => [ev, ...all.filter((c) => c.parentId === ev._id)])
    .concat(all.filter((c) => c.parentId && !all.some((p) => p._id === c.parentId)));
  const remove = useMutation(api.activities.remove);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (editing) return <ActivityForm key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />;

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing(blank())}><Plus /> Nueva actividad</Button>
      </div>
      {(activities ?? []).map((a) => (
        <Card key={a._id} className={a.parentId ? "ml-4 border-dashed py-3 sm:ml-8" : "py-4"}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={a.parentId ? "font-semibold" : "font-display text-lg font-bold"}>{a.title.es}</p>
                {a.category && <Badge variant="secondary">{CATEGORY_LABEL[a.category]}</Badge>}
                <Badge variant={a.published ? "success" : "secondary"}>{a.published ? "Publicada" : "Borrador"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDateRange(a.startDate, a.endDate, "es")}
                {a.time ? ` · ${a.time}` : ""}
                {a.parentId ? (a.responsible ? ` · ${a.responsible}` : "") : ` · ${a.location}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(fromActivity(a))}><Pencil /> Editar</Button>
              {confirmId === a._id ? (
                <Button variant="destructive" size="sm" onClick={async () => {
                  try { await remove({ id: a._id }); toast.success("Actividad eliminada."); } catch (err) { toast.error(errorText(err)); }
                  setConfirmId(null);
                }}>Confirmar</Button>
              ) : (
                <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => setConfirmId(a._id)}><Trash2 /></Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {activities?.length === 0 && <p className="text-muted-foreground">Todavía no hay actividades.</p>}
    </div>
  );
}
