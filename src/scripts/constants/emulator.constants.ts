export const emulatorConfigurationsKeys = {
  palette_keys: [
    'background',
    'foreground1',
    'foreground2',
    'blend',
  ],
};

export const customPalettePrefix = 'custom_palette_';

export const emulatorDatabase = {
  name            : 'emulator',
  current_version : 1,
};

export enum EmulatorState {
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  EXITED = 'exited',
}

export const defaultLoadedRomTitle = 'No ROM Loaded';

export const defaultRomFileName = 'no_rom';
