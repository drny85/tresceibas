import type { AuthConfig } from "convex/server";

// Set CLERK_JWT_ISSUER_DOMAIN on the Convex deployment (Clerk > Configure > Convex integration).
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
