"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk-enabled";

// A placeholder keeps the build working before Convex is configured.
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder-not-configured.convex.cloud",
);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled) return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
