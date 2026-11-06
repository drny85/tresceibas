"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Download, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Select, errorText, parseMoney } from "./fields";
import { formatAmount, formatDop, formatRelative, formatUsd } from "@/lib/format";

const METHOD: Record<string, string> = { stripe: "Tarjeta", paypal: "PayPal", cash: "Efectivo", transfer: "Transferencia" };
const STATUS = {
  paid: { label: "Pagada", variant: "success" },
  pending: { label: "Pendiente", variant: "warning" },
  failed: { label: "Fallida", variant: "destructive" },
  refunded: { label: "Reembolsada", variant: "secondary" },
  test: { label: "Prueba", variant: "secondary" },
} as const;
type Status = keyof typeof STATUS;

type Row = NonNullable<ReturnType<typeof useQuery<typeof api.donations.listAll>>>[number];

/** A CSV that Excel opens with accents intact (UTF-8 with BOM, semicolon-free). */
function exportCsv(rows: Row[]) {
  const head = ["Fecha", "Donante", "Anónimo", "Correo", "Proyecto", "Monto", "Moneda", "Monto RD$", "Comisión US$", "Cobrado US$", "Tasa", "Forma", "Estado", "Dedicatoria", "Mensaje", "Nota", "Registrada por"];
  const cell = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const lines = rows.map((d) =>
    [
      new Date(d.paidAt ?? d._creationTime).toISOString().slice(0, 16).replace("T", " "),
      d.donorName,
      d.anonymous ? "Sí" : "No",
      d.email,
      d.projectTitle,
      d.amount,
      d.currency,
      d.amountDop,
      d.feeUsd,
      d.chargedUsd,
      d.rate,
      METHOD[d.method],
      STATUS[d.status].label,
      d.tribute ? `${d.tribute.kind === "memory" ? "En memoria de" : "En honor de"} ${d.tribute.name}` : "",
      d.message,
      d.excludedNote,
      d.recordedBy,
    ].map(cell).join(","),
  );
  const blob = new Blob(["\uFEFF" + [head.join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `donaciones-tres-ceibas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function ManualDonationForm() {
  const projects = useQuery(api.projects.listAll);
  const add = useMutation(api.donations.addManual);
  const [projectId, setProjectId] = useState<string>("");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"DOP" | "USD">("DOP");
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const chosen = projectId || projects?.find((p) => p.status === "active")?._id || "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!chosen) return toast.error("Elige un proyecto.");
    const value = parseMoney(amount);
    if (!(value > 0)) return toast.error("Escribe el monto recibido.");
    if (!anonymous && !name.trim()) return toast.error("Escribe el nombre o marca anónimo.");
    setBusy(true);
    try {
      await add({
        projectId: chosen as Id<"projects">,
        donorName: anonymous ? undefined : name,
        anonymous,
        message: message || undefined,
        amount: value,
        currency,
        method,
      });
      toast.success("Donación registrada. Ya aparece en el total.");
      setName(""); setAmount(""); setMessage(""); setAnonymous(false);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar donación en efectivo o transferencia</CardTitle>
        <CardDescription>Para aportes recibidos en mano o por banco. Se suma al total de inmediato.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Field label="Proyecto" htmlFor="m-project">
            <Select id="m-project" value={chosen} onChange={(e) => setProjectId(e.target.value)}>
              {(projects ?? []).map((p) => <option key={p._id} value={p._id}>{p.title.es}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <Field label="Monto" htmlFor="m-amount">
              <Input id="m-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5,000" />
            </Field>
            <Field label="Moneda" htmlFor="m-currency">
              <Select id="m-currency" value={currency} onChange={(e) => setCurrency(e.target.value as "DOP" | "USD")}>
                <option value="DOP">RD$</option>
                <option value="USD">USD</option>
              </Select>
            </Field>
          </div>
          <Field label="Nombre del donante" htmlFor="m-name">
            <Input id="m-name" value={name} disabled={anonymous} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Forma de pago" htmlFor="m-method">
            <Select id="m-method" value={method} onChange={(e) => setMethod(e.target.value as "cash" | "transfer")}>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
            </Select>
          </Field>
          <Field label="Mensaje (opcional)" htmlFor="m-message" className="md:col-span-2">
            <Input id="m-message" value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <Switch id="m-anon" checked={anonymous} onCheckedChange={setAnonymous} />
              <Label htmlFor="m-anon">Anónimo</Label>
            </div>
            <Button type="submit" disabled={busy}>Registrar donación</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function DonationsAdmin() {
  const [status, setStatus] = useState<"" | Status>("paid");
  const rows = useQuery(api.donations.listAll, status ? { status } : {});
  const setHide = useMutation(api.donations.setHideMessage);
  const removeManual = useMutation(api.donations.removeManual);
  const setExcluded = useMutation(api.donations.setExcluded);
  const changeStatus = async (id: Id<"donations">, as: "paid" | "refunded" | "test") => {
    try {
      await setExcluded({ id, as });
      toast.success(as === "paid" ? "Vuelve a contar en el total." : `Marcada como ${STATUS[as].label.toLowerCase()}. Ya no cuenta en el total.`);
    } catch (err) {
      toast.error(errorText(err));
    }
  };
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const totalDop = (rows ?? []).filter((d) => d.status === "paid").reduce((s, d) => s + d.amountDop, 0);
  const totalFees = (rows ?? []).filter((d) => d.status === "paid").reduce((s, d) => s + (d.feeUsd ?? 0), 0);

  return (
    <div className="grid gap-6">
      <ManualDonationForm />
      <Card>
        <CardHeader className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>Donaciones</CardTitle>
            {status === "paid" && rows && (
              <CardDescription className="tabular">
                Total recibido: {formatDop(totalDop, "es")} · Comisiones cubiertas por donantes: {formatUsd(totalFees, "es")}
              </CardDescription>
            )}
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Select aria-label="Filtrar por estado" className="min-w-0 flex-1 sm:w-44" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="paid">Pagadas</option>
              <option value="pending">Pendientes</option>
              <option value="failed">Fallidas</option>
              <option value="refunded">Reembolsadas</option>
              <option value="test">Pruebas</option>
              <option value="">Todas</option>
            </Select>
            <Button variant="outline" disabled={!rows?.length} onClick={() => rows && exportCsv(rows)}>
              <Download /> Exportar a Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="md:overflow-x-auto">
          <table className="tabular block w-full text-sm md:table md:min-w-[720px]">
            <thead className="hidden text-left md:table-header-group text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Donante</th>
                <th className="py-2 pr-3">Proyecto</th>
                <th className="py-2 pr-3 text-right">Monto</th>
                <th className="py-2 pr-3">Forma</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {rows === undefined && (
                <tr className="block md:table-row"><td colSpan={7} className="block py-6 text-center text-muted-foreground md:table-cell">Cargando…</td></tr>
              )}
              {rows?.length === 0 && (
                <tr className="block md:table-row"><td colSpan={7} className="block py-6 text-center text-muted-foreground md:table-cell">No hay donaciones con este filtro.</td></tr>
              )}
              {rows?.map((d) => (
                <tr key={d._id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 border-b border-border/70 py-3 align-top md:table-row md:py-0">
                  <td className="text-xs text-muted-foreground md:py-2.5 md:pr-3 md:text-sm md:whitespace-nowrap md:text-foreground">{formatRelative(d.paidAt ?? d._creationTime, "es")}</td>
                  <td className="col-span-2 row-start-2 md:py-2.5 md:pr-3">
                    <p className="font-semibold">{d.anonymous ? `Anónimo${d.donorName ? ` (${d.donorName})` : ""}` : (d.donorName ?? "—")}</p>
                    {d.email && <p className="text-xs text-muted-foreground">{d.email}</p>}
                    {d.tribute && <p className="text-xs font-semibold">{d.tribute.kind === "memory" ? "En memoria de" : "En honor de"} {d.tribute.name}</p>}
                    {d.message && <p className={d.hideMessage ? "text-xs text-muted-foreground line-through" : "text-xs"}>“{d.message}”</p>}
                  </td>
                  <td className="col-span-2 text-xs text-muted-foreground md:py-2.5 md:pr-3 md:text-sm md:text-foreground">{d.projectTitle}</td>
                  <td className="col-start-2 row-span-2 row-start-1 text-right whitespace-nowrap md:py-2.5 md:pr-3"> 
                    <p className="font-semibold">{formatAmount(d.amount, d.currency, "es")}</p>
                    {d.currency === "USD" && <p className="text-xs text-muted-foreground">{formatDop(d.amountDop, "es")}</p>}
                    {d.feeUsd ? <p className="text-xs text-muted-foreground">+ {formatUsd(d.feeUsd, "es")} comisión</p> : null}
                  </td>
                  <td className="text-xs md:py-2.5 md:pr-3 md:text-sm">{METHOD[d.method]}</td>
                  <td className="text-right md:py-2.5 md:pr-3 md:text-left">
                    {d.status === "paid" || d.status === "refunded" || d.status === "test" ? (
                      <Select
                        aria-label="Estado de la donación"
                        className="h-8 w-auto text-xs"
                        value={d.status}
                        onChange={(e) => changeStatus(d._id, e.target.value as "paid" | "refunded" | "test")}
                      >
                        <option value="paid">Pagada</option>
                        <option value="refunded">Reembolsada</option>
                        <option value="test">Prueba</option>
                      </Select>
                    ) : (
                      <Badge variant={STATUS[d.status].variant}>{STATUS[d.status].label}</Badge>
                    )}
                  </td>
                  <td className="col-span-2 flex justify-end gap-1 empty:hidden md:table-cell md:py-2.5 md:text-right md:whitespace-nowrap">
                    {d.message && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={d.hideMessage ? "Mostrar mensaje" : "Ocultar mensaje"}
                        title={d.hideMessage ? "Mostrar mensaje" : "Ocultar mensaje"}
                        onClick={() => setHide({ id: d._id, hideMessage: !d.hideMessage })}
                      >
                        {d.hideMessage ? <Eye /> : <EyeOff />}
                      </Button>
                    )}
                    {(d.method === "cash" || d.method === "transfer") &&
                      (confirmId === d._id ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            try { await removeManual({ id: d._id }); toast.success("Donación borrada."); }
                            catch (err) { toast.error(errorText(err)); }
                            setConfirmId(null);
                          }}
                        >
                          Confirmar borrar
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" aria-label="Borrar" title="Borrar" onClick={() => setConfirmId(d._id)}>
                          <Trash2 />
                        </Button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
