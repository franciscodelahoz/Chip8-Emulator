import { GeneralEmulatorSettings } from '../../constants/settings.constants';
import SettingsManager from '../../database/managers/settings.manager';
import type { Chip8Emulator } from '../../emulator/emulator';

const cyclesPerFrameSelect = document.getElementById('cycles-per-frame-select') as HTMLSelectElement | null;

async function setCurrentCyclePerFrame(emulatorInstance: Chip8Emulator): Promise<void> {
  const storedCyclesPerFrameValue = await SettingsManager.getSetting<number>(GeneralEmulatorSettings.CYCLES_PER_FRAME);
  const cyclesPerFrame = storedCyclesPerFrameValue || emulatorInstance.getCpuCyclesPerFrame();

  if (cyclesPerFrameSelect) {
    cyclesPerFrameSelect.value = cyclesPerFrame.toString();
  }

  emulatorInstance.setCpuCyclesPerFrame(cyclesPerFrame);
}

function setInitialCyclesPerFrameSelectState(emulatorInstance: Chip8Emulator): void {
  if (!cyclesPerFrameSelect) return;

  cyclesPerFrameSelect.addEventListener('change', async () => {
    const cyclesPerFrame = Number.parseInt(cyclesPerFrameSelect.value, 10);

    emulatorInstance.setCpuCyclesPerFrame(cyclesPerFrame);
    await SettingsManager.setSetting(GeneralEmulatorSettings.CYCLES_PER_FRAME, cyclesPerFrame);
  });
}

export async function initializeGeneralSettingsModule(emulatorInstance: Chip8Emulator): Promise<void> {
  await setCurrentCyclePerFrame(emulatorInstance);
  setInitialCyclesPerFrameSelectState(emulatorInstance);
}
