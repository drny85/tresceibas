"use client";

import { useQuery as useConvexQuery, type OptionalRestArgsOrSkip } from "convex/react";
import type { FunctionReference, FunctionReturnType } from "convex/server";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Convex's useQuery, but it reports "loading" until the page has hydrated.
 * The Convex client can receive data before React hydrates, which would make
 * the first client render differ from the server HTML.
 */
export function useQuery<Q extends FunctionReference<"query">>(
  query: Q,
  ...args: OptionalRestArgsOrSkip<Q>
): FunctionReturnType<Q> | undefined {
  const mounted = useMounted();
  const result = useConvexQuery(query, ...args);
  return mounted ? result : undefined;
}
