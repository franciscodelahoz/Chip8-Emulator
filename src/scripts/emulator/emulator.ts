import { CPU } from './cpu';
import type { Chip8Quirks } from '../constants/chip8.constants';
import { Chip8CpuEvents, EmulatorEvents } from '../constants/chip8.constants';
import type { Chip8EmulatorProps, EmulatorFontAppearance } from '../types/emulator';
import { AudioInterface } from './interfaces/audio';
import { DisplayInterface } from './interfaces/display';
import { KeyBoardInterface } from './interfaces/keyboard';
import { EmulatorState } from '../constants/emulator.constants';
import { AnimationLoop } from '../libraries/animation-loop';

export class Chip8Emulator extends EventTarget {
  private readonly displayInstance: DisplayInterface;

  private readonly keyboardInstance: KeyBoardInterface;

  private readonly audioInstance: AudioInterface;

  private readonly cpuInstance: CPU;

  private readonly canvas: HTMLCanvasElement;

  private emulationLoop: AnimationLoop | null = null;

  private resizeEventTimeout: number = 0;

  private isFullScreen: boolean = false;

  public emulatorState: EmulatorState;

  private recordingCanvas: boolean = false;

  constructor(props: Chip8EmulatorProps) {
    super();

    this.canvas = props.canvas;

    this.displayInstance = new DisplayInterface(this.canvas);
    this.keyboardInstance = new KeyBoardInterface();
    this.audioInstance = new AudioInterface();

    this.cpuInstance = new CPU(
      this.displayInstance,
      this.audioInstance,
      this.keyboardInstance,
    );

    this.registerCpuEvents();
    this.registerKeyboardEvents();
    this.registerDisplayEvents();
    this.registerToggleFullScreenModeEvent();

    this.emulatorState = EmulatorState.STOPPED;
  }

  private handleEmulationCycle(): void {
    try {
      this.cpuInstance.cycle();
    } catch (error) {
      console.error(`Emulator error: ${(error as Error).message}`);
      this.emulationLoop?.stop();
      this.dispatchEmulatorEvent(EmulatorEvents.EMULATION_ERROR, { error });
    }
  }

  private getEmulationLoop(): AnimationLoop {
    if (!this.emulationLoop) {
      this.emulationLoop = new AnimationLoop(
        this.handleEmulationCycle.bind(this),
        { fps: 60 },
      );
    }

    return this.emulationLoop;
  }

  private setEmulatorState(state: EmulatorState): void {
    this.emulatorState = state;

    this.dispatchEmulatorEvent(EmulatorEvents.EMULATOR_STATE_CHANGED, {
      state,
    });
  }

  private startEmulatorLoop(): void {
    const loop = this.getEmulationLoop();

    if (!loop.isActive()) {
      loop.start();
      this.setEmulatorState(EmulatorState.PLAYING);
    }
  }

  public stopEmulatorLoop(): void {
    this.emulationLoop?.stop();

    this.displayInstance.clearDisplayBuffer();
    this.displayInstance.clearCanvas();

    this.audioInstance.stop();
    this.keyboardInstance.setKeyHandlingEnabled(true);

    this.setEmulatorState(EmulatorState.STOPPED);
  }

  private handleExitInstruction(): void {
    console.log('Emulation loop stopped by exit instruction');
    this.stopEmulatorLoop();
  }

  public loadRom(romData: Uint8Array): void {
    this.cpuInstance.loadRom(romData);
  }

  public setAudioGain(gain: number): void {
    this.audioInstance.setAudioGain(gain);
  }

  public getAudioGain(): number {
    return this.audioInstance.getAudioGain();
  }

  public setSoundState(state: boolean): void {
    this.cpuInstance.setSoundState(state);
  }

  public getSoundState(): boolean {
    return this.cpuInstance.getSoundState();
  }

  public setXOChipSoundState(scale: boolean): void {
    this.cpuInstance.setXOChipSoundState(scale);
  }

  public getXOChipSoundState(): boolean {
    return this.cpuInstance.getXOChipSoundState();
  }

  public setCpuCyclesPerFrame(cycles: number): void {
    this.cpuInstance.setCyclesPerFrame(cycles);
  }

  public getCpuCyclesPerFrame(): number {
    return this.cpuInstance.getCyclesPerFrame();
  }

  public setCpuQuirkValue(quirk: Chip8Quirks, value: boolean): void {
    this.cpuInstance.setQuirkValue(quirk, value);
  }

