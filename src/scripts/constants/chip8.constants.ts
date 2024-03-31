import { EmulatorColorPalette, EmulatorFontAppearance } from '../types/emulator';

export const enum Chip8Quirks {
  /* The AND, OR and XOR opcodes (8xy1, 8xy2 and 8xy3) reset the flags register to zero. */
  VF_QUIRK = 'vfQuirk',
  /* The save and load opcodes (Fx55 and Fx65) increment the index register. */
  MEMORY_QUIRK = 'memoryQuirk',
  /* Drawing sprites to the display waits for the vertical blank interrupt, limiting their speed to max 60 sprites per second. */
  DISPLAY_WAIT_QUIRK = 'displayWaitQuirk',
  /* Sprites drawn at the bottom edge of the screen get clipped instead of wrapping around to the top of the screen. */
  CLIP_QUIRK = 'clipQuirks',
  /* The shift opcodes (8xy6 and 8xyE) only operate on vX instead of storing the shifted version of vY in vX. */
  SHIFT_QUIRK = 'shiftQuirk',
  /* The "jump to some address plus v0" instruction (Bnnn) doesn't use v0, but vX instead where X is the highest nibble of nnn */
  JUMP_QUIRK = 'jumpQuirks',
  /* Adjusts for ROMs that define sprite height as zero in low-resolution mode, interpreting it as a height of 8 pixels. */
  ZERO_HEIGHT_SPRITE_LORES_QUIRK = 'zeroHeightSpriteLoresQuirk',
}

export const defaultQuirkConfigurations: Record<Chip8Quirks, boolean> = {
  [Chip8Quirks.VF_QUIRK]: true,
  [Chip8Quirks.MEMORY_QUIRK]: true,
  [Chip8Quirks.DISPLAY_WAIT_QUIRK]: true,
  [Chip8Quirks.CLIP_QUIRK]: true,
  [Chip8Quirks.SHIFT_QUIRK]: false,
  [Chip8Quirks.JUMP_QUIRK]: false,
  [Chip8Quirks.ZERO_HEIGHT_SPRITE_LORES_QUIRK]: false,
}

export const schipQuirkConfigurations: Record<Chip8Quirks, boolean> = {
  [Chip8Quirks.VF_QUIRK]: false,
  [Chip8Quirks.MEMORY_QUIRK]: false,
  [Chip8Quirks.DISPLAY_WAIT_QUIRK]: false,
  [Chip8Quirks.CLIP_QUIRK]: true,
  [Chip8Quirks.SHIFT_QUIRK]: true,
  [Chip8Quirks.JUMP_QUIRK]: true,
  [Chip8Quirks.ZERO_HEIGHT_SPRITE_LORES_QUIRK]: false,
}

export const xoChipQuirkConfigurations: Record<Chip8Quirks, boolean> = {
  [Chip8Quirks.VF_QUIRK]: false,
  [Chip8Quirks.MEMORY_QUIRK]: true,
  [Chip8Quirks.DISPLAY_WAIT_QUIRK]: false,
  [Chip8Quirks.CLIP_QUIRK]: false,
  [Chip8Quirks.SHIFT_QUIRK]: false,
  [Chip8Quirks.JUMP_QUIRK]: false,
  [Chip8Quirks.ZERO_HEIGHT_SPRITE_LORES_QUIRK]: false,
}

export const defaultMemorySize = 4096;

export const xoChipMemorySize = 65536;

export const defaultCyclesPerFrame = 30;

export const registersSize = 16;

export const stackSize = 16;

export const screenDimensions = {
  chip8: {
    columns: 64,
    rows: 32,
  },
  schip: {
    columns: 128,
    rows: 64,
  },
}

export const loresDisplayScale = 12;

export const defaultFontAppearance: EmulatorFontAppearance = 'octo';

export const defaultColorPalette: EmulatorColorPalette = 'default';
