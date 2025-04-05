import type { AnimationLoopOptions, UpdateCallback } from '../types/animation-loop.types';

export class AnimationLoop {
  private isRunning: boolean = false;

  private animationId: number = 0;

  private lastFrameTime: number = 0;

  private frameAccumulator: number = 0;

  private readonly frameTime: number;

  private readonly maxCyclesPerFrame: number;

  private readonly maxAccumulatedTime: number;

  constructor(
    private readonly updateCallback: UpdateCallback,
    options: AnimationLoopOptions = {},
  ) {
    const {
      fps = 60,
      maxCyclesPerFrame = 2,
      maxAccumulatedTime,
    } = options;

    this.frameTime = 1000 / fps;
    this.maxCyclesPerFrame = maxCyclesPerFrame;
    this.maxAccumulatedTime = maxAccumulatedTime ?? (this.frameTime * 3);
  }

  private calculateDeltaTime(currentTime: number): number {
    const deltaTime = currentTime - this.lastFrameTime;

    this.lastFrameTime = currentTime;

    return deltaTime;
  }

  private updateTimeAccumulator(deltaTime: number): void {
    this.frameAccumulator += deltaTime;
    this.frameAccumulator = Math.min(this.frameAccumulator, this.maxAccumulatedTime);
  }

  private shouldRunAnotherCycle(cyclesRun: number): boolean {
    return cyclesRun < this.maxCyclesPerFrame && this.frameAccumulator >= this.frameTime;
  }

  private updateCycleCounters(): void {
    this.frameAccumulator -= this.frameTime;
  }

  private processCycles(): void {
    let cyclesRun = 0;

    while (this.shouldRunAnotherCycle(cyclesRun)) {
      try {
        this.updateCallback(this.frameTime);
      } catch (error) {
        this.handleLoopError(error);

        return;
      }

      this.updateCycleCounters();
      cyclesRun += 1;
    }
  }

  private handleLoopError(error: unknown): void {
    console.error('Error in animation loop:', error);
    this.stop();
  }

  private scheduleNextFrame(): void {
    this.animationId = requestAnimationFrame(this.loop.bind(this));
  }

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.frameAccumulator = 0;

    this.scheduleNextFrame();
  }

  public stop(): void {
    if (!this.isRunning) return;

    cancelAnimationFrame(this.animationId);
    this.animationId = 0;
    this.isRunning = false;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = this.calculateDeltaTime(currentTime);

    this.updateTimeAccumulator(deltaTime);
    this.processCycles();
    this.scheduleNextFrame();
  }
}