  public getCpuQuirkValue(quirk: Chip8Quirks): boolean {
    return this.cpuInstance.getQuirkValue(quirk);
  }

  public setMemorySize(size: number): void {
    this.cpuInstance.haltCPU();
    this.cpuInstance.setMemorySize(size);
    this.cpuInstance.resetRom();
  }

  public getMemorySize(): number {
    return this.cpuInstance.getMemorySize();
  }

  public loadRomFromData(romData: Uint8Array): void {
    this.stopEmulatorLoop();
    this.cpuInstance.loadRom(romData);
    this.startEmulatorLoop();
  }

  public resetEmulation(): void {
    this.stopEmulatorLoop();
    this.cpuInstance.resetRom();
    this.startEmulatorLoop();
  }

  private registerCpuEvents(): void {
    this.cpuInstance.addEventListener(
      Chip8CpuEvents.EXIT,
      this.handleExitInstruction.bind(this),
    );
  }

  private registerKeyboardEvents(): void {
    this.keyboardInstance.registerKeyPressedEvent([ 'k' ], () => {
      this.cpuInstance.dumpStatus();
    });

    this.keyboardInstance.registerKeyPressedEvent([ 'p' ], () => {
      this.togglePauseState();
    });

    this.keyboardInstance.registerKeyPressedEvent([ 'l' ], () => {
      this.stopEmulatorLoop();
    });

    this.keyboardInstance.registerKeyPressedEvent([ 'o' ], () => {
      this.resetRom();
    });
  }

  private registerDisplayEvents(): void {
    window.addEventListener('resize', () => {
      if (this.resizeEventTimeout) {
        cancelAnimationFrame(this.resizeEventTimeout);
      }

      this.resizeEventTimeout = requestAnimationFrame(() => {
        this.handleResizeCanvas();
      });
    });

    document.addEventListener('keydown', (e): void => {
      if (e.key !== '0') return;

      this.toggleFullScreenMode();
    });
  }

  public resetRom(): void {
    this.cpuInstance.resetRom();
  }

  private dispatchEmulatorEvent<T>(event: EmulatorEvents, detail: T): void {
    const customEvent = new CustomEvent(event, { detail });

    this.dispatchEvent(customEvent);
  }

  public setPaletteColor(index: number, color: string): void {
    this.displayInstance.setPaletteColor(index, color);

    this.dispatchEmulatorEvent(EmulatorEvents.DISPLAY_COLOR_CHANGED, {
      index,
      color,
    });
  }

  public getCurrentPalette(index: number): string {
    return this.displayInstance.getPaletteColor(index);
  }

  public setFontAppearance(fontAppearance: EmulatorFontAppearance): void {
    this.cpuInstance.setFontAppearance(fontAppearance);
    this.cpuInstance.resetRom();
  }

  public getFontAppearance(): EmulatorFontAppearance {
    return this.cpuInstance.getFontAppearance();
  }

  public handleResizeCanvas(): void {
    this.displayInstance.calculateDisplayScale();

    if (!this.emulationLoop) {
      this.displayInstance.clearCanvas();
    } else if (!this.cpuInstance.drawingFlag) {
      this.displayInstance.render();
    }
  }

  public async toggleFullScreenMode(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await this.canvas.closest('.emulator-view')?.requestFullscreen();
    }

    this.handleResizeCanvas();
  }

  private registerToggleFullScreenModeEvent(): void {
    this.canvas.closest('.emulator-view')?.addEventListener('fullscreenchange', (event) => {
      this.isFullScreen = !!document.fullscreenElement;

      this.dispatchEmulatorEvent(EmulatorEvents.FULLSCREEN_MODE_CHANGED, {
        fullscreen: this.isFullScreen,
      });
    });
  }

  public togglePauseState(): void {
    if (this.emulatorState === EmulatorState.STOPPED) {
      console.warn('Cannot pause the emulator when it is stopped.');

      return;
    }

    this.cpuInstance.togglePauseState();
    this.keyboardInstance.setKeyHandlingEnabled(!this.cpuInstance.paused);

    const newState = this.cpuInstance.paused ?
      EmulatorState.PAUSED :
      EmulatorState.PLAYING;

    this.setEmulatorState(newState);
  }

  public setCPUInitialState(): void {
    this.cpuInstance.setCPUInitialState();
  }

  public toggleRecordCanvas(): void {
    this.recordingCanvas = !this.recordingCanvas;

    this.dispatchEmulatorEvent(EmulatorEvents.RECORD_CANVAS_CHANGED, {
      recording: this.recordingCanvas,
    });
  }
}
