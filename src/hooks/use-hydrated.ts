import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false on the server and during hydration, true once mounted in the browser. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
