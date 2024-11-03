import { defaultFontAppearance } from '../../constants/chip8.constants';
import { GeneralEmulatorSettings } from '../../constants/settings.constants';
import SettingsManager from '../../database/managers/settings.manager';
import { Chip8Emulator } from '../../emulator/emulator';
import { EmulatorFontAppearance } from '../../types/emulator';

const fontAppearanceSelect = document.getElementById('font-appearance-select') as HTMLSelectElement | null;

async function setCurrentFontAppearance(emulatorInstance: Chip8Emulator) {
  const storedFontAppearance = await SettingsManager.getSetting<EmulatorFontAppearance>(GeneralEmulatorSettings.FONT_APPEARANCE);
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

  fontAppearanceSelect.addEventListener('change', async () => {
    const fontAppearance = fontAppearanceSelect.value;

    emulatorInstance.setFontAppearance(fontAppearance as EmulatorFontAppearance);
    await SettingsManager.setSetting(GeneralEmulatorSettings.FONT_APPEARANCE, fontAppearance);
  });
}

export async function initializeFontSettingsModule(emulatorInstance: Chip8Emulator) {
  await setCurrentFontAppearance(emulatorInstance);
  setInitialFontAppearanceSelectState(emulatorInstance);
}
