import type { colorPalettes } from '../constants/color-palettes.constants';
import type { fontSets } from '../constants/fonts.constants';

export interface Chip8EmulatorProps {
  canvas: HTMLCanvasElement;
}

export type EmulatorColorPalette = keyof typeof colorPalettes;

export type EmulatorFontAppearance = keyof typeof fontSets;

export interface DisplayPosition {
  x: number;
  y: number;
}

export interface ColorPalettes {
  [key: string]: string[];
}

export interface CustomColorPalette {
  name: string;
  id: string;
  colors: string[];
  created_at: number;
}

export interface EmulatorSettings {
  [key: string]: string | number | boolean;
}
