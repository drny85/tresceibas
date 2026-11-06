import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Text stored in both site languages. Spanish is the primary language. */
export const i18nText = v.object({ es: v.string(), en: v.string() });

export const fundUse = v.object({
  label: i18nText,
  amountDop: v.number(),
});

export const scheduleDay = v.object({
  day: i18nText,
  items: v.array(
    v.object({
      time: v.string(),
      label: i18nText,
      responsible: v.optional(v.string()),
    }),
  ),
});

export const activityCategory = v.union(
  v.literal("cultural"),
  v.literal("religious"),
  v.literal("sports"),
  v.literal("community"),
);

export default defineSchema({
  projects: defineTable({
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
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  activities: defineTable({
    slug: v.string(),
    title: i18nText,
    summary: i18nText,
    description: i18nText,
    startDate: v.string(), // ISO date, e.g. 2027-02-19
    endDate: v.string(),
    location: v.string(),
    projectId: v.optional(v.id("projects")),
    schedule: v.array(scheduleDay),
    imageId: v.optional(v.id("_storage")),
    published: v.boolean(),
    // Optional details for a single activity inside a larger event's program.
    parentId: v.optional(v.id("activities")),
    startTime: v.optional(v.string()), // 24-hour "HH:mm"; empty means all day
    endTime: v.optional(v.string()),
    time: v.optional(v.string()), // older free-text time, replaced by startTime
    category: v.optional(activityCategory),
    responsible: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_startDate", ["startDate"])
    .index("by_parent", ["parentId"]),

  donations: defineTable({
    projectId: v.id("projects"),
    donorName: v.optional(v.string()),
    anonymous: v.boolean(),
    message: v.optional(v.string()),
    email: v.optional(v.string()), // never shown publicly
    amount: v.number(), // what the project receives, in the original currency
    feeUsd: v.optional(v.number()), // processing fee the donor chose to cover
    chargedUsd: v.optional(v.number()), // amount + fee, what the card was charged
    currency: v.union(v.literal("USD"), v.literal("DOP")),
    amountDop: v.number(),
    rate: v.number(), // USD -> DOP rate used for amountDop
    method: v.union(
      v.literal("stripe"),
      v.literal("paypal"),
      v.literal("cash"),
      v.literal("transfer"),
    ),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
    externalId: v.optional(v.string()),
    hideMessage: v.boolean(),
    paidAt: v.optional(v.number()),
    recordedBy: v.optional(v.string()),
  })
    .index("by_project_status", ["projectId", "status"])
    .index("by_status", ["status"])
    .index("by_externalId", ["externalId"]),

  committee: defineTable({
    name: v.string(),
    role: i18nText,
    order: v.number(),
    imageId: v.optional(v.id("_storage")),
  }).index("by_order", ["order"]),

  settings: defineTable({
    key: v.literal("main"),
    usdToDop: v.number(),
    fees: v.optional(
      v.object({
        stripe: v.object({ percent: v.number(), fixedUsd: v.number() }),
        paypal: v.object({ percent: v.number(), fixedUsd: v.number() }),
      }),
    ),
    whatsapp: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
  }).index("by_key", ["key"]),
});
