import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { requireAdmin } from "./lib/admin";
import { DEFAULT_FEES, DEFAULT_USD_TO_DOP } from "./lib/money";

export async function readSettings(ctx: QueryCtx) {
  const doc = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", "main"))
    .unique();
  return {
    usdToDop: doc?.usdToDop ?? DEFAULT_USD_TO_DOP,
    fees: doc?.fees ?? DEFAULT_FEES,
    whatsapp: doc?.whatsapp ?? null,
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
    if (doc) await ctx.db.patch(doc._id, args);
    else await ctx.db.insert("settings", { key: "main", ...args });
  },
});
