import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";

/**
 * Admins are listed by email in the ADMIN_EMAILS environment variable of the
 * Convex deployment, comma separated (e.g. "robert@example.com,miembro@example.com").
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminEmail(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.toLowerCase();
  if (!email || !adminEmails().includes(email)) return null;
  return email;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const email = await getAdminEmail(ctx);
  if (!email) throw new Error("Solo los administradores pueden hacer esto.");
  return email;
}
