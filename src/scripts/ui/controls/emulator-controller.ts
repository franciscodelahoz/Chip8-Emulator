import { EmulatorEvents } from '../../constants/chip8.constants';
import { defaultLoadedRomTitle, EmulatorState } from '../../constants/emulator.constants';
import type { Chip8Emulator } from '../../emulator/emulator';
import { FileManager } from '../../libraries/file-manager';
import type { EmulatorFullScreenEvent, EmulatorRecordCanvasEvent, EmulatorStateChangedEvent } from '../../types/emulator';

const loadFileBtn = document.getElementById('file-picker');

const resetRomBtn = document.getElementById('reset-rom-btn') as HTMLButtonElement;
const stopRomBtn = document.getElementById('stop-rom-btn') as HTMLButtonElement;
const togglePlayPauseBtn = document.getElementById('toggle-play-pause-btn') as HTMLButtonElement;
const fullscreenBtn = document.getElementById('fullscreen-btn') as HTMLButtonElement;
const recordCanvasBtn = document.getElementById('record-canvas-btn') as HTMLButtonElement;

const playIcon = document.getElementById('play-icon') as HTMLElement;
const pauseIcon = document.getElementById('pause-icon') as HTMLElement;

const fullscreenIcon = document.getElementById('fullscreen-icon') as HTMLElement;
const exitFullscreenIcon = document.getElementById('exit-fullscreen-icon') as HTMLElement;

const fileNameContainer = document.getElementById('file-name-container') as HTMLElement;
const emulatorStatusIcon = document.querySelector('.rom-status.icon-container svg') as SVGElement;
const emulatorStatusText = document.querySelector('.rom-status .rom-status-text') as HTMLElement;

const fileManager = new FileManager();

function updatePlayPauseButtonState(emulatorSate: EmulatorState): void {
  if (!playIcon || !pauseIcon || !togglePlayPauseBtn) return;

  switch (emulatorSate) {
    case EmulatorState.PLAYING: {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
      togglePlayPauseBtn.disabled = false;

      emulatorStatusIcon.style.fill = '#34ff66';
      emulatorStatusText.innerText = 'Playing';
      break;
    }

    case EmulatorState.PAUSED: {
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
      togglePlayPauseBtn.disabled = false;

      emulatorStatusIcon.style.fill = 'orange';
      emulatorStatusText.innerText = 'Paused';
      break;
    }

    case EmulatorState.STOPPED: {
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
      togglePlayPauseBtn.disabled = true;

      emulatorStatusIcon.style.fill = 'red';
      emulatorStatusText.innerText = 'Stopped';

      fileNameContainer.innerText = defaultLoadedRomTitle;
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

function registerEmulatorStateChangeEvent(emulatorInstance: Chip8Emulator): void {
  emulatorInstance.addEventListener(EmulatorEvents.EMULATOR_STATE_CHANGED, (event) => {
    const { state } = (event as CustomEvent<EmulatorStateChangedEvent>).detail;

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

function registerFullscreenEventHandlers(emulatorInstance: Chip8Emulator): void {
  emulatorInstance.addEventListener(EmulatorEvents.FULLSCREEN_MODE_CHANGED, (event) => {
    const { fullscreen } = (event as CustomEvent<EmulatorFullScreenEvent>).detail;

    if (!fullscreenIcon || !exitFullscreenIcon) return;

    if (fullscreen) {
      fullscreenIcon.style.display = 'none';
      exitFullscreenIcon.style.display = 'inline';

      fullscreenBtn.title = 'Exit Fullscreen (0)';
    } else {
      fullscreenIcon.style.display = 'inline';
      exitFullscreenIcon.style.display = 'none';

      fullscreenBtn.title = 'Enter Fullscreen (0)';
    }
  });
}

function setNowPlayingRomName(romName: string): void {
  if (!fileNameContainer) return;

  fileNameContainer.innerText = romName;
}

function initializeRomFileInputEventHandlers(emulatorInstance: Chip8Emulator): void {
  if (!loadFileBtn) return;

  loadFileBtn.addEventListener('click', async (event) => {
    const romFile = await fileManager.openFilePicker({
      description : 'Chip-8 ROM files',
      extensions  : [ '.ch8', '.sc8', '.xo8' ],
      mimeType    : 'application/octet-stream',
    });

    if (romFile) {
      emulatorInstance.loadRomFromData(romFile.data, romFile.name);
      setNowPlayingRomName(romFile.name);
    }
  });
}

function registerFileHandlerLoadRom(emulatorInstance: Chip8Emulator): void {
  fileManager.registerFileHandler((fileData) => {
    if (fileData) {
      emulatorInstance.loadRomFromData(fileData.data, fileData.name);
      setNowPlayingRomName(fileData.name);
    }
  });
}

function registerRecordCanvasButtonEventHandlers(emulatorInstance: Chip8Emulator): void {
  if (!recordCanvasBtn) return;

  recordCanvasBtn.addEventListener('click', async () => {
    await emulatorInstance.toggleRecordCanvas();
  });
}

function registerRecordCanvasEventHandlers(emulatorInstance: Chip8Emulator): void {
  emulatorInstance.addEventListener(EmulatorEvents.RECORD_CANVAS_CHANGED, (event) => {
    const { recording } = (event as CustomEvent<EmulatorRecordCanvasEvent>).detail;

    if (!recordCanvasBtn) return;

    if (recording) {
      recordCanvasBtn.classList.add('recording');
      recordCanvasBtn.title = 'Stop Recording (R)';
    } else {
      recordCanvasBtn.classList.remove('recording');
      recordCanvasBtn.title = 'Start Recording (R)';
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
  registerFullscreenEventHandlers(emulatorInstance);

  registerRecordCanvasButtonEventHandlers(emulatorInstance);
  registerRecordCanvasEventHandlers(emulatorInstance);

  registerFileHandlerLoadRom(emulatorInstance);
}
