import { Chip8CpuEvents, Chip8Quirks } from '../constants/chip8.constants';
import { Chip8EmulatorProps, EmulatorColorPalette, EmulatorFontAppearance } from '../types/emulator';
import { CPU } from './cpu';
import { AudioInterface } from './interfaces/audio';
import { DisplayInterface } from './interfaces/display';
import { KeyBoardInterface } from './interfaces/keyboard';

export class Chip8Emulator {
  private displayInstance: DisplayInterface;

  private keyboardInstance: KeyBoardInterface;

  private audioInstance: AudioInterface;

  private cpuInstance: CPU;

  private emulationLoop: number = 0;

  constructor(props: Chip8EmulatorProps) {
    this.displayInstance = new DisplayInterface(props.canvas);
    this.keyboardInstance = new KeyBoardInterface();
    this.audioInstance = new AudioInterface();

    this.cpuInstance = new CPU(this.displayInstance, this.audioInstance, this.keyboardInstance);

    this.registerCpuEvents();
    this.registerKeyboardEvents();
  }

  private startEmulatorLoop() {
    const frameTime = 1000 / 60;

    const previousTime = Date.now();
    let nextFrameMidpoint = previousTime + frameTime / 2;

    this.emulationLoop = window.setInterval(() => {
      const currentTime = Date.now();
      let cycleCount = 0;

      // Run the emulator cycle up to twice per interval to catch up on missed frames
      while (nextFrameMidpoint < currentTime - frameTime && cycleCount < 2) {
        try {
          this.cpuInstance.cycle();
        } catch(error) {
          this.stopEmulatorLoop();
          console.error((error as Error).message);
        }

        nextFrameMidpoint += frameTime;
        cycleCount++;
      }
    }, frameTime);
  }

  private stopEmulatorLoop() {
    if (this.emulationLoop) {
      window.clearInterval(this.emulationLoop);
    }
  }

  private handleExitInstruction() {
    if (this.emulationLoop) {
      console.log('Emulation loop stopped by exit instruction');
      this.stopEmulatorLoop();
    }
  }

  private readAsArrayBuffer(fileInput: HTMLInputElement): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const input: File | undefined = fileInput?.files?.[0];

      if (!input) {
        reject('no file input found');
      }

      const fileReader = new FileReader();

      fileReader.readAsArrayBuffer(input as File);

      fileReader.addEventListener('load', (e) => resolve(e.target?.result as ArrayBuffer));
      fileReader.addEventListener('error', (error) => reject(error));
    });
  }

  private async readFile(fileInput: GenericEvent<HTMLInputElement>) {
    const arrayBuffer = await this.readAsArrayBuffer(fileInput.target);
    const romData = new Uint8Array(arrayBuffer);
    return romData;
  }

  public loadRom(romData: Uint8Array) {
    this.cpuInstance.loadRom(romData);
  }

  public setAudioGain(gain: number) {
    this.audioInstance.setAudioGain(gain);
  }

  public getAudioGain() {
    return this.audioInstance.getAudioGain();
  }

  public setSoundState(state: boolean) {
    this.cpuInstance.setSoundState(state);
  }

  public getSoundState() {
    return this.cpuInstance.getSoundState();
  }

  public setCpuCyclesPerFrame(cycles: number) {
    this.cpuInstance.setCyclesPerFrame(cycles);
  }

  public getCpuCyclesPerFrame() {
    return this.cpuInstance.getCyclesPerFrame();
  }

  public setCpuQuirkValue(quirk: Chip8Quirks, value: boolean) {
    this.cpuInstance.setQuirkValue(quirk, value);
  }

  public getCpuQuirkValue(quirk: Chip8Quirks) {
    return this.cpuInstance.getQuirkValue(quirk);
  }

  public setMemorySize(size: number) {
    this.cpuInstance.haltCPU();
    this.cpuInstance.setMemorySize(size);
    this.cpuInstance.resetRom();
  }

  public getMemorySize() {
    return this.cpuInstance.getMemorySize();
  }

  public async startEmulation(event: GenericEvent<HTMLInputElement>) {
    const romData = await this.readFile(event as GenericEvent<HTMLInputElement>);
    this.stopEmulatorLoop();
    this.cpuInstance.loadRom(romData);
    this.startEmulatorLoop();
  }

  public resetEmulation() {
    this.stopEmulatorLoop();
    this.cpuInstance.resetRom();
    this.startEmulatorLoop();
  }

  private registerCpuEvents() {
    this.cpuInstance.addEventListener(Chip8CpuEvents.EXIT, this.handleExitInstruction.bind(this));
  }

  private registerKeyboardEvents() {
    this.keyboardInstance.registerKeyPressedEvent(['k'], () => {
      this.cpuInstance.dumpStatus();
    });

    this.keyboardInstance.registerKeyPressedEvent(['p'], () => {
      this.cpuInstance.togglePauseState();
    });
  }

  public resetRom() {
    this.cpuInstance.resetRom();
  }

  public setPaletteColor(index: number, color: string) {
    this.displayInstance.setPaletteColor(index, color);
  }

  public setFontAppearance(fontAppearance: EmulatorFontAppearance) {
    this.cpuInstance.setFontAppearance(fontAppearance);
    this.cpuInstance.resetRom();
  }
}
