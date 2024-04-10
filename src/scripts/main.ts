import '../styles/style.css';
import { maximumAudioGain } from './constants/audio.constants';

import {
  Chip8Quirks,
  customColorPaletteKeyName,
  defaultColorPalette,
  defaultFontAppearance,
  defaultMemorySize,
  defaultQuirkConfigurations,
  schipQuirkConfigurations,
  xoChipMemorySize,
  xoChipQuirkConfigurations
} from './constants/chip8.constants';
import { colorPalettes } from './constants/color-palettes.constants';
import { emulatorConfigurationsKeys } from './constants/emulator.constants';
import { Chip8Emulator } from './emulator/emulator';
import { EmulatorColorPalette, EmulatorFontAppearance } from './types/emulator';

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

const colorPaletteSelect = document.getElementById('color-palettes-select') as HTMLSelectElement | null;
const fontAppearanceSelect = document.getElementById('font-appearance-select') as HTMLSelectElement | null;

const colorPaletteTable = document.getElementById('configuration-table');

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

function getColorValueFromLocalStorage(colorIndex: number) {
  const storedColorValue = window.localStorage.getItem(emulatorConfigurationsKeys.palette_keys[colorIndex]);

  if (!storedColorValue) {
    return colorPalettes[defaultColorPalette][colorIndex].toUpperCase();
  }

  return storedColorValue.toUpperCase();
}

function storeColorInLocalStorage(colorIndex: number, colorValue: string) {
  window.localStorage.setItem(emulatorConfigurationsKeys.palette_keys[colorIndex], colorValue);
}

function setColorPaletteInLocalStorage(colorPaletteName: EmulatorColorPalette) {
  colorPalettes[colorPaletteName].forEach((color, index) => {
    storeColorInLocalStorage(index, color);
  });
}

function setColorPaletteInTable(colorPaletteName?: EmulatorColorPalette) {
  colorPaletteTable?.querySelectorAll(`tr`)?.forEach((element, index) => {
    const colorInput = element.querySelector('.color-value') as HTMLInputElement;
    const colorSwatch = element.querySelector('.color-swatch') as HTMLInputElement;
    const colorOverlay = element.querySelector('.color-overlay') as HTMLElement;

    const colorValue = colorPaletteName ? colorPalettes[colorPaletteName][index]
      : getColorValueFromLocalStorage(index);

    if (colorInput) {
      colorInput.value = colorValue;
    }

    if (colorSwatch) {
      colorSwatch.value = colorValue;
    }

    if (colorOverlay) {
      colorOverlay.style.backgroundColor = colorValue;
    }

  });
}

function setColorPaletteInSelect() {
  for (const key in colorPalettes) {
    const allColorsMatch = colorPalettes[(key as EmulatorColorPalette)].every((color, index) => {
      return color === getColorValueFromLocalStorage(index);
    });

    if (colorPaletteSelect) {
      if (allColorsMatch) {
        colorPaletteSelect.value = key as EmulatorColorPalette;
        break;
      } else {
        colorPaletteSelect.value = customColorPaletteKeyName;
      }
    }
  }
}

function setColorPaletteInEmulator() {
  emulatorConfigurationsKeys.palette_keys.forEach((_, index) => {
    const colorValue = getColorValueFromLocalStorage(index);
    emulatorInstance.setPaletteColor(index, colorValue);
  });
}

function processInputColorValue(event: Event) {
  let colorValue = (event.target as HTMLInputElement).value.toUpperCase();

  colorValue = colorValue.replace(/[^#A-F0-9]/g, '').substring(0, 7);

  if (colorValue.length && colorValue.at(0) !== '#') {
    colorValue = `#${colorValue}`;
  }

  const validColorLengths = [0, 4, 7];
  const isValidColor = validColorLengths.includes(colorValue.length);

  return {
    color_value: colorValue,
    is_valid: isValidColor
  }
}

function setInitialColorPaletteSelectState() {
  setColorPaletteInTable();
  setColorPaletteInSelect();

  setColorPaletteInEmulator();

  if (colorPaletteSelect) {
    colorPaletteSelect.addEventListener('change', () => {
      const selectedValue = (colorPaletteSelect.value as EmulatorColorPalette);

      const colorPaletteName = colorPalettes[selectedValue] ? colorPaletteSelect.value
        : defaultColorPalette;

      colorPaletteSelect.value = colorPaletteName;

      setColorPaletteInLocalStorage(colorPaletteName as EmulatorColorPalette);
      setColorPaletteInTable(colorPaletteName as EmulatorColorPalette);

      setColorPaletteInEmulator();
      emulatorInstance.resetRom();
    });
  }

  if (colorPaletteTable) {
    colorPaletteTable.querySelectorAll(`tr .color-input-container`).forEach((container, index) => {
      const colorInput = container.querySelector('.color-value') as HTMLInputElement;

      colorInput?.addEventListener('input', (element) => {
        const { color_value: colorValue, is_valid: isValidColor } = processInputColorValue(element);

        if (!isValidColor) {
          (container as HTMLElement).style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
          return;
        }

        (container as HTMLElement).style.backgroundColor = '';

        storeColorInLocalStorage(index, colorValue);
        setColorPaletteInSelect();
        setColorPaletteInTable();

        setColorPaletteInEmulator();
        emulatorInstance.resetRom();
      });
    });

    colorPaletteTable.querySelectorAll(`tr .color-swatch-container`).forEach((element, index) => {
      const colorSwatch = element.querySelector('.color-swatch') as HTMLInputElement;

      [ 'click', 'touchstart' ].forEach((eventType) => {
        element.addEventListener(eventType, () => {
          colorSwatch.focus();
          colorSwatch.click();
        });
      });

      colorSwatch?.addEventListener('change', (element) => {
        const colorValue = (element.target as HTMLInputElement).value.toUpperCase();

        storeColorInLocalStorage(index, colorValue);
        setColorPaletteInSelect();
        setColorPaletteInTable();

        setColorPaletteInEmulator();
        emulatorInstance.resetRom();
      });
    });
  }
}

function setInitialFontAppearanceSelectState() {
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

function setSoundGainPercentageValue(value: number, element: HTMLElement | null) {
  if (element) {
    const percentage = Math.ceil((value / maximumAudioGain) * 100);
    element.innerText = `${percentage}%`;
  }
}

function setInitialSoundLevelState() {
  if (soundLevelRange) {
    const storedSoundLevel = getSoundLevel();
    const soundLevel = convertAudioGainToSoundLevel(storedSoundLevel).toString();

    soundLevelRange.value = soundLevel;
    setSoundGainPercentageValue(storedSoundLevel, soundLevelValue);

    soundLevelRange.addEventListener('change', () => {
      const soundLevel = Number.parseInt(soundLevelRange.value, 10);

      const gain = convertSoundLevelToGain(soundLevel);
      setSoundGainPercentageValue(gain, soundLevelValue);

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
        input.blur();
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
  setInitialFontAppearanceSelectState();

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

  setInitialConfigurationsStates();
  setInitialCyclesPerFrameSelectState();
  setInitialSoundState();
  setInitialSoundLevelState();
  setInitialMemorySizeSelectState();
});
