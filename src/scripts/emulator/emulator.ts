import { CPU } from './cpu';
import type { Chip8Quirks } from '../constants/chip8.constants';
import { Chip8CpuEvents, EmulatorEvents } from '../constants/chip8.constants';
import type { Chip8EmulatorProps, EmulatorFontAppearance } from '../types/emulator';
import { AudioInterface } from './interfaces/audio';
import { DisplayInterface } from './interfaces/display';
import { KeyBoardInterface } from './interfaces/keyboard';

export class Chip8Emulator extends EventTarget {
  private readonly displayInstance: DisplayInterface;

  private readonly keyboardInstance: KeyBoardInterface;

  private readonly audioInstance: AudioInterface;

  private readonly cpuInstance: CPU;

  private readonly canvas: HTMLCanvasElement;

  private emulationLoop: number = 0;

  private resizeEventTimeout: number = 0;

  constructor(props: Chip8EmulatorProps) {
    super();

    this.canvas = props.canvas;

    this.displayInstance = new DisplayInterface(this.canvas);
    this.keyboardInstance = new KeyBoardInterface();
    this.audioInstance = new AudioInterface();

    this.cpuInstance = new CPU(this.displayInstance, this.audioInstance, this.keyboardInstance);

    this.registerCpuEvents();
    this.registerKeyboardEvents();
    this.registerDisplayEvents();
  }

  private startEmulatorLoop(): void {
    const frameTime = 1000 / 60;
    const previousTime = Date.now();

    let nextFrameMidpoint = previousTime + frameTime / 2;

    this.emulationLoop = window.setInterval(() => {
      let cycleCount = 0;
      const currentTime = Date.now();

      /* Run the emulator cycle up to twice per interval to catch up on missed frames */
      while (nextFrameMidpoint < currentTime - frameTime && cycleCount < 2) {
        try {
          this.cpuInstance.cycle();
        } catch (error) {
          this.stopEmulatorLoop();
          console.error((error as Error).message);
        }

        nextFrameMidpoint += frameTime;
        cycleCount += 1;
      }
    }, frameTime);
  }

  private stopEmulatorLoop(): void {
    if (this.emulationLoop) {
      window.clearInterval(this.emulationLoop);
    }
  }

  private handleExitInstruction(): void {
    if (this.emulationLoop) {
      console.log('Emulation loop stopped by exit instruction');
      this.stopEmulatorLoop();
    }
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
      this.cpuInstance.togglePauseState();
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
      await this.canvas.requestFullscreen();
    }

    this.handleResizeCanvas();
  }
}
