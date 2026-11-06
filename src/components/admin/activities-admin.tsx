"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, CalendarDays, Check, Clock, Eye, List, MapPin, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
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
import { MonthGrid, MonthHeader, monthOf, todayIso, type Month } from "./month-calendar";
import { I18nProvider, useI18n, pick } from "@/i18n/provider";
import { ActivityCard, type ActivityItem } from "@/components/activity-card";
import { CategoryBadge, ScheduleDisclaimer } from "@/components/activity-program";
import { PlaceholderImage } from "@/components/placeholder-image";
import { activityTime, formatDate, formatDateRange, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import en from "@/i18n/dictionaries/en.json";
import type { Dictionary } from "@/i18n/get-dictionary";

type Activity = FunctionReturnType<typeof api.activities.listAll>[number];
type Category = "cultural" | "religious" | "sports" | "community";
type Day = { day: I18nText; items: { time: string; label: I18nText; responsible?: string }[] };
type Draft = {
  id?: Id<"activities">;
  slug: string;
  title: I18nText;
  summary: I18nText;
  description: I18nText;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  location: string;
  projectId?: Id<"projects">;
  schedule: Day[];
  imageId?: Id<"_storage">;
  imageUrl?: string | null;
  published: boolean;
  parentId?: Id<"activities">;
  category?: Category;
  responsible: string;
};

export const CATEGORY_LABEL: Record<Category, string> = {
  cultural: "Cultural",
  religious: "Religiosa",
  sports: "Deportiva",
  community: "Comunitaria",
};
const CATEGORY_DOT: Record<Category | "event", string> = {
  event: "bg-brand-red",
  cultural: "bg-brand-gold",
  religious: "bg-primary",
  sports: "bg-brand-green",
  community: "bg-muted-foreground",
};

const DEFAULT_LOCATION = "La Cancha de Tres Ceibas, Villa Magante, R.D.";

/** Every half hour from 6:00 a. m. to 11:30 p. m., plus midnight (stored as 23:59) to end the night. */
const TIME_SLOTS = [
  ...Array.from({ length: 36 }, (_, i) => {
    const mins = 6 * 60 + i * 30;
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  }),
  "23:59",
];
const addMinutes = (t: string, n: number) => {
  const [h, m] = t.split(":").map(Number);
  const total = Math.min(h * 60 + m + n, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const fromActivity = (a: Activity): Draft => ({
  id: a._id, slug: a.slug, title: a.title, summary: a.summary, description: a.description,
  startDate: a.startDate, endDate: a.endDate, allDay: !a.startTime, startTime: a.startTime ?? "", endTime: a.endTime ?? "",
  location: a.location, projectId: a.projectId, schedule: a.schedule, imageId: a.imageId, imageUrl: a.imageUrl,
  published: a.published, parentId: a.parentId, category: a.category, responsible: a.responsible ?? "",
});

const blank = (date = "", parent?: Activity): Draft => ({
  slug: "", title: emptyText(), summary: emptyText(), description: emptyText(),
  startDate: date, endDate: date, allDay: false, startTime: "", endTime: "",
  location: parent?.location ?? DEFAULT_LOCATION, projectId: parent?.projectId, schedule: [], published: true,
  parentId: parent?._id, responsible: "",
});

/* ───────────────────────── Date and time pickers ───────────────────────── */

function DateRangePicker({
  start, end, onChange, min, max,
}: { start: string; end: string; onChange: (start: string, end: string) => void; min?: string; max?: string }) {
  const [month, setMonth] = useState<Month>(monthOf(start || min || todayIso()));
  // First tap picks the start; a later tap on or after it sets the end.
  const [picking, setPicking] = useState<"start" | "end">("start");
  const select = (date: string) => {
    if (picking === "start" || !start || date < start) {
      onChange(date, date);
      setPicking("end");
    } else {
      onChange(start, date);
      setPicking("start");
    }
  };
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-background p-3 sm:max-w-sm">
      <MonthHeader month={month} onChange={setMonth} />
      <MonthGrid
        month={month}
        onSelect={select}
        isSelected={(d) => d === start || d === end}
        isInRange={(d) => !!start && !!end && d > start && d < end}
        isDisabled={(d) => (min ? d < min : false) || (max ? d > max : false)}
      />
      <p className="text-xs text-muted-foreground">
        {!start
          ? "Toca el día de la actividad."
          : picking === "end"
            ? "Toca otro día si dura varios días, o deja este solo."
            : "Toca un día para empezar de nuevo."}
      </p>
    </div>
  );
}

function TimeSelect({ id, value, onChange, after, placeholder }: { id: string; value: string; onChange: (v: string) => void; after?: string; placeholder: string }) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="tabular">
      <option value="">{placeholder}</option>
      {TIME_SLOTS.filter((t) => !after || t > after).map((t) => (
        <option key={t} value={t}>{formatTime(t, "es")}{t === "23:59" ? " (medianoche)" : ""}</option>
      ))}
    </Select>
  );
}

