import { defaultFontAppearance } from '../constants/chip8.constants';
import { Chip8Emulator } from '../emulator/emulator';
import { EmulatorFontAppearance } from '../types/emulator';

const fontAppearanceSelect = document.getElementById('font-appearance-select') as HTMLSelectElement | null;

function setCurrentFontAppearance(emulatorInstance: Chip8Emulator) {
  const storedFontAppearance = window.localStorage.getItem('fontAppearance') as EmulatorFontAppearance | null;
  const fontAppearance = storedFontAppearance || defaultFontAppearance;

  if (storedFontAppearance) {
    emulatorInstance.setFontAppearance(fontAppearance);
  }

  if (fontAppearanceSelect) {
    fontAppearanceSelect.value = fontAppearance;
  }
}

function setInitialFontAppearanceSelectState(emulatorInstance: Chip8Emulator) {
  if (!fontAppearanceSelect) return;

  fontAppearanceSelect.addEventListener('change', () => {
    const fontAppearance = fontAppearanceSelect.value;
    emulatorInstance.setFontAppearance(fontAppearance as EmulatorFontAppearance);
    window.localStorage.setItem('fontAppearance', fontAppearance);
  });
}

export function initializeFontSettingsModule(emulatorInstance: Chip8Emulator) {
  setCurrentFontAppearance(emulatorInstance);
  setInitialFontAppearanceSelectState(emulatorInstance);
}
