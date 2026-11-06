"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Today's date as YYYY-MM-DD in the visitor's browser; empty while prerendering. */
export function useToday() {
  return useSyncExternalStore(
    subscribe,
    () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    },
    () => "",
  );
}
