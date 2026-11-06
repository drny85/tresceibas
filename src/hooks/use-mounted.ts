"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during prerender and hydration, true once running in the browser. */
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
