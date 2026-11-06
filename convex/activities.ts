import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireAdmin, getAdminEmail } from "./lib/admin";
import { i18nText, scheduleDay } from "./schema";

async function withExtras(ctx: QueryCtx, a: Doc<"activities">) {
  const imageUrl = a.imageId ? await ctx.storage.getUrl(a.imageId) : null;
  const project = a.projectId ? await ctx.db.get(a.projectId) : null;
  return {
    ...a,
    imageUrl,
    project: project ? { slug: project.slug, title: project.title } : null,
  };
}

/** Published activities, soonest first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("activities").withIndex("by_startDate").collect();
    return Promise.all(all.filter((a) => a.published).map((a) => withExtras(ctx, a)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const a = await ctx.db
      .query("activities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!a) return null;
    if (!a.published && !(await getAdminEmail(ctx))) return null;
    return withExtras(ctx, a);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("activities").withIndex("by_startDate").collect();
    return Promise.all(all.map((a) => withExtras(ctx, a)));
  },
});

export const save = mutation({
  args: {
    id: v.optional(v.id("activities")),
    slug: v.string(),
    title: i18nText,
    summary: i18nText,
    description: i18nText,
    startDate: v.string(),
    endDate: v.string(),
    location: v.string(),
    projectId: v.optional(v.id("projects")),
    schedule: v.array(scheduleDay),
    imageId: v.optional(v.id("_storage")),
    published: v.boolean(),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    const slug = fields.slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      throw new Error("El enlace (slug) solo puede tener letras minúsculas, números y guiones.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(fields.endDate)) {
      throw new Error("Las fechas deben tener el formato AAAA-MM-DD.");
    }
    if (fields.endDate < fields.startDate) throw new Error("La fecha final no puede ser antes de la inicial.");
    const clash = await ctx.db
      .query("activities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (clash && clash._id !== id) throw new Error("Ya existe una actividad con ese enlace.");
    const data = { ...fields, slug };
    if (id) {
      await ctx.db.replace(id, data);
      return id;
    }
    return await ctx.db.insert("activities", data);
  },
});

export const remove = mutation({
  args: { id: v.id("activities") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
