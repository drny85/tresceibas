"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { useQuery } from "@/hooks/use-live-query";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { CreditCard, Lock, Loader2, Wallet } from "lucide-react";
import { api } from "@convex/_generated/api";
import { coverFee, MAX_DONATION_USD, MIN_DONATION_USD, DEFAULT_FEES } from "@convex/lib/money";
import { useI18n, pick, fill } from "@/i18n/provider";
import { Container } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDop, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRESETS = [10, 25, 50, 100, 250];
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

type Method = "stripe" | "paypal";

export function DonateView() {
  const { locale, dict } = useI18n();
  const t = dict.donate;
  const router = useRouter();
  const search = useSearchParams();
  const projects = useQuery(api.projects.list);
  const settings = useQuery(api.settings.get);
  const startStripe = useAction(api.payments.createStripeCheckout);
  const createPaypal = useAction(api.payments.createPaypalOrder);
  const capturePaypal = useAction(api.payments.capturePaypalOrder);

  const active = useMemo(() => (projects ?? []).filter((p) => p.status === "active"), [projects]);
  const [slug, setSlug] = useState<string | null>(search.get("proyecto"));
  // ?monto=50 (from the projects page) preselects that amount.
  const linked = Number(search.get("monto"));
  const linkedOk = Number.isFinite(linked) && linked >= MIN_DONATION_USD && linked <= MAX_DONATION_USD;
  const [preset, setPreset] = useState<number | null>(linkedOk && PRESETS.includes(linked) ? linked : linkedOk ? null : 25);
  const [custom, setCustom] = useState(linkedOk && !PRESETS.includes(linked) ? String(linked) : "");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [dedicate, setDedicate] = useState(false);
  const [tributeKind, setTributeKind] = useState<"honor" | "memory">("honor");
  const [tributeName, setTributeName] = useState("");
  const [method, setMethod] = useState<Method>("stripe");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(search.get("cancelado") ? t.cancelled : null);

  const project = active.find((p) => p.slug === slug) ?? active[0];
  const amount = preset ?? Number(custom.replace(",", "."));
  const amountOk = Number.isFinite(amount) && amount >= MIN_DONATION_USD && amount <= MAX_DONATION_USD;
  const rate = settings?.usdToDop ?? 60;
  const fees = settings?.fees ?? DEFAULT_FEES;
  const breakdown = amountOk ? coverFee(amount, fees[method]) : null;

  function validate() {
    if (!project) return t.errorProject;
    if (!amountOk) return t.errorAmount;
    if (!anonymous && !name.trim()) return t.errorName;
    if (dedicate && !tributeName.trim()) return t.errorTribute;
    return null;
  }

  const donor = () => ({
    projectId: project!._id,
    amountUsd: amount,
    donorName: anonymous ? undefined : name.trim(),
    anonymous,
    message: message.trim() || undefined,
    email: email.trim() || undefined,
    tribute: dedicate && tributeName.trim() ? { kind: tributeKind, name: tributeName.trim() } : undefined,
    locale,
  });

  async function payWithStripe(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      const url = await startStripe(donor());
      window.location.assign(url);
    } catch (err) {
      console.error(err);
      setError(t.errorGeneric);
      setBusy(false);
    }
  }

  if (projects !== undefined && active.length === 0) {
    return (
      <Container>
        <p className="text-muted-foreground">{t.noProjects}</p>
      </Container>
    );
  }

  return (
    <Container className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <form onSubmit={payWithStripe} className="grid content-start gap-7 sm:gap-8" noValidate>
        {active.length > 1 && (
          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-semibold">{t.project}</legend>
            <div className="grid gap-2">
              {active.map((p) => (
                <label
                  key={p._id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/20",
                  )}
                >
                  <input type="radio" name="project" className="accent-[var(--primary)]" checked={project?._id === p._id} onChange={() => setSlug(p.slug)} />
                  <span className="font-semibold">{pick(p.title, locale)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="grid gap-3">
          <legend className="mb-3 text-sm font-semibold">{t.amount}</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {PRESETS.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => { setPreset(v); setCustom(""); }}
                aria-pressed={preset === v}
                className={cn(
                  "tabular h-12 rounded-xl border border-border bg-card font-display text-lg font-bold transition-colors hover:border-primary cursor-pointer",
                  preset === v && "border-primary bg-primary text-primary-foreground",
                )}
              >
                ${v}
              </button>
            ))}
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-bold text-muted-foreground">$</span>
              <Input
                id="custom-amount"
                inputMode="decimal"
                aria-label={t.otherAmount}
                placeholder={t.otherShort}
                value={custom}
                onFocus={() => setPreset(null)}
                onChange={(e) => { setPreset(null); setCustom(e.target.value.replace(/[^\d.,]/g, "")); }}
                className={cn("tabular h-12 rounded-xl pl-7 font-bold", preset === null && "border-primary")}
              />
            </div>
          </div>
          {amountOk && (
            <p className="tabular text-sm text-muted-foreground">{fill(t.approx, { dop: formatDop(amount * rate, locale) })}</p>
          )}
        </fieldset>

        <div className="grid gap-5">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
            <div className="grid gap-1">
              <Label htmlFor="anonymous">{t.anonymous}</Label>
              <p className="text-sm text-muted-foreground">{t.anonymousHelp}</p>
            </div>
            <Switch id="anonymous" checked={anonymous} onCheckedChange={setAnonymous} />
          </div>
          {!anonymous && (
            <div className="grid gap-2">
              <Label htmlFor="donor-name">{t.name}</Label>
              <Input id="donor-name" autoComplete="name" maxLength={80} placeholder={t.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="donor-email">{t.email}</Label>
            <Input id="donor-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="text-xs text-muted-foreground">{t.emailHelp}</p>
          </div>
          <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1">
                <Label htmlFor="dedicate">{t.dedicate}</Label>
                <p className="text-sm text-muted-foreground">{t.dedicateHelp}</p>
              </div>
              <Switch id="dedicate" checked={dedicate} onCheckedChange={setDedicate} />
            </div>
            {dedicate && (
              <div className="grid gap-3">
                <div role="radiogroup" aria-label={t.dedicate} className="grid grid-cols-2 gap-2">
                  {(["honor", "memory"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={tributeKind === k}
                      onClick={() => setTributeKind(k)}
                      className={cn(
                        "min-h-11 rounded-lg border px-3 text-sm font-semibold transition-colors",
                        tributeKind === k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                      )}
                    >
                      {k === "honor" ? t.inHonor : t.inMemory}
                    </button>
                  ))}
                </div>
                <Input
                  aria-label={t.tributeName}
                  maxLength={80}
                  placeholder={tributeKind === "honor" ? t.tributeHonorPlaceholder : t.tributeMemoryPlaceholder}
                  value={tributeName}
                  onChange={(e) => setTributeName(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="donor-message">{t.message}</Label>
            <Textarea id="donor-message" maxLength={280} placeholder={t.messagePlaceholder} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>

        {PAYPAL_CLIENT_ID && (
          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-semibold">{t.method}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                ["stripe", t.card, t.cardHelp, CreditCard],
                ["paypal", t.paypal, t.paypalHelp, Wallet],
              ] as const).map(([value, label, help, Icon]) => (
                <label key={value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/20">
                  <input type="radio" name="method" className="mt-1 accent-[var(--primary)]" checked={method === value} onChange={() => setMethod(value)} />
                  <span className="grid gap-0.5">
                    <span className="flex items-center gap-2 font-semibold"><Icon className="size-4" /> {label}</span>
                    <span className="text-sm text-muted-foreground">{help}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        <div className="tabular grid gap-1.5 rounded-xl bg-muted/60 p-4 text-sm lg:hidden" aria-live="polite">
          <div className="flex justify-between gap-4">
            <span>{t.projectGets}</span>
            <span className="font-semibold">{breakdown ? formatUsd(breakdown.netUsd, locale) : "—"}</span>
          </div>
          <div className="flex justify-between gap-4 text-muted-foreground">
            <span>{fill(t.fee, { method: method === "stripe" ? t.stripeName : t.paypalName })}</span>
            <span>{breakdown ? formatUsd(breakdown.feeUsd, locale) : "—"}</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-2">
            <span className="font-bold">{t.total}</span>
            <span className="font-display text-lg font-extrabold">{breakdown ? formatUsd(breakdown.chargedUsd, locale) : "—"}</span>
          </div>
        </div>

        {method === "stripe" || !PAYPAL_CLIENT_ID ? (
          <Button type="submit" variant="donate" size="lg" disabled={busy || !project} className="h-14 w-full text-lg lg:h-12 lg:w-auto lg:text-base">
            {busy ? <><Loader2 className="animate-spin" /> {t.processing}</> : fill(t.submit, { amount: breakdown ? formatUsd(breakdown.chargedUsd, locale) : "" })}
          </Button>
        ) : (
          <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture", locale: locale === "es" ? "es_US" : "en_US" }}>
            <PayPalButtons
              style={{ layout: "vertical", shape: "pill", label: "donate" }}
              forceReRender={[amount, project?._id, anonymous, name, message, email, dedicate, tributeKind, tributeName]}
              createOrder={async () => {
                const problem = validate();
                setError(problem);
                if (problem) throw new Error(problem);
                return await createPaypal(donor());
              }}
              onApprove={async (data) => {
                try {
                  const id = await capturePaypal({ orderId: data.orderID });
                  router.push(`/${locale}/donar/gracias?d=${id}`);
                } catch {
                  setError(t.errorGeneric);
                }
              }}
              onError={() => setError((e) => e ?? t.errorGeneric)}
            />
          </PayPalScriptProvider>
        )}
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="size-3.5" /> {t.secure}</p>
      </form>

      <aside className="grid content-start gap-5 lg:sticky lg:top-24">
        <div className="hidden gap-4 rounded-2xl border border-border bg-card p-6 lg:grid">
          {project && <p className="font-display text-xl font-bold leading-tight">{pick(project.title, locale)}</p>}
          <dl className="tabular grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt>{t.projectGets}</dt>
              <dd className="font-semibold">{breakdown ? formatUsd(breakdown.netUsd, locale) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 text-muted-foreground">
              <dt>{fill(t.fee, { method: method === "stripe" ? t.stripeName : t.paypalName })}</dt>
              <dd>{breakdown ? formatUsd(breakdown.feeUsd, locale) : "—"}</dd>
            </div>
            <div className="mt-1 flex justify-between gap-4 border-t border-border pt-3 text-base">
              <dt className="font-bold">{t.total}</dt>
              <dd className="font-display text-xl font-extrabold">{breakdown ? formatUsd(breakdown.chargedUsd, locale) : "—"}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">{t.feeHelp}</p>
        </div>
        <div className="rounded-2xl border border-dashed border-border p-5">
          <p className="font-semibold">{t.localTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">{t.localBody}</p>
        </div>
      </aside>
    </Container>
  );
}
