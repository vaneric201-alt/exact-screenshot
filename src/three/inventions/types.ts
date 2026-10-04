import type { SceneModule } from "../stage/stage";

/** A stretch of the scroll with its own caption. */
export interface Phase {
  from: number;
  to: number;
  title: string;
  text: string;
}

export interface InventionScene extends SceneModule {
  phases: Phase[];
}
