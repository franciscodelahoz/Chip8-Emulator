import { colorPalettes } from '../constants/color-palettes.constants';
import { fontSets } from '../constants/fonts.constants';

export interface Chip8EmulatorProps {
  canvas: HTMLCanvasElement;
}

export type EmulatorColorPalette =  keyof typeof colorPalettes;

export type EmulatorFontAppearance = keyof typeof fontSets;
