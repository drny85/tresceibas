import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./lib/admin";
import { i18nText } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("committee").withIndex("by_order").collect();
    return Promise.all(
      members.map(async (m) => ({
        ...m,
        imageUrl: m.imageId ? await ctx.storage.getUrl(m.imageId) : null,
      })),
    );
  },
});

export const save = mutation({
  args: {
    id: v.optional(v.id("committee")),
    name: v.string(),
    role: i18nText,
    order: v.number(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    if (!fields.name.trim()) throw new Error("Escribe el nombre.");
    if (id) {
      await ctx.db.replace(id, fields);
      return id;
    }
    return await ctx.db.insert("committee", fields);
  },
});

export const remove = mutation({
  args: { id: v.id("committee") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
