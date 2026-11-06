"use node";

import Stripe from "stripe";
import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { MAX_DONATION_USD, MIN_DONATION_USD } from "./lib/money";

const donorArgs = {
  projectId: v.id("projects"),
  amountUsd: v.number(),
  donorName: v.optional(v.string()),
  anonymous: v.boolean(),
  message: v.optional(v.string()),
  email: v.optional(v.string()),
  locale: v.union(v.literal("es"), v.literal("en")),
};

function cleanAmount(amountUsd: number) {
  const amount = Math.round(amountUsd * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN_DONATION_USD || amount > MAX_DONATION_USD) {
    throw new Error(`El monto debe estar entre ${MIN_DONATION_USD} y ${MAX_DONATION_USD} USD.`);
  }
  return amount;
}

function siteUrl() {
  const url = process.env.SITE_URL;
  if (!url) throw new Error("Falta SITE_URL en las variables de Convex.");
  return url.replace(/\/$/, "");
}

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta STRIPE_SECRET_KEY en las variables de Convex.");
  return new Stripe(key);
}

// ---------------- Stripe ----------------

/** Creates a pending donation and a Stripe Checkout page. Returns the page URL. */
export const createStripeCheckout = action({
  args: donorArgs,
  handler: async (ctx, { locale, amountUsd, ...donor }): Promise<string> => {
    const amount = cleanAmount(amountUsd);
    const pending = await ctx.runMutation(internal.donations.createPending, {
      ...donor,
      amountUsd: amount,
      method: "stripe",
    });
    const base = siteUrl();
    const session = await stripeClient().checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      locale,
      customer_email: donor.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(pending.netUsd * 100),
            product_data: {
              name:
                locale === "es"
                  ? `Donación: ${pending.projectTitle.es}`
                  : `Donation: ${pending.projectTitle.en}`,
              description: "Comunidad Tres Ceibas, Villa Magante, R.D.",
            },
          },
        },
        ...(pending.feeUsd > 0
          ? [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(pending.feeUsd * 100),
            product_data: {
              name: locale === "es" ? "Costo de procesamiento del pago" : "Payment processing fee",
              description:
                locale === "es"
                  ? "Lo cubres tú para que el proyecto reciba tu donación completa."
                  : "You cover it so the project receives your full donation.",
            },
          },
        },
          ]
          : []),
      ],
      metadata: { donationId: pending.id },
      payment_intent_data: { metadata: { donationId: pending.id } },
      success_url: `${base}/${locale}/donar/gracias?d=${pending.id}`,
      cancel_url: `${base}/${locale}/donar?proyecto=${pending.projectSlug}&cancelado=1`,
    });
    await ctx.runMutation(internal.donations.setExternalId, {
      id: pending.id,
      externalId: session.id,
    });
    if (!session.url) throw new Error("Stripe no devolvió la página de pago.");
    return session.url;
  },
});

/** Verifies a Stripe webhook and updates the matching donation. Called from http.ts. */
export const handleStripeWebhook = internalAction({
  args: { payload: v.string(), signature: v.string() },
  handler: async (ctx, { payload, signature }) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("Falta STRIPE_WEBHOOK_SECRET.");
    let event: Stripe.Event;
    try {
      event = await stripeClient().webhooks.constructEventAsync(payload, signature, secret);
    } catch {
      return { ok: false as const };
    }
    if (!event.type.startsWith("checkout.session.")) return { ok: true as const };
    const session = event.data.object as Stripe.Checkout.Session;
    const donationId = session.metadata?.donationId;
    if (!donationId) return { ok: true as const };
    const donation = await ctx.runQuery(internal.donations.byExternalId, { externalId: session.id });
    if (!donation || donation._id !== donationId) return { ok: true as const };

    if (
      (event.type === "checkout.session.completed" && session.payment_status === "paid") ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await ctx.runMutation(internal.donations.markPaid, {
        id: donation._id,
        chargedUsd: (session.amount_total ?? 0) / 100 || undefined,
      });
    } else if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      await ctx.runMutation(internal.donations.markFailed, { id: donation._id });
    }
    return { ok: true as const };
  },
});

// ---------------- PayPal ----------------

function paypalBase() {
  return (process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com").replace(/\/$/, "");
}

async function paypalToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal no está configurado.");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("No se pudo conectar con PayPal.");
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

/** Creates a pending donation and a PayPal order. Returns the PayPal order id. */
export const createPaypalOrder = action({
  args: donorArgs,
  handler: async (ctx, { locale, amountUsd, ...donor }): Promise<string> => {
    const amount = cleanAmount(amountUsd);
    const pending = await ctx.runMutation(internal.donations.createPending, {
      ...donor,
      amountUsd: amount,
      method: "paypal",
    });
    const token = await paypalToken();
    const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: pending.id,
            description: (locale === "es" ? pending.projectTitle.es : pending.projectTitle.en).slice(0, 127),
            amount: {
              currency_code: "USD",
              value: pending.chargedUsd.toFixed(2),
              breakdown: {
                item_total: { currency_code: "USD", value: pending.chargedUsd.toFixed(2) },
              },
            },
            items: [
              {
                name: (locale === "es" ? "Donación" : "Donation").slice(0, 127),
                quantity: "1",
                unit_amount: { currency_code: "USD", value: pending.netUsd.toFixed(2) },
                category: "DONATION",
              },
              ...(pending.feeUsd > 0 ? [{
                name: locale === "es" ? "Costo de procesamiento" : "Processing fee",
                quantity: "1",
                unit_amount: { currency_code: "USD", value: pending.feeUsd.toFixed(2) },
                category: "DONATION",
              }] : []),
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error("PayPal no pudo crear el pago.");
    const order = (await res.json()) as { id: string };
    await ctx.runMutation(internal.donations.setExternalId, { id: pending.id, externalId: order.id });
    return order.id;
  },
});

/** Captures an approved PayPal order and marks the donation as paid. Returns the donation id. */
export const capturePaypalOrder = action({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }): Promise<string> => {
    const donation = await ctx.runQuery(internal.donations.byExternalId, { externalId: orderId });
    if (!donation || donation.method !== "paypal") throw new Error("No encontramos esta donación.");
    if (donation.status === "paid") return donation._id;
    const token = await paypalToken();
    const res = await fetch(`${paypalBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const body = (await res.json()) as {
      status?: string;
      purchase_units?: { payments?: { captures?: { status: string; amount: { value: string; currency_code: string } }[] } }[];
    };
    const capture = body.purchase_units?.[0]?.payments?.captures?.[0];
    if (!res.ok || body.status !== "COMPLETED" || capture?.status !== "COMPLETED" || capture.amount.currency_code !== "USD") {
      await ctx.runMutation(internal.donations.markFailed, { id: donation._id });
      throw new Error("PayPal no completó el pago.");
    }
    await ctx.runMutation(internal.donations.markPaid, {
      id: donation._id,
      chargedUsd: Number(capture.amount.value),
    });
    return donation._id;
  },
});
