import type { Chip8Quirks } from '../../constants/chip8.constants';
import {
  defaultMemorySize,
  defaultQuirkConfigurations,
  schipQuirkConfigurations,
  xoChipMemorySize,
  xoChipQuirkConfigurations,
} from '../../constants/chip8.constants';
import { GeneralEmulatorSettings } from '../../constants/settings.constants';
import SettingsManager from '../../database/managers/settings.manager';
import type { Chip8Emulator } from '../../emulator/emulator';

const quirkConfigCheckboxes = document.getElementsByClassName('quirk-checkbox') as HTMLCollectionOf<HTMLInputElement>;
const memorySizeSelect = document.getElementById('memory-size-select') as HTMLSelectElement | null;

const chip8ProfileBtn = document.getElementById('chip8-profile');
const schipProfileBtn = document.getElementById('schip-profile');
const xoChipProfileBtn = document.getElementById('xo-chip-profile');

async function getQuirkValue(quirkName: Chip8Quirks, emulatorInstance: Chip8Emulator): Promise<boolean> {
  const storedQuirkValue = await SettingsManager.getSetting<boolean>(quirkName);

  if (storedQuirkValue === undefined) {
    return emulatorInstance.getCpuQuirkValue(quirkName);
  }

  return storedQuirkValue;
}

async function setQuirkValue(quirkName: Chip8Quirks, value: boolean, emulatorInstance: Chip8Emulator): Promise<void> {
  await SettingsManager.setSetting(quirkName, value);
  emulatorInstance.setCpuQuirkValue(quirkName, value);
}

function setQuirkValuesFromProfiles(quirkValues: Record<Chip8Quirks, boolean>, emulatorInstance: Chip8Emulator): void {
  const quirkValuesKeys = Object.keys(quirkValues) as Chip8Quirks[];

  quirkValuesKeys.forEach(async (quirkName) => {
    const quirk = [ ...quirkConfigCheckboxes ].find((element) => element.getAttribute('data-quirk-property-name') === quirkName);

    if (quirk) {
      quirk.checked = quirkValues[quirkName];
      await setQuirkValue(quirkName, quirkValues[quirkName], emulatorInstance);
    }
  });
}

async function setCurrentMemorySize(emulatorInstance: Chip8Emulator): Promise<void> {
  const storedMemorySize = await SettingsManager.getSetting<number>(GeneralEmulatorSettings.MEMORY_SIZE);
  const memorySize = storedMemorySize ?? defaultMemorySize;

  emulatorInstance.setMemorySize(memorySize);

  if (memorySizeSelect) {
    memorySizeSelect.value = memorySize.toString();
  }
}

async function setMemorySizeFromProfile(memorySize: number, emulatorInstance: Chip8Emulator): Promise<void> {
  if (memorySizeSelect) {
    memorySizeSelect.value = memorySize.toString();

    emulatorInstance.setMemorySize(memorySize);
    await SettingsManager.setSetting(GeneralEmulatorSettings.MEMORY_SIZE, memorySize);
  }
}

function setInitialMemorySizeSelectState(emulatorInstance: Chip8Emulator): void {
  if (!memorySizeSelect) return;

  memorySizeSelect.addEventListener('change', async () => {
    const memorySize = Number.parseInt(memorySizeSelect.value, 10);

    emulatorInstance.setMemorySize(memorySize);
    await SettingsManager.setSetting(GeneralEmulatorSettings.MEMORY_SIZE, memorySize);
  });
}

function setInitialConfigurationsStates(emulatorInstance: Chip8Emulator): void {
  [ ...quirkConfigCheckboxes ].forEach(async (element) => {
    const quirkName = element.getAttribute('data-quirk-property-name') as Chip8Quirks;
    const storedQuirkValue = await getQuirkValue(quirkName, emulatorInstance);

    element.checked = storedQuirkValue;
    emulatorInstance.setCpuQuirkValue(quirkName, storedQuirkValue);

    element.addEventListener('change', async () => {
      await setQuirkValue(quirkName, element.checked, emulatorInstance);
    });
  });

  chip8ProfileBtn?.addEventListener('click', async () => {
    setQuirkValuesFromProfiles(defaultQuirkConfigurations, emulatorInstance);
    await setMemorySizeFromProfile(defaultMemorySize, emulatorInstance);
  });

  schipProfileBtn?.addEventListener('click', async () => {
    setQuirkValuesFromProfiles(schipQuirkConfigurations, emulatorInstance);
    await setMemorySizeFromProfile(defaultMemorySize, emulatorInstance);
  });

  xoChipProfileBtn?.addEventListener('click', async () => {
    setQuirkValuesFromProfiles(xoChipQuirkConfigurations, emulatorInstance);
    await setMemorySizeFromProfile(xoChipMemorySize, emulatorInstance);
  });
}

export async function initializeROMCompatibilitySettingsModule(emulatorInstance: Chip8Emulator): Promise<void> {
  await setCurrentMemorySize(emulatorInstance);

  setInitialMemorySizeSelectState(emulatorInstance);
  setInitialConfigurationsStates(emulatorInstance);
}
