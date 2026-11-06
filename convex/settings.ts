import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { requireAdmin } from "./lib/admin";
import { DEFAULT_FEES, DEFAULT_USD_TO_DOP } from "./lib/money";

const DEFAULT_WHATSAPP = "809-512-9949";
const DEFAULT_WHATSAPP_NAME = "Griselda";

export async function readSettings(ctx: QueryCtx) {
  const doc = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", "main"))
    .unique();
  return {
    usdToDop: doc?.usdToDop ?? DEFAULT_USD_TO_DOP,
    fees: doc?.fees ?? DEFAULT_FEES,
    // Griselda Polanco (committee) answers the community WhatsApp unless changed in Ajustes.
    whatsapp: doc ? (doc.whatsapp ?? null) : DEFAULT_WHATSAPP,
    whatsappName:
      doc?.whatsappName ??
      (!doc || doc.whatsapp?.replace(/\D/g, "").endsWith(DEFAULT_WHATSAPP.replace(/\D/g, "")) ? DEFAULT_WHATSAPP_NAME : null),
    contactEmail: doc?.contactEmail ?? null,
  };
}

export const get = query({ args: {}, handler: (ctx) => readSettings(ctx) });
export const getInternal = internalQuery({ args: {}, handler: (ctx) => readSettings(ctx) });

export const update = mutation({
  args: {
    usdToDop: v.number(),
    fees: v.object({
      stripe: v.object({ percent: v.number(), fixedUsd: v.number() }),
      paypal: v.object({ percent: v.number(), fixedUsd: v.number() }),
    }),
    whatsapp: v.optional(v.string()),
    whatsappName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!(args.usdToDop > 0)) throw new Error("La tasa debe ser mayor que cero.");
    for (const f of [args.fees.stripe, args.fees.paypal]) {
      if (f.percent < 0 || f.percent >= 20 || f.fixedUsd < 0 || f.fixedUsd > 5) {
        throw new Error("Revisa las comisiones: el porcentaje debe estar entre 0 y 20, y el fijo entre 0 y 5 USD.");
      }
    }
    const doc = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();
    const clean = {
      ...args,
      whatsapp: args.whatsapp?.trim() || undefined,
      whatsappName: args.whatsappName?.trim() || undefined,
      contactEmail: args.contactEmail?.trim() || undefined,
    };
    if (clean.whatsapp && clean.whatsapp.replace(/\D/g, "").length < 10) {
      throw new Error("Revisa el número de WhatsApp: debe tener al menos 10 dígitos.");
    }
    if (doc) await ctx.db.replace(doc._id, { key: "main", ...clean });
    else await ctx.db.insert("settings", { key: "main", ...clean });
  },
});
