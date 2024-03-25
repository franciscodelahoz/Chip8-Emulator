import '../styles/style.css';

import {
  Chip8Quirks,
  defaultMemorySize,
  defaultQuirkConfigurations,
  schipQuirkConfigurations,
  xoChipMemorySize,
  xoChipQuirkConfigurations
} from './constants/chip8.constants';
import { Chip8Emulator } from './emulator/emulator';
import { EmulatorColorPalette } from './types/emulator';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const input = document.getElementById('file') as HTMLInputElement | null;
const resetRomBtn = document.getElementById('reset-rom-btn') as HTMLElement | null;

const configurationSideBar = document.getElementById('configuration-sidebar') as HTMLElement | null;
const closeConfigurationSideBarBtn = document.getElementById('close-configurations-button') as HTMLElement | null;
const openConfigurationSideBarBtn = document.getElementById('open-configurations-button') as HTMLElement | null;

const cyclesPerFrameSelect = document.getElementById('cycles-per-frame-select') as HTMLSelectElement | null;
const soundStateCheckbox = document.getElementById('sound-state-checkbox') as HTMLInputElement | null;

const soundLevelRange = document.getElementById('sound-level-range') as HTMLInputElement | null;
const soundLevelValue = document.getElementById('sound-level-value') as HTMLElement | null;

const quirkConfigCheckboxes = document.getElementsByClassName('quirk-checkbox') as HTMLCollectionOf<HTMLInputElement>;

const memorySizeSelect = document.getElementById('memory-size-select') as HTMLSelectElement | null;

const chip8ProfileBtn = document.getElementById('chip8-profile') as HTMLElement | null;
const schipProfileBtn = document.getElementById('schip-profile') as HTMLElement | null;
const xoChipProfileBtn = document.getElementById('xo-chip-profile') as HTMLElement | null;

const colorPaletteSelect = document.getElementById('color-palette-select') as HTMLSelectElement | null;

const emulatorInstance = new Chip8Emulator({ canvas });

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

function getQuirkValue(quirkName: Chip8Quirks) {
  const storedQuirkValue = window.localStorage.getItem(quirkName);

  if (!storedQuirkValue) {
    return emulatorInstance.getCpuQuirkValue(quirkName);
  }

  const parsedStoredValue = storedQuirkValue === 'true' ? true : false;

  emulatorInstance.setCpuQuirkValue(quirkName, parsedStoredValue);
  return parsedStoredValue;
}

function setQuirkValue(quirkName: Chip8Quirks, value: boolean) {
  const parsedValueToStore = value ? 'true' : 'false';

  window.localStorage.setItem(quirkName, parsedValueToStore);
  emulatorInstance.setCpuQuirkValue(quirkName, value);
}

function setQuirkValuesFromProfiles(quirkValues: Record<Chip8Quirks, boolean>) {
  const quirkValuesKeys = Object.keys(quirkValues) as Array<Chip8Quirks>;

  quirkValuesKeys.forEach((quirkName) => {
    const quirk = [ ...quirkConfigCheckboxes ].find((element) => {
      return element.getAttribute('data-quirk-property-name') === quirkName;
    });

    if (quirk) {
      quirk.checked = quirkValues[quirkName];
      setQuirkValue(quirkName, quirkValues[quirkName]);
    }
  });
}

function getMemorySize() {
  const storedMemorySize = window.localStorage.getItem('memorySize');

  if (!storedMemorySize) {
    return emulatorInstance.getMemorySize();
  }

  const parsedStoredValue = Number.parseInt(storedMemorySize, 10);
  emulatorInstance.setMemorySize(parsedStoredValue);
  return parsedStoredValue;
}

function setInitialMemorySizeSelectState() {
  if (memorySizeSelect) {
    memorySizeSelect.value = getMemorySize().toString();

    memorySizeSelect.addEventListener('change', () => {
      const memorySize = Number.parseInt(memorySizeSelect.value, 10);
      emulatorInstance.setMemorySize(memorySize);
      window.localStorage.setItem('memorySize', memorySize.toString());
    });
  }
}

function setMemorySizeFromProfile(memorySize: number) {
  if (memorySizeSelect) {
    memorySizeSelect.value = memorySize.toString();
    emulatorInstance.setMemorySize(memorySize);
    window.localStorage.setItem('memorySize', memorySize.toString());
  }
}

function setInitialColorPaletteSelectState() {
  const storedColorPalette = window.localStorage.getItem('colorPalette') as EmulatorColorPalette | null;

  if (colorPaletteSelect) {
    colorPaletteSelect.value = storedColorPalette || 'default';

    colorPaletteSelect.addEventListener('change', () => {
      const colorPalette = colorPaletteSelect.value;
      emulatorInstance.setColorPalette((colorPalette as EmulatorColorPalette));
      window.localStorage.setItem('colorPalette', colorPalette);
    });

    emulatorInstance.setColorPalette(storedColorPalette || 'default');
  }
}

