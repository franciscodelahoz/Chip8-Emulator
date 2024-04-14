import '../styles/style.css';

import { Chip8Emulator } from './emulator/emulator';
import { initializeColorPaletteSettingsModule } from './settings/color-palettes';
import { initializeEmulatorControllerModule } from './settings/emulator-controls';
import { initializeFontSettingsModule } from './settings/fonts';
import { initializeGeneralSettingsModule } from './settings/general';
import { initializeROMCompatibilitySettingsModule } from './settings/rom-compatibility';
import { initializeSoundSettingsModule } from './settings/sound';
import ColorPalettesManagerTools from './tools/color-palettes-manager.tools';

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
  await ColorPalettesManagerTools.initializeManager();
}

document.addEventListener('DOMContentLoaded', async () => {
  await initializeManagers();

  const emulatorInstance = new Chip8Emulator({ canvas });

  initializeColorPaletteSettingsModule(emulatorInstance);
  initializeGeneralSettingsModule(emulatorInstance);
  initializeSoundSettingsModule(emulatorInstance);
  initializeGeneralSettingsModule(emulatorInstance);
  initializeROMCompatibilitySettingsModule(emulatorInstance);
  initializeFontSettingsModule(emulatorInstance);
  initializeEmulatorControllerModule(emulatorInstance);

  setSidebarButtonEventHandlers();
});
