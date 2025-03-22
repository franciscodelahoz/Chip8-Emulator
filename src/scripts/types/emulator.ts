import type { colorPalettes } from '../constants/color-palettes.constants';
import type { fontSets } from '../constants/fonts.constants';

export interface Chip8EmulatorProps {
  canvas: HTMLCanvasElement;
}

export type EmulatorColorPalette = keyof typeof colorPalettes;

export type EmulatorFontAppearance = keyof typeof fontSets;

export interface ColorPalettes {
  [key: string]: string[];
}

export interface CustomColorPalette {
  name: string;
  id: string;
  colors: string[];
  created_at: number;
}

export interface SettingsObject<T> {
  id: string;
  value: T;
}

export interface EmulatorSettings {
  [key: string]: boolean | number | string;
}

export interface PaletteColorChangeEvent {
  index: number;
  color: string;
}

export interface ProcessedColorValue {
  color_value: string;
  is_valid: boolean;
}

export type DisplayBuffer = number[][];
