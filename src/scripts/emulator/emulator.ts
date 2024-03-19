import { Chip8Quirks } from '../constants/chip8.constants';
import { Chip8EmulatorProps } from '../types/emulator';
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
  }

  private startEmulatorLoop() {
    this.emulationLoop = window.setInterval(() => {
      try {
        this.cpuInstance.cycle();
      } catch(error) {
        this.stopEmulatorLoop();
        console.error((error as Error).message);
      }
    }, 1000 / 60);
  }

  private stopEmulatorLoop() {
    if (this.emulationLoop) {
      window.clearInterval(this.emulationLoop);
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
}
