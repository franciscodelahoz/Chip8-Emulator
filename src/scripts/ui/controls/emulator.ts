import { EmulatorEvents } from '../../constants/chip8.constants';
import { EmulatorState } from '../../constants/emulator.constants';
import type { Chip8Emulator } from '../../emulator/emulator';
import type { EmulatorStateChangedEvent } from '../../types/emulator';

const input = document.getElementById('file-picker');

const resetRomBtn = document.getElementById('reset-rom-btn') as HTMLButtonElement;
const stopRomBtn = document.getElementById('stop-rom-btn') as HTMLButtonElement;
const togglePlayPauseBtn = document.getElementById('toggle-play-pause-btn') as HTMLButtonElement;
const fullscreenBtn = document.getElementById('fullscreen-btn') as HTMLButtonElement;

const playIcon = document.getElementById('play-icon') as HTMLElement;
const pauseIcon = document.getElementById('pause-icon') as HTMLElement;

function updatePlayPauseButtonState(emulatorSate: EmulatorState): void {
  if (!playIcon || !pauseIcon || !togglePlayPauseBtn) return;

  switch (emulatorSate) {
    case EmulatorState.PLAYING: {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
      togglePlayPauseBtn.disabled = false;
      break;
    }

    case EmulatorState.PAUSED: {
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
      togglePlayPauseBtn.disabled = false;
      break;
    }

    case EmulatorState.STOPPED: {
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
      togglePlayPauseBtn.disabled = true;
      break;
    }
  }
}

function updateResetButtonState(emulatorSate: EmulatorState): void {
  if (!resetRomBtn) return;

  switch (emulatorSate) {
    case EmulatorState.PLAYING: {
      resetRomBtn.disabled = false;
      break;
    }

    case EmulatorState.PAUSED: {
      resetRomBtn.disabled = false;
      break;
    }

    case EmulatorState.STOPPED: {
      resetRomBtn.disabled = true;
      break;
    }
  }
}

function updateStopButtonState(emulatorSate: EmulatorState): void {
  if (!stopRomBtn) return;

  switch (emulatorSate) {
    case EmulatorState.PLAYING: {
      stopRomBtn.disabled = false;
      break;
    }

    case EmulatorState.PAUSED: {
      stopRomBtn.disabled = false;
      break;
    }

    case EmulatorState.STOPPED: {
      stopRomBtn.disabled = true;
      break;
    }
  }
}

async function getFileFromHandle(fileHandle: File | FileSystemFileHandle): Promise<File> {
  if (fileHandle instanceof FileSystemFileHandle) {
    return fileHandle.getFile();
  }

  return fileHandle;
}

async function handleFileInput(files: FileList | FileSystemFileHandle[], emulatorInstance: Chip8Emulator): Promise<void> {
  const fileData = await getFileFromHandle(files[0]);

  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const romData = new Uint8Array(arrayBuffer);

    emulatorInstance.loadRomFromData(romData);
  } catch (error) {
    console.error(error);

    alert(`Error loading the ROM file.`);
  }
}

function setNowPlayingRomName(romName: string): void {
  if (!input) return;

  input.innerText = `Loaded ROM: ${romName}`;
}

async function handleFilePickerEvent(emulatorInstance: Chip8Emulator): Promise<void> {
  const filePickerOptions: OpenFilePickerOptions = {
    types: [
      {
        description : 'Chip-8 ROM files',
        accept      : {
          'application/octet-stream': [ '.ch8', '.sc8', '.xo8' ],
        },
      },
    ],
    multiple: false,
  };

  const fileHandle = await window.showOpenFilePicker(filePickerOptions);

  await handleFileInput(fileHandle, emulatorInstance);
  setNowPlayingRomName(fileHandle[0].name);
}

function handleFilePickerEventFallback(emulatorInstance: Chip8Emulator): void {
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

function initializeRomFileInputEventHandlers(emulatorInstance: Chip8Emulator): void {
  if (!input) return;

  input.addEventListener('click', async () => {
    try {
      if ('showOpenFilePicker' in window) {
        await handleFilePickerEvent(emulatorInstance);
      } else {
        handleFilePickerEventFallback(emulatorInstance);
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        alert(`Error loading the ROM file.`);
      }
    }
  });
}

function registerEmulatorStateChangeEvent(emulatorInstance: Chip8Emulator): void {
  emulatorInstance.addEventListener(EmulatorEvents.EMULATOR_STATE_CHANGED, (event) => {
    const { state } = (event as CustomEvent<EmulatorStateChangedEvent>).detail;

    console.log(state);

    updatePlayPauseButtonState(state);
    updateResetButtonState(state);
    updateStopButtonState(state);
  });
}

function registerResetRomButtonEventHandlers(emulatorInstance: Chip8Emulator): void {
  if (!resetRomBtn) return;

  resetRomBtn.addEventListener('click', () => {
    emulatorInstance.resetEmulation();
  });
}

function registerStopRomButtonEventHandlers(emulatorInstance: Chip8Emulator): void {
  if (!stopRomBtn) return;

  stopRomBtn.addEventListener('click', () => {
    emulatorInstance.stopEmulatorLoop();
  });
}

function registerPlayPauseButtonEventHandlers(emulatorInstance: Chip8Emulator): void {
  if (!togglePlayPauseBtn) return;

  togglePlayPauseBtn.addEventListener('click', () => {
    emulatorInstance.togglePauseState();
  });
}

function registerFullscreenButtonEventHandlers(emulatorInstance: Chip8Emulator): void {
  if (!fullscreenBtn) return;

  fullscreenBtn.addEventListener('click', () => {
    emulatorInstance.toggleFullScreenMode();
  });
}

function registerFileHandlerLoadRom(emulatorInstance: Chip8Emulator): void {
  window.launchQueue?.setConsumer(async (launchParams) => {
    if (launchParams.files.length) {
      const files = launchParams.files as FileSystemFileHandle[];

      await handleFileInput(files, emulatorInstance);
      setNowPlayingRomName(files[0].name);
    }
  });
}

export function initializeEmulatorControllerModule(emulatorInstance: Chip8Emulator): void {
  initializeRomFileInputEventHandlers(emulatorInstance);
  registerEmulatorStateChangeEvent(emulatorInstance);

  registerResetRomButtonEventHandlers(emulatorInstance);
  registerStopRomButtonEventHandlers(emulatorInstance);
  registerPlayPauseButtonEventHandlers(emulatorInstance);
  registerFullscreenButtonEventHandlers(emulatorInstance);

  registerFileHandlerLoadRom(emulatorInstance);
}
