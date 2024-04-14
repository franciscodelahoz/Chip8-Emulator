import { defaultFontAppearance } from '../constants/chip8.constants';
import { Chip8Emulator } from '../emulator/emulator';
import { EmulatorFontAppearance } from '../types/emulator';

const fontAppearanceSelect = document.getElementById('font-appearance-select') as HTMLSelectElement | null;

function setInitialFontAppearanceSelectState(emulatorInstance: Chip8Emulator) {
  const storedFontAppearance = window.localStorage.getItem('fontAppearance') as EmulatorFontAppearance | null;

  if (fontAppearanceSelect) {
    fontAppearanceSelect.value = storedFontAppearance || defaultFontAppearance;

    fontAppearanceSelect.addEventListener('change', () => {
      const fontAppearance = fontAppearanceSelect.value;
      emulatorInstance.setFontAppearance(fontAppearance as EmulatorFontAppearance);
      window.localStorage.setItem('fontAppearance', fontAppearance);
    });

    emulatorInstance.setFontAppearance(storedFontAppearance || defaultFontAppearance);
  }
}

export function initializeFontSettingsModule(emulatorInstance: Chip8Emulator) {
  setInitialFontAppearanceSelectState(emulatorInstance);
}
