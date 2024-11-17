import '../styles/style.css';

import ColorPalettesManager from './database/managers/color-palettes.manager';
import SettingsManager from './database/managers/settings.manager';
import { Chip8Emulator } from './emulator/emulator';
import { initializeEmulatorControllerModule } from './ui/controls/emulator';
import { initializeSidebarMenuModule } from './ui/controls/sidebar-menu';
import { initializeColorPaletteSettingsModule } from './ui/settings/color-palettes';
import { initializeFontSettingsModule } from './ui/settings/fonts';
import { initializeGeneralSettingsModule } from './ui/settings/general';
import { initializeROMCompatibilitySettingsModule } from './ui/settings/rom-compatibility';
import { initializeSoundSettingsModule } from './ui/settings/sound';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

async function initializeManagers() {
  await ColorPalettesManager.initializeManager();
  await SettingsManager.initializeManager();
}

document.addEventListener('DOMContentLoaded', async () => {
  await initializeManagers();

  const emulatorInstance = new Chip8Emulator({ canvas });

  initializeColorPaletteSettingsModule(emulatorInstance);
  initializeGeneralSettingsModule(emulatorInstance);
  initializeSoundSettingsModule(emulatorInstance);
  initializeROMCompatibilitySettingsModule(emulatorInstance);
  initializeFontSettingsModule(emulatorInstance);
  initializeEmulatorControllerModule(emulatorInstance);

  initializeSidebarMenuModule();
});
