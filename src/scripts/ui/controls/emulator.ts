import { Chip8Emulator } from '../../emulator/emulator';

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

async function handleFileInput(files: Array<FileSystemFileHandle>, emulatorInstance: Chip8Emulator) {
  const fileHandle = files[0];

  try {
    const fileData = await fileHandle.getFile();
    const arrayBuffer = await fileData.arrayBuffer();

    const romData = new Uint8Array(arrayBuffer);
    emulatorInstance.loadRomFromData(romData);

  } catch(error) {
    return alert(`Error loading the ROM file.`);
  }
}

function registerFileHandlerLoadRom(emulatorInstance: Chip8Emulator) {
  window.launchQueue?.setConsumer(async (launchParams) => {
    if (launchParams.files.length) {
      const files = launchParams.files as Array<FileSystemFileHandle>;
      await handleFileInput(files, emulatorInstance);
    }
  });
}

export function initializeEmulatorControllerModule(emulatorInstance: Chip8Emulator) {
  initializeRomFileInputEventHandlers(emulatorInstance);
  initializeResetRomButtonEventHandlers(emulatorInstance);

  registerFileHandlerLoadRom(emulatorInstance);
}