function setInitialConfigurationsStates() {
  [ ...quirkConfigCheckboxes ].forEach((element) => {
    const quirkName = element.getAttribute('data-quirk-property-name') as Chip8Quirks;
    element.checked = getQuirkValue(quirkName);

    element.addEventListener('change', () => {
      setQuirkValue(quirkName, element.checked);
    });
  });

  chip8ProfileBtn?.addEventListener('click', () => {
    setQuirkValuesFromProfiles(defaultQuirkConfigurations);
    setMemorySizeFromProfile(defaultMemorySize);
  });

  schipProfileBtn?.addEventListener('click', () => {
    setQuirkValuesFromProfiles(schipQuirkConfigurations);
    setMemorySizeFromProfile(defaultMemorySize);
  });

  xoChipProfileBtn?.addEventListener('click', () => {
    setQuirkValuesFromProfiles(xoChipQuirkConfigurations);
    setMemorySizeFromProfile(xoChipMemorySize);
  });
}

function getCyclesPerFrame() {
  const storedCyclesPerFrameValue = window.localStorage.getItem('cyclesPerFrame');

  if (!storedCyclesPerFrameValue) {
    return emulatorInstance.getCpuCyclesPerFrame();
  }

  const parsedStoredValue = Number.parseInt(storedCyclesPerFrameValue, 10);
  emulatorInstance.setCpuCyclesPerFrame(parsedStoredValue);
  return parsedStoredValue;
}

function setInitialCyclesPerFrameSelectState() {
  if (cyclesPerFrameSelect) {
    cyclesPerFrameSelect.value = getCyclesPerFrame().toString();

    cyclesPerFrameSelect.addEventListener('change', () => {
      const cyclesPerFrame = Number.parseInt(cyclesPerFrameSelect.value, 10);
      emulatorInstance.setCpuCyclesPerFrame(cyclesPerFrame);
      window.localStorage.setItem('cyclesPerFrame', cyclesPerFrame.toString());
    });
  }
}

function getSoundState() {
  const storedSoundState = window.localStorage.getItem('soundState');

  if (!storedSoundState) {
    return emulatorInstance.getSoundState();
  }

  const parsedStoredValue = storedSoundState === 'true' ? true : false;

  emulatorInstance.setSoundState(parsedStoredValue);
  return parsedStoredValue;
}

function setInitialSoundState() {
  if (soundStateCheckbox) {
    soundStateCheckbox.checked = getSoundState();

    soundStateCheckbox.addEventListener('change', () => {
      const soundState = soundStateCheckbox.checked;
      emulatorInstance.setSoundState(soundState);
      window.localStorage.setItem('soundState', soundState.toString());
    });
  }
}

function convertAudioGainToSoundLevel(gain: number) {
  return Math.round(gain * 100);
}

function convertSoundLevelToGain(soundLevel: number) {
  return soundLevel / 100;
}

function getSoundLevel() {
  const storedGainValue = window.localStorage.getItem('gainLevel');

  if (!storedGainValue) {
    return emulatorInstance.getAudioGain();
  }

  const parsedGainValue = Number.parseFloat(storedGainValue);
  emulatorInstance.setAudioGain(parsedGainValue);
  return parsedGainValue;
}

function setInitialSoundLevelState() {
  if (soundLevelRange) {
    const soundLevel = convertAudioGainToSoundLevel(getSoundLevel()).toString();
    soundLevelRange.value = soundLevel;

    if (soundLevelValue) {
      soundLevelValue.innerText = soundLevel;
    }

    soundLevelRange.addEventListener('change', () => {
      const soundLevel = Number.parseInt(soundLevelRange.value, 10);

      if (soundLevelValue) {
        soundLevelValue.innerText = soundLevelRange.value;
      }

      const gain = convertSoundLevelToGain(soundLevel);
      emulatorInstance.setAudioGain(gain);
      window.localStorage.setItem('gainLevel', gain.toString());
    });
  }
}

function initializeRomFileInputEventHandlers() {
  if (input) {
    input.addEventListener('change', async (event) => {
      try {
        await emulatorInstance.startEmulation(event as GenericEvent<HTMLInputElement>);
      } catch(error) {
        console.error(error);
      }
    });
  }
}

function initializeResetRomButtonEventHandlers() {
  if (resetRomBtn) {
    resetRomBtn.addEventListener('click', () => {
      try {
        emulatorInstance.resetEmulation();
      } catch(error) {
        console.error(error);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initializeRomFileInputEventHandlers();
  initializeResetRomButtonEventHandlers();
  setInitialColorPaletteSelectState();

  closeConfigurationSideBarBtn?.addEventListener('click', closeSideMenu);
  openConfigurationSideBarBtn?.addEventListener('click', openSideMenu);

  setInitialConfigurationsStates();
  setInitialCyclesPerFrameSelectState();
  setInitialSoundState();
  setInitialSoundLevelState();
  setInitialMemorySizeSelectState();
});
