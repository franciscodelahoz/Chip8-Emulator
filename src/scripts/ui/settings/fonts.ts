import { EmulatorEvents, defaultFontAppearance } from '../../constants/chip8.constants';
import { GeneralEmulatorSettings } from '../../constants/settings.constants';
import SettingsManager from '../../database/managers/settings.manager';
import { Chip8Emulator } from '../../emulator/emulator';
import { EmulatorFontAppearance, PaletteColorChangeEvent } from '../../types/emulator';
import { debounce } from '../../utils/timing';
import { FontPreviewCanvas } from './components/font-preview';

const fontAppearanceSelect = document.getElementById('font-appearance-select') as HTMLSelectElement | null;
const fontPreviewCanvas = document.getElementById('font-preview') as HTMLCanvasElement | null;

async function getCurrentFontName(): Promise<EmulatorFontAppearance> {
  const storedFontAppearance = await SettingsManager.getSetting<EmulatorFontAppearance>(
    GeneralEmulatorSettings.FONT_APPEARANCE
  );

  return storedFontAppearance || defaultFontAppearance;
}

function setInitialCurrentFontAppearance(emulatorInstance: Chip8Emulator, fontAppearance: EmulatorFontAppearance) {
  emulatorInstance.setFontAppearance(fontAppearance);

  if (fontAppearanceSelect) {
    fontAppearanceSelect.value = fontAppearance;
  }
}

function setInitialFontAppearanceSelectState(emulatorInstance: Chip8Emulator, fontCanvas: FontPreviewCanvas) {
  if (!fontAppearanceSelect) return;

  fontAppearanceSelect.addEventListener('change', async () => {
    const fontAppearance = fontAppearanceSelect.value as EmulatorFontAppearance;

    emulatorInstance.setFontAppearance(fontAppearance);
    await SettingsManager.setSetting(GeneralEmulatorSettings.FONT_APPEARANCE, fontAppearance);

    fontCanvas.renderFontAppearancePreview(fontAppearance);
  });
}

function registerColorChangeEvent(emulatorInstance: Chip8Emulator, fontCanvas: FontPreviewCanvas) {
  const debouncedSetCurrentFontAppearance = debounce(() => {
    const storedFontAppearance = emulatorInstance.getFontAppearance();
    fontCanvas.renderFontAppearancePreview(storedFontAppearance);
  }, 30);

  emulatorInstance.addEventListener(EmulatorEvents.DISPLAY_COLOR_CHANGED, (event) => {
    const { index } = (event as CustomEvent<PaletteColorChangeEvent>).detail;

    if (index <= 1) {
      debouncedSetCurrentFontAppearance();
    }
  });
}

export async function initializeFontSettingsModule(emulatorInstance: Chip8Emulator) {
  if (fontAppearanceSelect && fontPreviewCanvas) {
    const fontCanvas = new FontPreviewCanvas(fontPreviewCanvas, emulatorInstance);

    const fontAppearance = await getCurrentFontName();

    setInitialCurrentFontAppearance(emulatorInstance, fontAppearance);
    setInitialFontAppearanceSelectState(emulatorInstance, fontCanvas);

    fontCanvas.renderFontAppearancePreview(fontAppearance);
    registerColorChangeEvent(emulatorInstance, fontCanvas);
  }
}
