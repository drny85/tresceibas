import { query } from "./_generated/server";
import { getAdminEmail } from "./lib/admin";

/** Whether the signed-in user may use the admin panel. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { signedIn: false, isAdmin: false } as const;
    const email = await getAdminEmail(ctx);
    return { signedIn: true, isAdmin: email !== null, email: identity.email ?? null } as const;
  },
});
