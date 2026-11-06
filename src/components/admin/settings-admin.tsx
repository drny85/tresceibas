"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { coverFee } from "@convex/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, errorText } from "./fields";
import { formatUsd } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

type Settings = NonNullable<ReturnType<typeof useQuery<typeof api.settings.get>>>;

function SettingsForm({ initial }: { initial: Settings }) {
  const update = useMutation(api.settings.update);
  const [rate, setRate] = useState(String(initial.usdToDop));
  const [sp, setSp] = useState(String(initial.fees.stripe.percent));
  const [sf, setSf] = useState(String(initial.fees.stripe.fixedUsd));
  const [pp, setPp] = useState(String(initial.fees.paypal.percent));
  const [pf, setPf] = useState(String(initial.fees.paypal.fixedUsd));
  const [wa, setWa] = useState(initial.whatsapp ?? "");
  const [waName, setWaName] = useState(initial.whatsappName ?? "");
  const [email, setEmail] = useState(initial.contactEmail ?? "");
  const [busy, setBusy] = useState(false);
  const example = coverFee(100, { percent: Number(sp) || 0, fixedUsd: Number(sf) || 0 });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await update({
        usdToDop: Number(rate),
        fees: {
          stripe: { percent: Number(sp), fixedUsd: Number(sf) },
          paypal: { percent: Number(pp), fixedUsd: Number(pf) },
        },
        whatsapp: wa,
        whatsappName: waName,
        contactEmail: email,
      });
      toast.success("Ajustes guardados.");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tasa del dólar</CardTitle>
          <CardDescription>Se usa para convertir a pesos las donaciones en dólares. Cada donación guarda la tasa del día en que se hizo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field label="1 USD equivale a (RD$)" htmlFor="s-rate" className="max-w-xs">
            <Input id="s-rate" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Comisiones que paga el donante</CardTitle>
          <CardDescription>
            Se suman al total para que el proyecto reciba la donación completa. Con estos valores, una donación de $100 por Stripe se cobra {formatUsd(example.chargedUsd, "es")}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Stripe: porcentaje" htmlFor="s-sp"><Input id="s-sp" inputMode="decimal" value={sp} onChange={(e) => setSp(e.target.value)} /></Field>
          <Field label="Stripe: fijo (USD)" htmlFor="s-sf"><Input id="s-sf" inputMode="decimal" value={sf} onChange={(e) => setSf(e.target.value)} /></Field>
          <Field label="PayPal: porcentaje" htmlFor="s-pp"><Input id="s-pp" inputMode="decimal" value={pp} onChange={(e) => setPp(e.target.value)} /></Field>
          <Field label="PayPal: fijo (USD)" htmlFor="s-pf"><Input id="s-pf" inputMode="decimal" value={pf} onChange={(e) => setPf(e.target.value)} /></Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
          <CardDescription>El botón «Escríbenos por WhatsApp» del sitio abre una conversación con este número. Déjalo vacío para ocultarlo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="WhatsApp" htmlFor="s-wa" hint={waLink(wa) ? `Abre ${waLink(wa)}` : "Sin número, no se muestra el botón."}>
            <Input id="s-wa" type="tel" inputMode="tel" placeholder="809-512-9949" value={wa} onChange={(e) => setWa(e.target.value)} />
          </Field>
          <Field label="Quién responde" htmlFor="s-wa-name"><Input id="s-wa-name" placeholder="Griselda" value={waName} onChange={(e) => setWaName(e.target.value)} /></Field>
          <Field label="Correo (opcional)" htmlFor="s-email"><Input id="s-email" type="email" placeholder="comite@tresceibas.org" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        </CardContent>
      </Card>
      <Button type="submit" disabled={busy} className="w-fit">Guardar ajustes</Button>
    </form>
  );
}

export function SettingsAdmin() {
  const settings = useQuery(api.settings.get);
  if (!settings) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  return <SettingsForm initial={settings} />;
}
