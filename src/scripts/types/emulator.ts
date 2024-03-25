import { paletteColors } from '../constants/chip8.constants';

export interface Chip8EmulatorProps {
  canvas: HTMLCanvasElement;
}

export type EmulatorColorPalette =  keyof typeof paletteColors;
