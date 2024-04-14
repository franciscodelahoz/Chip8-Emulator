import {
  Chip8Quirks,
  defaultMemorySize,
  defaultQuirkConfigurations,
  schipQuirkConfigurations,
  xoChipMemorySize,
  xoChipQuirkConfigurations
} from '../constants/chip8.constants';
import { Chip8Emulator } from '../emulator/emulator';

const quirkConfigCheckboxes = document.getElementsByClassName('quirk-checkbox') as HTMLCollectionOf<HTMLInputElement>;

const memorySizeSelect = document.getElementById('memory-size-select') as HTMLSelectElement | null;

const chip8ProfileBtn = document.getElementById('chip8-profile') as HTMLElement | null;
const schipProfileBtn = document.getElementById('schip-profile') as HTMLElement | null;
const xoChipProfileBtn = document.getElementById('xo-chip-profile') as HTMLElement | null;

function getQuirkValue(quirkName: Chip8Quirks, emulatorInstance: Chip8Emulator) {
  const storedQuirkValue = window.localStorage.getItem(quirkName);

  if (!storedQuirkValue) {
    return emulatorInstance.getCpuQuirkValue(quirkName);
  }

  const parsedStoredValue = storedQuirkValue === 'true' ? true : false;

  emulatorInstance.setCpuQuirkValue(quirkName, parsedStoredValue);
  return parsedStoredValue;
}

function setQuirkValue(quirkName: Chip8Quirks, value: boolean, emulatorInstance: Chip8Emulator) {
  const parsedValueToStore = value ? 'true' : 'false';

  window.localStorage.setItem(quirkName, parsedValueToStore);
  emulatorInstance.setCpuQuirkValue(quirkName, value);
}

function setQuirkValuesFromProfiles(quirkValues: Record<Chip8Quirks, boolean>, emulatorInstance: Chip8Emulator) {
  const quirkValuesKeys = Object.keys(quirkValues) as Array<Chip8Quirks>;

  quirkValuesKeys.forEach((quirkName) => {
    const quirk = [ ...quirkConfigCheckboxes ].find((element) => {
      return element.getAttribute('data-quirk-property-name') === quirkName;
    });

    if (quirk) {
      quirk.checked = quirkValues[quirkName];
      setQuirkValue(quirkName, quirkValues[quirkName], emulatorInstance);
    }
  });
}

function getMemorySize(emulatorInstance: Chip8Emulator) {
  const storedMemorySize = window.localStorage.getItem('memorySize');

  if (!storedMemorySize) {
    return emulatorInstance.getMemorySize();
  }

  const parsedStoredValue = Number.parseInt(storedMemorySize, 10);
  emulatorInstance.setMemorySize(parsedStoredValue);
  return parsedStoredValue;
}

function setInitialMemorySizeSelectState(emulatorInstance: Chip8Emulator) {
  if (memorySizeSelect) {
    memorySizeSelect.value = getMemorySize(emulatorInstance).toString();

    memorySizeSelect.addEventListener('change', () => {
      const memorySize = Number.parseInt(memorySizeSelect.value, 10);
      emulatorInstance.setMemorySize(memorySize);
      window.localStorage.setItem('memorySize', memorySize.toString());
    });
  }
}

function setMemorySizeFromProfile(memorySize: number, emulatorInstance: Chip8Emulator) {
  if (memorySizeSelect) {
    memorySizeSelect.value = memorySize.toString();
    emulatorInstance.setMemorySize(memorySize);
    window.localStorage.setItem('memorySize', memorySize.toString());
  }
}

function setInitialConfigurationsStates(emulatorInstance: Chip8Emulator) {
  [ ...quirkConfigCheckboxes ].forEach((element) => {
    const quirkName = element.getAttribute('data-quirk-property-name') as Chip8Quirks;
    element.checked = getQuirkValue(quirkName, emulatorInstance);

    element.addEventListener('change', () => {
      setQuirkValue(quirkName, element.checked, emulatorInstance);
    });
  });

  chip8ProfileBtn?.addEventListener('click', () => {
    setQuirkValuesFromProfiles(defaultQuirkConfigurations, emulatorInstance);
    setMemorySizeFromProfile(defaultMemorySize, emulatorInstance);
  });

  schipProfileBtn?.addEventListener('click', () => {
    setQuirkValuesFromProfiles(schipQuirkConfigurations, emulatorInstance);
    setMemorySizeFromProfile(defaultMemorySize, emulatorInstance);
  });

  xoChipProfileBtn?.addEventListener('click', () => {
    setQuirkValuesFromProfiles(xoChipQuirkConfigurations, emulatorInstance);
    setMemorySizeFromProfile(xoChipMemorySize, emulatorInstance);
  });
}

export function initializeROMCompatibilitySettingsModule(emulatorInstance: Chip8Emulator) {
  setInitialMemorySizeSelectState(emulatorInstance);
  setInitialConfigurationsStates(emulatorInstance);
}
