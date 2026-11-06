import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireAdmin, getAdminEmail } from "./lib/admin";
import { activityCategory, i18nText, scheduleDay } from "./schema";
import { TIME_RE, parseLegacyTime, toMinutes } from "./lib/time";

async function withExtras(ctx: QueryCtx, a: Doc<"activities">) {
  const imageUrl = a.imageId ? await ctx.storage.getUrl(a.imageId) : null;
  const project = a.projectId ? await ctx.db.get(a.projectId) : null;
  const parent = a.parentId ? await ctx.db.get(a.parentId) : null;
  return {
    ...a,
    imageUrl,
    project: project ? { slug: project.slug, title: project.title } : null,
    parent: parent && parent.published ? { slug: parent.slug, title: parent.title } : null,
  };
}

export function byWhen(a: Doc<"activities">, b: Doc<"activities">) {
  const start = (x: Doc<"activities">) => toMinutes(x.startTime ?? parseLegacyTime(x.time));
  return a.startDate.localeCompare(b.startDate) || start(a) - start(b);
}

/** Published activities, soonest first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("activities").withIndex("by_startDate").collect();
    return Promise.all(all.filter((a) => a.published).sort(byWhen).map((a) => withExtras(ctx, a)));
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
    const children = await ctx.db
      .query("activities")
      .withIndex("by_parent", (q) => q.eq("parentId", a._id))
      .collect();
    const program = children.filter((c) => c.published).sort(byWhen);
    return { ...(await withExtras(ctx, a)), program };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("activities").withIndex("by_startDate").collect();
    return Promise.all(all.sort(byWhen).map((a) => withExtras(ctx, a)));
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
    parentId: v.optional(v.id("activities")),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    category: v.optional(activityCategory),
    responsible: v.optional(v.string()),
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
    for (const t of [fields.startTime, fields.endTime]) {
      if (t && !TIME_RE.test(t)) throw new Error("La hora debe tener el formato HH:MM.");
    }
    if (fields.endTime && !fields.startTime) throw new Error("Elige la hora de inicio antes de la hora final.");
    if (fields.startTime && fields.endTime && fields.startDate === fields.endDate && fields.endTime <= fields.startTime) {
      throw new Error("La hora final debe ser después de la hora de inicio.");
    }
    if (fields.parentId && fields.parentId === id) throw new Error("Una actividad no puede ser parte de sí misma.");
    if (fields.parentId) {
      const parent = await ctx.db.get(fields.parentId);
      if (!parent) throw new Error("El evento principal no existe.");
      if (parent.parentId) throw new Error("El evento principal no puede ser a su vez parte de otro evento.");
    }
    const data = {
      ...fields,
      slug,
      startTime: fields.startTime || undefined,
      endTime: fields.startTime ? fields.endTime || undefined : undefined,
      responsible: fields.responsible?.trim() || undefined,
    };
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
    const child = await ctx.db
      .query("activities")
      .withIndex("by_parent", (q) => q.eq("parentId", id))
      .first();
    if (child) throw new Error("Este evento tiene actividades en su programa. Bórralas o muévelas primero.");
    await ctx.db.delete(id);
  },
});
