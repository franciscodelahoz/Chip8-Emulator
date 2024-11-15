import { Chip8Emulator } from '../../emulator/emulator';

const input = document.getElementById('file-picker') as HTMLElement | null;
const resetRomBtn = document.getElementById('reset-rom-btn') as HTMLElement | null;

async function getFileFromHandle(fileHandle: File | FileSystemFileHandle): Promise<File> {
  if (fileHandle instanceof FileSystemFileHandle) {
    return await fileHandle.getFile();

  } else {
    return fileHandle;
  }
}

async function handleFileInput(files: FileList | FileSystemFileHandle[], emulatorInstance: Chip8Emulator) {
  let fileData = await getFileFromHandle(files[0]);

  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const romData = new Uint8Array(arrayBuffer);

    emulatorInstance.loadRomFromData(romData);

  } catch(error) {
    return alert(`Error loading the ROM file.`);
  }
}

function setNowPlayingRomName(romName: string) {
  if (!input) return;
  input.innerText = `Loaded ROM: ${romName}`;
}

async function handleFilePickerEvent(emulatorInstance: Chip8Emulator) {
  const filePickerOptions: OpenFilePickerOptions = {
    types: [
      {
        description: 'Chip-8 ROM files',
        accept: {
          'application/octet-stream': ['.ch8', '.sc8', '.xo8'],
        },
      },
    ],
    multiple: false,
  };

  const fileHandle = await window.showOpenFilePicker(filePickerOptions);
  await handleFileInput(fileHandle, emulatorInstance);

  setNowPlayingRomName(fileHandle[0].name);
}

async function handleFilePickerEventFallback(emulatorInstance: Chip8Emulator) {
  const fileInput = document.createElement('input');

  fileInput.type = 'file';
  fileInput.accept = '.ch8,.sc8,.xo8';
  fileInput.style.display = 'none';

  fileInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLInputElement;

    if (target.files && target.files.length > 0) {
      await handleFileInput(target.files, emulatorInstance);
      setNowPlayingRomName(target.files[0].name);
    }
  });

  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
}

function initializeRomFileInputEventHandlers(emulatorInstance: Chip8Emulator) {
  if (!input) return;

  input.addEventListener('click', async () => {
    try {
      if ('showOpenFilePicker' in window) {
        await handleFilePickerEvent(emulatorInstance);

      } else {
        await handleFilePickerEventFallback(emulatorInstance);
      }

    } catch(error) {
      if ((error as Error)?.name !== 'AbortError') {
        return alert(`Error loading the ROM file.`);
      }
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

function registerFileHandlerLoadRom(emulatorInstance: Chip8Emulator) {
  window.launchQueue?.setConsumer(async (launchParams) => {
    if (launchParams.files.length) {
      const files = launchParams.files as Array<FileSystemFileHandle>;

      await handleFileInput(files, emulatorInstance);
      setNowPlayingRomName(files[0].name);
    }
  });
}

export function initializeEmulatorControllerModule(emulatorInstance: Chip8Emulator) {
  initializeRomFileInputEventHandlers(emulatorInstance);
  initializeResetRomButtonEventHandlers(emulatorInstance);

  registerFileHandlerLoadRom(emulatorInstance);
}