function TimePicker({ d, set }: { d: Draft; set: (patch: Partial<Draft>) => void }) {
  const sameDay = d.startDate === d.endDate;
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Switch id="a-allday" checked={d.allDay} onCheckedChange={(allDay) => set({ allDay })} />
        <Label htmlFor="a-allday">Todo el día</Label>
      </div>
      {!d.allDay && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <Field label="Empieza" htmlFor="a-start-time">
              <TimeSelect
                id="a-start-time"
                value={d.startTime}
                placeholder="Elegir…"
                onChange={(startTime) =>
                  set({ startTime, endTime: !d.endTime || (sameDay && d.endTime <= startTime) ? (startTime ? addMinutes(startTime, 60) : "") : d.endTime })
                }
              />
            </Field>
            <Field label="Termina" htmlFor="a-end-time">
              <TimeSelect id="a-end-time" value={d.endTime} placeholder="Sin hora final" after={sameDay ? d.startTime : undefined} onChange={(endTime) => set({ endTime })} />
            </Field>
          </div>
          {d.startTime && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Duración">
              {[30, 60, 90, 120, 180].map((n) => {
                const endTime = addMinutes(d.startTime, n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set({ endTime })}
                    aria-pressed={d.endTime === endTime}
                    className={cn(
                      "h-9 cursor-pointer rounded-full border border-border px-3 text-sm font-semibold",
                      d.endTime === endTime ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary",
                    )}
                  >
                    {n < 60 ? `${n} min` : `${n / 60} h`}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Older "simple schedule" for events ───────────────────────── */

function ScheduleEditor({ value, onChange }: { value: Day[]; onChange: (v: Day[]) => void }) {
  const setDay = (i: number, day: Day) => onChange(value.map((d, j) => (j === i ? day : d)));
  return (
    <details className="group rounded-xl border border-border p-3">
      <summary className="cursor-pointer text-sm font-semibold">
        Horario resumido (opcional)
        <span className="ml-2 font-normal text-muted-foreground">Solo si no vas a crear cada actividad por separado.</span>
      </summary>
      <div className="mt-3 grid gap-3">
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
                <div key={k} className="grid gap-2 md:grid-cols-[8rem_1fr_1fr_10rem_auto]">
                  <Select aria-label="Hora" value={item.time} onChange={(e) => setItem({ time: e.target.value })}>
                    <option value="">Hora</option>
                    {item.time && !TIME_SLOTS.some((t) => formatTime(t, "es") === item.time) && <option value={item.time}>{item.time}</option>}
                    {TIME_SLOTS.map((t) => <option key={t} value={formatTime(t, "es")}>{formatTime(t, "es")}</option>)}
                  </Select>
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
      </div>
    </details>
  );
}

/* ───────────────────────── Preview ───────────────────────── */

function PreviewBody({ d, parentTitle }: { d: Draft; parentTitle?: I18nText }) {
  const { locale, dict } = useI18n();
  const time = activityTime({ startTime: d.allDay ? undefined : d.startTime || undefined, endTime: d.allDay ? undefined : d.endTime || undefined }, locale);
  const card = {
    _id: "preview", slug: d.slug || "vista-previa", title: d.title, summary: d.summary,
    startDate: d.startDate, endDate: d.endDate || d.startDate, location: d.location,
  } as unknown as ActivityItem;
  const description = pick(d.description, locale);
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Así se verá en la lista</p>
        <ActivityCard activity={card} />
      </div>
      <div className="grid gap-4 rounded-2xl border border-border bg-background p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Así se verá su página</p>
        {parentTitle && <p className="text-sm font-semibold text-primary">{dict.activities.partOf} {pick(parentTitle, locale)}</p>}
        {d.category && <CategoryBadge category={d.category} />}
        <h3 className="text-3xl font-extrabold tracking-tight text-balance">{pick(d.title, locale) || "—"}</h3>
        <p className="text-muted-foreground text-pretty">{pick(d.summary, locale)}</p>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 text-brand-red" /> <span className="font-semibold">{formatDateRange(d.startDate, d.endDate || d.startDate, locale)}</span></li>
          <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 text-brand-red" /> <span className="font-semibold">{d.location}</span></li>
          <li className="flex items-start gap-2"><Clock className="mt-0.5 size-4 text-brand-red" /> <span className="font-semibold">{time ?? dict.activities.allDay}</span></li>
          {d.responsible && <li className="flex items-start gap-2"><UserRound className="mt-0.5 size-4 text-brand-red" /> <span className="font-semibold">{d.responsible}</span></li>}
        </ul>
        <ScheduleDisclaimer />
        <div className="overflow-hidden rounded-xl border border-border">
          {d.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.imageUrl} alt="" className="aspect-[16/10] w-full object-cover" />
          ) : (
            <PlaceholderImage label={dict.common.photoSoon} tone={1} />
          )}
        </div>
        {description && description !== pick(d.summary, locale) && <p className="whitespace-pre-line leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}

function Preview({ d, parentTitle }: { d: Draft; parentTitle?: I18nText }) {
  const [lang, setLang] = useState<"es" | "en">("es");
  return (
    <div className="grid gap-4">
      <div className="flex w-fit overflow-hidden rounded-full border border-border text-sm font-bold" role="group" aria-label="Idioma de la vista previa">
        {(["es", "en"] as const).map((l) => (
          <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}
            className={cn("h-9 cursor-pointer px-4", lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {l === "es" ? "Español" : "English"}
          </button>
        ))}
      </div>
      {lang === "es" ? (
        <PreviewBody d={d} parentTitle={parentTitle} />
      ) : (
        <I18nProvider locale="en" dict={en as Dictionary}>
          <PreviewBody d={d} parentTitle={parentTitle} />
        </I18nProvider>
      )}
      {(!d.title.en.trim() || !d.summary.en.trim()) && (
        <p className="rounded-xl bg-brand-gold/15 p-3 text-sm">Falta el texto en inglés. En la versión en inglés se mostrará el español.</p>
      )}
    </div>
  );
}

/* ───────────────────────── Form ───────────────────────── */

function ActivityForm({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const save = useMutation(api.activities.save);
  const projects = useQuery(api.projects.listAll);
  const all = useQuery(api.activities.listAll);
  const events = (all ?? []).filter((a) => !a.parentId && a._id !== initial.id);
  const [d, setD] = useState<Draft>(initial);
  const [step, setStep] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const parent = events.find((e) => e._id === d.parentId);

  function problem() {
    if (!d.title.es.trim()) return "Escribe el título en español.";
    if (!d.summary.es.trim()) return "Escribe un resumen corto en español.";
    if (!d.startDate) return "Elige la fecha en el calendario.";
    if (!d.allDay && !d.startTime) return "Elige la hora de inicio o marca «Todo el día».";
    if (!d.location.trim()) return "Escribe el lugar.";
    return null;
  }

  function toPreview(e: React.FormEvent) {
    e.preventDefault();
    const p = problem();
    if (p) return toast.error(p);
    setStep("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setBusy(true);
    try {
      await save({
        id: d.id, slug: d.slug || slugify(d.title.es), title: d.title, summary: d.summary,
        description: d.description.es.trim() ? d.description : d.summary,
        startDate: d.startDate, endDate: d.endDate || d.startDate, location: d.location.trim(), projectId: d.projectId,
        schedule: d.parentId ? [] : d.schedule.map((day) => ({ ...day, items: day.items.filter((x) => x.label.es.trim()) })),
        imageId: d.imageId, published: d.published, parentId: d.parentId,
        startTime: d.allDay ? undefined : d.startTime || undefined,
        endTime: d.allDay ? undefined : d.endTime || undefined,
        category: d.category, responsible: d.responsible || undefined,
      });
      toast.success(d.published ? "Actividad guardada y publicada." : "Actividad guardada como borrador.");
      onDone();
    } catch (err) {
      toast.error(errorText(err));
      setStep("edit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <div className="grid gap-1">
          <CardTitle>{step === "preview" ? "Vista previa" : d.id ? "Editar actividad" : "Nueva actividad"}</CardTitle>
          <ol className="flex gap-2 text-xs font-semibold text-muted-foreground" aria-label="Pasos">
            <li className={cn(step === "edit" && "text-foreground")}>1. Datos</li>
            <li aria-hidden>›</li>
            <li className={cn(step === "preview" && "text-foreground")}>2. Revisar y guardar</li>
          </ol>
        </div>
        <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onDone}><X /></Button>
      </CardHeader>
      <CardContent>
        {step === "preview" ? (
          <div className="grid gap-6">
            <Preview d={d} parentTitle={parent?.title} />
            <div className="flex items-center gap-2 rounded-xl border border-border p-3">
              <Switch id="p-published" checked={d.published} onCheckedChange={(published) => set({ published })} />
              <Label htmlFor="p-published">{d.published ? "Se publicará en el sitio" : "Se guardará como borrador (no visible)"}</Label>
            </div>
            <div className="sticky bottom-0 -mx-6 grid grid-cols-2 gap-3 border-t border-border bg-card px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:p-0">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep("edit")}><ArrowLeft /> Editar</Button>
              <Button type="button" size="lg" disabled={busy} onClick={submit}><Check /> Guardar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={toPreview} className="grid gap-8" noValidate>
            <section className="grid gap-4">
              <h3 className="font-display text-lg font-bold">¿Qué es?</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Parte del evento" htmlFor="a-parent" hint="«Ninguno» si es un evento principal, como Tres Ceiberos Ausente.">
                  <Select
                    id="a-parent"
                    value={d.parentId ?? ""}
                    onChange={(e) => {
                      const p = events.find((x) => x._id === e.target.value);
                      set({
                        parentId: p?._id,
                        location: p && (!d.location.trim() || d.location === DEFAULT_LOCATION) ? p.location : d.location,
                        projectId: p && !d.projectId ? p.projectId : d.projectId,
                        // Keep the date inside the event's days.
                        startDate: p && d.startDate && (d.startDate < p.startDate || d.startDate > p.endDate) ? p.startDate : d.startDate || (p ? p.startDate : ""),
                        endDate: p && d.endDate && (d.endDate < p.startDate || d.endDate > p.endDate) ? p.startDate : d.endDate || (p ? p.startDate : ""),
                      });
                    }}
                  >
                    <option value="">Ninguno (evento principal)</option>
                    {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title.es}</option>)}
                  </Select>
                </Field>
                <Field label="Tipo" htmlFor="a-category">
                  <div className="flex flex-wrap gap-2" role="radiogroup" id="a-category">
                    {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                      <button key={c} type="button" role="radio" aria-checked={d.category === c} onClick={() => set({ category: d.category === c ? undefined : c })}
                        className={cn("inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-3.5 text-sm font-semibold",
                          d.category === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary")}>
                        <span className={cn("size-2.5 rounded-full", CATEGORY_DOT[c])} aria-hidden /> {CATEGORY_LABEL[c]}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              <BilingualField id="a-title" label="Título" value={d.title} onChange={(title) => set({ title })} />
              <BilingualField id="a-summary" label="Resumen corto (una o dos líneas)" value={d.summary} onChange={(summary) => set({ summary })} />
              <BilingualField id="a-description" label="Descripción completa (opcional)" value={d.description} onChange={(description) => set({ description })} multiline />
            </section>

            <section className="grid gap-4">
              <h3 className="font-display text-lg font-bold">¿Cuándo?</h3>
              <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
                <div className="grid gap-2">
                  {parent && (
                    <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => set({ startDate: parent.startDate, endDate: parent.endDate })}>
                      <CalendarDays /> Todos los días del evento
                    </Button>
                  )}
                  <DateRangePicker
                    key={parent?._id ?? "none"}
                    start={d.startDate}
                    end={d.endDate}
                    min={parent?.startDate}
                    max={parent?.endDate}
                    onChange={(startDate, endDate) => set({ startDate, endDate })}
                  />
                </div>
                <div className="grid content-start gap-4">
                  <p className="rounded-xl bg-muted/60 p-3 text-sm font-semibold">
                    {d.startDate ? formatDateRange(d.startDate, d.endDate || d.startDate, "es") : "Sin fecha todavía"}
                  </p>
                  <TimePicker d={d} set={set} />
                </div>
              </div>
            </section>

            <section className="grid gap-4">
              <h3 className="font-display text-lg font-bold">¿Dónde y quién?</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Lugar" htmlFor="a-location"><Input id="a-location" value={d.location} onChange={(e) => set({ location: e.target.value })} /></Field>
                <Field label="Responsable (opcional)" htmlFor="a-responsible">
                  <Input id="a-responsible" list="a-responsible-list" value={d.responsible} onChange={(e) => set({ responsible: e.target.value })} placeholder="Comité deportivo" />
                  <datalist id="a-responsible-list">
                    {["Comité organizador", "Comité deportivo", "Comité cultural", "Comité religioso", "Encargada de Cultura", "Entrenadores"].map((r) => <option key={r} value={r} />)}
                  </datalist>
                </Field>
                <Field label="A beneficio del proyecto" htmlFor="a-project">
                  <Select id="a-project" value={d.projectId ?? ""} onChange={(e) => set({ projectId: (e.target.value || undefined) as Id<"projects"> | undefined })}>
                    <option value="">Ninguno</option>
                    {(projects ?? []).map((p) => <option key={p._id} value={p._id}>{p.title.es}</option>)}
                  </Select>
                </Field>
                <Field label="Enlace" htmlFor="a-slug" hint={`/actividades/${d.slug || slugify(d.title.es) || "…"}`}>
                  <Input id="a-slug" value={d.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} placeholder={slugify(d.title.es) || "se-crea-solo"} />
                </Field>
              </div>
              <Field label="Foto (opcional)"><ImageUpload value={d.imageId} previewUrl={d.imageUrl} onChange={(imageId) => set({ imageId })} /></Field>
              {!d.parentId && <ScheduleEditor value={d.schedule} onChange={(schedule) => set({ schedule })} />}
            </section>

            <div className="sticky bottom-0 -mx-6 grid grid-cols-2 gap-3 border-t border-border bg-card px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:p-0">
              <Button type="button" variant="outline" size="lg" onClick={onDone}>Cancelar</Button>
              <Button type="submit" size="lg"><Eye /> Vista previa</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── List and calendar ───────────────────────── */

function ActivityRow({ a, onEdit, onRemove }: { a: Activity; onEdit: () => void; onRemove: () => Promise<void> }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Card className={a.parentId ? "ml-3 border-dashed py-3 sm:ml-8" : "py-4"}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("size-2.5 shrink-0 rounded-full", CATEGORY_DOT[a.parentId ? a.category ?? "community" : "event"])} aria-hidden />
            <p className={a.parentId ? "font-semibold" : "font-display text-lg font-bold"}>{a.title.es}</p>
            {!a.published && <Badge variant="secondary">Borrador</Badge>}
            {a.category && <Badge variant="outline">{CATEGORY_LABEL[a.category]}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDateRange(a.startDate, a.endDate, "es")}
            {activityTime(a, "es") ? ` · ${activityTime(a, "es")}` : " · Todo el día"}
            {a.parentId ? (a.responsible ? ` · ${a.responsible}` : "") : ` · ${a.location}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}><Pencil /> Editar</Button>
          {confirm ? (
            <Button variant="destructive" size="sm" onClick={async () => { await onRemove(); setConfirm(false); }}>Confirmar</Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => setConfirm(true)}><Trash2 /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarView({ activities, onEdit, onNew }: { activities: Activity[]; onEdit: (a: Activity) => void; onNew: (date: string) => void }) {
  const today = todayIso();
  const firstUpcoming = activities.find((a) => a.endDate >= today)?.startDate;
  const [month, setMonth] = useState<Month>(monthOf(firstUpcoming ?? today));
  const [day, setDay] = useState<string>(firstUpcoming ?? today);
  const on = (date: string) => activities.filter((a) => a.startDate <= date && a.endDate >= date);
  const dayItems = on(day);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid content-start gap-3">
        <MonthHeader month={month} onChange={setMonth} />
        <MonthGrid
          size="lg"
          month={month}
          selectedDay={day}
          onSelect={setDay}
          renderDay={(date) => {
            const items = on(date);
            if (!items.length) return null;
            return (
              <>
                {/* Phones: coloured dots. Larger screens: short labels. */}
                <span className="flex flex-wrap gap-0.5 sm:hidden" aria-label={`${items.length} actividades`}>
                  {items.slice(0, 6).map((a) => <span key={a._id} className={cn("size-1.5 rounded-full", CATEGORY_DOT[a.parentId ? a.category ?? "community" : "event"])} />)}
                </span>
                <span className="hidden gap-0.5 sm:grid">
                  {items.slice(0, 3).map((a) => (
                    <button
                      key={a._id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEdit(a); }}
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight font-semibold",
                        a.parentId ? "bg-muted hover:bg-secondary" : "bg-brand-red text-white",
                        !a.published && "opacity-60",
                      )}
                      title={a.title.es}
                    >
                      {a.startTime && a.parentId ? `${formatTime(a.startTime, "es").replace(/\s?[ap]\.\s?m\./, "")} ` : ""}{a.title.es}
                    </button>
                  ))}
                  {items.length > 3 && <span className="px-1 text-[11px] text-muted-foreground">+{items.length - 3} más</span>}
                </span>
              </>
            );
          }}
        />
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {([["event", "Evento principal"], ...Object.entries(CATEGORY_LABEL)] as [keyof typeof CATEGORY_DOT, string][]).map(([k, label]) => (
            <span key={k} className="inline-flex items-center gap-1.5"><span className={cn("size-2.5 rounded-full", CATEGORY_DOT[k])} /> {label}</span>
          ))}
        </p>
      </div>

      <aside className="grid content-start gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-lg font-bold first-letter:uppercase">{formatDate(day, "es", { weekday: "long", day: "numeric", month: "long" })}</p>
          <Button size="sm" onClick={() => onNew(day)}><Plus /> Agregar</Button>
        </div>
        {dayItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay actividades este día.</p>
        ) : (
          <ul className="grid gap-2">
            {dayItems.map((a) => (
              <li key={a._id}>
                <button type="button" onClick={() => onEdit(a)} className="grid w-full cursor-pointer gap-0.5 rounded-xl border border-border bg-background p-3 text-left hover:border-primary">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className={cn("size-2.5 shrink-0 rounded-full", CATEGORY_DOT[a.parentId ? a.category ?? "community" : "event"])} />
                    {a.title.es}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {activityTime(a, "es") ?? "Todo el día"}{!a.published ? " · Borrador" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

export function ActivitiesAdmin() {
  const all = useQuery(api.activities.listAll);
  const remove = useMutation(api.activities.remove);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  // Events first, each followed by the activities of its program.
  const ordered = useMemo(
    () =>
      all
        ?.filter((a) => !a.parentId)
        .flatMap((ev) => [ev, ...all.filter((c) => c.parentId === ev._id)])
        .concat(all.filter((c) => c.parentId && !all.some((p) => p._id === c.parentId))),
    [all],
  );

  const startNew = (date = "") => {
    // A new activity on a day inside an event belongs to that event by default.
    const parent = date ? all?.find((a) => !a.parentId && a.startDate <= date && a.endDate >= date) : undefined;
    setEditing(blank(date, parent));
  };

  if (editing) return <ActivityForm key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-hidden rounded-full border border-border text-sm font-semibold" role="group" aria-label="Vista">
          {([["calendar", "Calendario", CalendarDays], ["list", "Lista", List]] as const).map(([v, label, Icon]) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
              className={cn("inline-flex h-10 cursor-pointer items-center gap-2 px-4", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
        <Button onClick={() => startNew()}><Plus /> Nueva actividad</Button>
      </div>

      {all === undefined ? (
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      ) : view === "calendar" ? (
        <CalendarView activities={all} onEdit={(a) => setEditing(fromActivity(a))} onNew={startNew} />
      ) : (
        <div className="grid gap-3">
          {(ordered ?? []).map((a) => (
            <ActivityRow
              key={a._id}
              a={a}
              onEdit={() => setEditing(fromActivity(a))}
              onRemove={async () => {
                try { await remove({ id: a._id }); toast.success("Actividad eliminada."); } catch (err) { toast.error(errorText(err)); }
              }}
            />
          ))}
          {all.length === 0 && <p className="text-muted-foreground">Todavía no hay actividades.</p>}
        </div>
      )}
    </div>
  );
}
