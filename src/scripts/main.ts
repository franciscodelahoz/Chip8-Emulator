import '../styles/style.css';

import ColorPalettesManager from './database/managers/color-palettes.manager';
import SettingsManager from './database/managers/settings.manager';
import { Chip8Emulator } from './emulator/emulator';
import { initializeEmulatorControllerModule } from './ui/controls/emulator';
import { initializeColorPaletteSettingsModule } from './ui/settings/color-palettes';
import { initializeFontSettingsModule } from './ui/settings/fonts';
import { initializeGeneralSettingsModule } from './ui/settings/general';
import { initializeROMCompatibilitySettingsModule } from './ui/settings/rom-compatibility';
import { initializeSoundSettingsModule } from './ui/settings/sound';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const configurationSideBar = document.getElementById('configuration-sidebar') as HTMLElement | null;
const closeConfigurationSideBarBtn = document.getElementById('close-configurations-button') as HTMLElement | null;
const openConfigurationSideBarBtn = document.getElementById('open-configurations-button') as HTMLElement | null;

function closeSideMenu() {
  if (configurationSideBar) {
    configurationSideBar.classList.remove('active');
  }
}

function openSideMenu() {
  if (configurationSideBar) {
    configurationSideBar.classList.toggle('active');
  }
}

function setSidebarButtonEventHandlers() {
  closeConfigurationSideBarBtn?.addEventListener('click', closeSideMenu);
  openConfigurationSideBarBtn?.addEventListener('click', openSideMenu);

  document.addEventListener('click', (event) => {
    if (
      !configurationSideBar?.contains(event.target as Node)
      && !openConfigurationSideBarBtn?.contains(event.target as Node)
      && configurationSideBar?.classList.contains('active')
    ) {
      configurationSideBar?.classList.remove('active');
    }
  });
}

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

  setSidebarButtonEventHandlers();
});
