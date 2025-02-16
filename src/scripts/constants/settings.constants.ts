import type { Chip8Quirks } from './chip8.constants';

export enum GeneralEmulatorSettings {
  FONT_APPEARANCE = 'fontAppearance',
  CYCLES_PER_FRAME = 'cyclesPerFrame',
  SOUND_STATE = 'soundState',
  GAIN_LEVEL = 'gainLevel',
  MEMORY_SIZE = 'memorySize',
}

export type EmulatorSettings = Chip8Quirks | GeneralEmulatorSettings;
