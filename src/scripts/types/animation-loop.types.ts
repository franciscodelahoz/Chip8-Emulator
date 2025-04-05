export interface AnimationLoopOptions {
  fps?: number;
  maxCyclesPerFrame?: number;
  maxAccumulatedTime?: number;
}

export type UpdateCallback = (deltaTime: number) => void;
