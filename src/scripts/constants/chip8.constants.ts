export const chip8Fonts = [
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80, // F

  // high-res mode font sprites (0-9)
  0x3C, 0x7E, 0xE7, 0xC3, 0xC3, 0xC3, 0xC3, 0xE7, 0x7E, 0x3C,
  0x18, 0x38, 0x58, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x3C,
  0x3E, 0x7F, 0xC3, 0x06, 0x0C, 0x18, 0x30, 0x60, 0xFF, 0xFF,
  0x3C, 0x7E, 0xC3, 0x03, 0x0E, 0x0E, 0x03, 0xC3, 0x7E, 0x3C,
  0x06, 0x0E, 0x1E, 0x36, 0x66, 0xC6, 0xFF, 0xFF, 0x06, 0x06,
  0xFF, 0xFF, 0xC0, 0xC0, 0xFC, 0xFE, 0x03, 0xC3, 0x7E, 0x3C,
  0x3E, 0x7C, 0xC0, 0xC0, 0xFC, 0xFE, 0xC3, 0xC3, 0x7E, 0x3C,
  0xFF, 0xFF, 0x03, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x60, 0x60,
  0x3C, 0x7E, 0xC3, 0xC3, 0x7E, 0x7E, 0xC3, 0xC3, 0x7E, 0x3C,
  0x3C, 0x7E, 0xC3, 0xC3, 0x7F, 0x3F, 0x03, 0x03, 0x3E, 0x7C,
];

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
}

export const defaultQuirkConfigurations: Record<Chip8Quirks, boolean> = {
  [Chip8Quirks.VF_QUIRK]: true,
  [Chip8Quirks.MEMORY_QUIRK]: true,
  [Chip8Quirks.DISPLAY_WAIT_QUIRK]: true,
  [Chip8Quirks.CLIP_QUIRK]: true,
  [Chip8Quirks.SHIFT_QUIRK]: false,
  [Chip8Quirks.JUMP_QUIRK]: false,
}

export const schipQuirkConfigurations: Record<Chip8Quirks, boolean> = {
  [Chip8Quirks.VF_QUIRK]: false,
  [Chip8Quirks.MEMORY_QUIRK]: false,
  [Chip8Quirks.DISPLAY_WAIT_QUIRK]: false,
  [Chip8Quirks.CLIP_QUIRK]: true,
  [Chip8Quirks.SHIFT_QUIRK]: true,
  [Chip8Quirks.JUMP_QUIRK]: true,
}

export const xoChipQuirkConfigurations: Record<Chip8Quirks, boolean> = {
  [Chip8Quirks.VF_QUIRK]: false,
  [Chip8Quirks.MEMORY_QUIRK]: true,
  [Chip8Quirks.DISPLAY_WAIT_QUIRK]: false,
  [Chip8Quirks.CLIP_QUIRK]: false,
  [Chip8Quirks.SHIFT_QUIRK]: false,
  [Chip8Quirks.JUMP_QUIRK]: false,
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

export const paletteColors = {
  default: [
    '#222222',
    '#33FF66',
    '#3366FF',
    '#FFCC33',
  ],
  black_and_white: [
    '#000000',
    '#E5E5E1',
    '#A0998C',
    '#605C54',
  ],
  cyberpunk: [
    '#100019',
    '#FFE1FF',
    '#E700EA',
    '#8B008B'
  ],
  neon_night: [
    '#222222',
    '#FFFF33',
    '#33FFFF',
    '#FF33FF',
  ]
}
