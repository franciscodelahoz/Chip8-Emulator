import { Chip8Emulator } from '../emulator/emulator';

const cyclesPerFrameSelect = document.getElementById('cycles-per-frame-select') as HTMLSelectElement | null;

function getCyclesPerFrame(emulatorInstance: Chip8Emulator) {
  const storedCyclesPerFrameValue = window.localStorage.getItem('cyclesPerFrame');

  if (!storedCyclesPerFrameValue) {
    return emulatorInstance.getCpuCyclesPerFrame();
  }

  const parsedStoredValue = Number.parseInt(storedCyclesPerFrameValue, 10);
  emulatorInstance.setCpuCyclesPerFrame(parsedStoredValue);
  return parsedStoredValue;
}

function setInitialCyclesPerFrameSelectState(emulatorInstance: Chip8Emulator) {
  if (cyclesPerFrameSelect) {
    cyclesPerFrameSelect.value = getCyclesPerFrame(emulatorInstance).toString();

    cyclesPerFrameSelect.addEventListener('change', () => {
      const cyclesPerFrame = Number.parseInt(cyclesPerFrameSelect.value, 10);
      emulatorInstance.setCpuCyclesPerFrame(cyclesPerFrame);
      window.localStorage.setItem('cyclesPerFrame', cyclesPerFrame.toString());
    });
  }
}

export function initializeGeneralSettingsModule(emulatorInstance: Chip8Emulator) {
  setInitialCyclesPerFrameSelectState(emulatorInstance);
}
