import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireAdmin } from "./lib/admin";
import { readSettings } from "./settings";
import { coverFee, round2, roundDop } from "./lib/money";

/** The fields of a donation that anyone may see. Email and ids stay private. */
function publicView(d: Doc<"donations">) {
  return {
    _id: d._id,
    _creationTime: d._creationTime,
    name: d.anonymous ? null : (d.donorName ?? null),
    amount: d.amount,
    currency: d.currency,
    amountDop: d.amountDop,
    message: d.hideMessage ? null : (d.message ?? null),
    paidAt: d.paidAt ?? d._creationTime,
  };
}

/** Donor wall for one project, newest first. */
export const listForProject = query({
  args: { projectId: v.id("projects"), limit: v.optional(v.number()) },
  handler: async (ctx, { projectId, limit }) => {
    const rows = await ctx.db
      .query("donations")
      .withIndex("by_project_status", (q) => q.eq("projectId", projectId).eq("status", "paid"))
      .order("desc")
      .take(Math.min(limit ?? 50, 200));
    return rows.map(publicView);
  },
});

/** Most recent donations across all projects, for the home page. */
export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const rows = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "paid"))
      .order("desc")
      .take(Math.min(limit ?? 8, 50));
    return Promise.all(
      rows.map(async (d) => {
        const p = await ctx.db.get(d.projectId);
        return { ...publicView(d), project: p ? { slug: p.slug, title: p.title } : null };
      }),
    );
  },
});

/** Used by the thank-you page to show whether a payment went through. */
export const receipt = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const donationId = ctx.db.normalizeId("donations", id);
    if (!donationId) return null;
    const d = await ctx.db.get(donationId);
    if (!d) return null;
    const p = await ctx.db.get(d.projectId);
    return {
      status: d.status,
      amount: d.amount,
      currency: d.currency,
      amountDop: d.amountDop,
      project: p ? { slug: p.slug, title: p.title } : null,
    };
  },
});

// ---------- used by payment actions ----------

export const createPending = internalMutation({
  args: {
    projectId: v.id("projects"),
    donorName: v.optional(v.string()),
    anonymous: v.boolean(),
    message: v.optional(v.string()),
    email: v.optional(v.string()),
    amountUsd: v.number(),
    method: v.union(v.literal("stripe"), v.literal("paypal")),
  },
  handler: async (ctx, { amountUsd, ...rest }) => {
    const project = await ctx.db.get(rest.projectId);
    if (!project || project.status !== "active") {
      throw new Error("Este proyecto no está recibiendo donaciones.");
    }
    const { usdToDop, fees } = await readSettings(ctx);
    // The donor covers the processing fee, so the project receives exactly amountUsd.
    const { netUsd, feeUsd, chargedUsd } = coverFee(amountUsd, fees[rest.method]);
    const id = await ctx.db.insert("donations", {
      ...rest,
      donorName: rest.donorName?.trim().slice(0, 80) || undefined,
      message: rest.message?.trim().slice(0, 280) || undefined,
      amount: netUsd,
      feeUsd,
      chargedUsd,
      currency: "USD",
      rate: usdToDop,
      amountDop: roundDop(netUsd * usdToDop),
      status: "pending",
      hideMessage: false,
    });
    return { id, projectTitle: project.title, projectSlug: project.slug, netUsd, feeUsd, chargedUsd };
  },
});

export const setExternalId = internalMutation({
  args: { id: v.id("donations"), externalId: v.string() },
  handler: async (ctx, { id, externalId }) => {
    await ctx.db.patch(id, { externalId });
  },
});

export const byExternalId = internalQuery({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) =>
    ctx.db
      .query("donations")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique(),
});

/**
 * Marks a donation as paid. Safe to call twice (webhooks can repeat).
 * `chargedUsd` is what the processor actually charged, fee included.
 */
export const markPaid = internalMutation({
  args: { id: v.id("donations"), chargedUsd: v.optional(v.number()) },
  handler: async (ctx, { id, chargedUsd }) => {
    const d = await ctx.db.get(id);
    if (!d || d.status === "paid") return;
    const patch: Partial<Doc<"donations">> = { status: "paid", paidAt: Date.now() };
    const expected = d.chargedUsd ?? d.amount;
    if (chargedUsd !== undefined && Math.abs(chargedUsd - expected) > 0.001) {
      // Trust what was actually charged; the fee part stays the same.
      const net = round2(Math.max(0, chargedUsd - (d.feeUsd ?? 0)));
      patch.chargedUsd = chargedUsd;
      patch.amount = net;
      patch.amountDop = roundDop(net * d.rate);
    }
    await ctx.db.patch(id, patch);
  },
});

export const markFailed = internalMutation({
  args: { id: v.id("donations") },
  handler: async (ctx, { id }) => {
    const d = await ctx.db.get(id);
    if (d && d.status === "pending") await ctx.db.patch(id, { status: "failed" });
  },
});

// ---------- admin ----------

export const listAll = query({
  args: { status: v.optional(v.union(v.literal("pending"), v.literal("paid"), v.literal("failed"))) },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    const rows = status
      ? await ctx.db.query("donations").withIndex("by_status", (q) => q.eq("status", status)).order("desc").take(500)
      : await ctx.db.query("donations").order("desc").take(500);
    return Promise.all(
      rows.map(async (d) => {
        const p = await ctx.db.get(d.projectId);
        return { ...d, projectTitle: p?.title.es ?? "—" };
      }),
    );
  },
});

/** Cash or bank transfers received in person. */
export const addManual = mutation({
  args: {
    projectId: v.id("projects"),
    donorName: v.optional(v.string()),
    anonymous: v.boolean(),
    message: v.optional(v.string()),
    amount: v.number(),
    currency: v.union(v.literal("USD"), v.literal("DOP")),
    method: v.union(v.literal("cash"), v.literal("transfer")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!(args.amount > 0)) throw new Error("El monto debe ser mayor que cero.");
    const { usdToDop } = await readSettings(ctx);
    const rate = args.currency === "USD" ? usdToDop : 1;
    return await ctx.db.insert("donations", {
      ...args,
      donorName: args.donorName?.trim() || undefined,
      message: args.message?.trim() || undefined,
      rate,
      amountDop: roundDop(args.amount * rate),
      status: "paid",
      paidAt: Date.now(),
      hideMessage: false,
      recordedBy: admin,
    });
  },
});

export const setHideMessage = mutation({
  args: { id: v.id("donations"), hideMessage: v.boolean() },
  handler: async (ctx, { id, hideMessage }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { hideMessage });
  },
});

/** Only manual entries can be deleted; card payments stay for the record. */
export const removeManual = mutation({
  args: { id: v.id("donations") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const d = await ctx.db.get(id);
    if (!d) return;
    if (d.method !== "cash" && d.method !== "transfer") {
      throw new Error("Los pagos con tarjeta o PayPal no se pueden borrar desde aquí.");
    }
    await ctx.db.delete(id);
  },
});
