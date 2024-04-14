import { Chip8Emulator } from '../emulator/emulator';

const input = document.getElementById('file') as HTMLInputElement | null;
const resetRomBtn = document.getElementById('reset-rom-btn') as HTMLElement | null;

function initializeRomFileInputEventHandlers(emulatorInstance: Chip8Emulator) {
  if (!input) return;

  input.addEventListener('change', async (event) => {
    try {
      await emulatorInstance.startEmulation(event as GenericEvent<HTMLInputElement>);
      input.blur();
    } catch(error) {
      console.error(error);
    }
  });
}

function initializeResetRomButtonEventHandlers(emulatorInstance: Chip8Emulator) {
  if (!resetRomBtn) return;

  resetRomBtn.addEventListener('click', () => {
    try {
      emulatorInstance.resetEmulation();
    } catch(error) {
      console.error(error);
    }
  });
}

export function initializeEmulatorControllerModule(emulatorInstance: Chip8Emulator) {
  initializeRomFileInputEventHandlers(emulatorInstance);
  initializeResetRomButtonEventHandlers(emulatorInstance);
}
