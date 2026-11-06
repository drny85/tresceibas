import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin, getAdminEmail } from "./lib/admin";
import { i18nText, fundUse } from "./schema";

export async function projectTotals(ctx: QueryCtx, projectId: Id<"projects">) {
  const paid = await ctx.db
    .query("donations")
    .withIndex("by_project_status", (q) => q.eq("projectId", projectId).eq("status", "paid"))
    .collect();
  return {
    raisedDop: paid.reduce((sum, d) => sum + d.amountDop, 0),
    donorCount: paid.length,
  };
}

async function withExtras(ctx: QueryCtx, p: Doc<"projects">) {
  const totals = await projectTotals(ctx, p._id);
  const imageUrl = p.imageId ? await ctx.storage.getUrl(p.imageId) : null;
  return { ...p, ...totals, imageUrl };
}

/** Public list: active and completed projects, in display order. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("projects").withIndex("by_order").collect();
    const visible = all.filter((p) => p.status !== "draft");
    return Promise.all(visible.map((p) => withExtras(ctx, p)));
  },
});

/** The project shown on the home page (featured, or the first active one). */
export const featured = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("projects").withIndex("by_order").collect();
    const p =
      all.find((x) => x.featured && x.status !== "draft") ??
      all.find((x) => x.status === "active");
    return p ? withExtras(ctx, p) : null;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const p = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!p) return null;
    if (p.status === "draft" && !(await getAdminEmail(ctx))) return null;
    return withExtras(ctx, p);
  },
});

/** Admin: every project including drafts. */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("projects").withIndex("by_order").collect();
    return Promise.all(all.map((p) => withExtras(ctx, p)));
  },
});

const projectFields = {
  slug: v.string(),
  title: i18nText,
  summary: i18nText,
  description: i18nText,
  goalDop: v.number(),
  uses: v.array(fundUse),
  imageId: v.optional(v.id("_storage")),
  status: v.union(v.literal("draft"), v.literal("active"), v.literal("completed")),
  featured: v.boolean(),
  order: v.number(),
};

export const save = mutation({
  args: { id: v.optional(v.id("projects")), ...projectFields },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    const slug = fields.slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      throw new Error("El enlace (slug) solo puede tener letras minúsculas, números y guiones.");
    }
    if (!(fields.goalDop > 0)) throw new Error("La meta debe ser mayor que cero.");
    const clash = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (clash && clash._id !== id) throw new Error("Ya existe un proyecto con ese enlace.");
    if (fields.featured) {
      for (const p of await ctx.db.query("projects").collect()) {
        if (p.featured && p._id !== id) await ctx.db.patch(p._id, { featured: false });
      }
    }
    const data = { ...fields, slug };
    if (id) {
      await ctx.db.replace(id, data);
      return id;
    }
    return await ctx.db.insert("projects", data);
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const anyDonation = await ctx.db
      .query("donations")
      .withIndex("by_project_status", (q) => q.eq("projectId", id))
      .first();
    if (anyDonation) {
      throw new Error("Este proyecto ya tiene donaciones. Márcalo como borrador en vez de eliminarlo.");
    }
    await ctx.db.delete(id);
  },
});
