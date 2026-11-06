/**
 * Clerk is only needed for the admin. Without keys the public site still runs
 * (useful for a first local preview); the admin page explains what is missing.
 */
export const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
