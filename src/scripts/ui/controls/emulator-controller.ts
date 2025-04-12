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
const emulatorStatusIcon = document.querySelector<SVGElement>('.rom-status.icon-container svg');
const emulatorStatusText = document.querySelector<HTMLElement>('.rom-status .rom-status-text');

const fileManager = new FileManager();

function updateCurrentEmulationState(emulatorState: EmulatorState): void {
  if (!emulatorStatusIcon || !emulatorStatusText) return;

  const stateConfigs = {
    [EmulatorState.PLAYING] : { text: 'Playing', color: '#34ff66' },
    [EmulatorState.PAUSED]  : { text: 'Paused', color: 'orange' },
    [EmulatorState.STOPPED] : { text: 'Stopped', color: 'red' },
  };

  const config = stateConfigs[emulatorState];

  emulatorStatusText.innerText = config.text;
  emulatorStatusIcon.style.fill = config.color;
}

function setDefaultRomTitle(emulatorState: EmulatorState): void {
  if (!fileNameContainer) return;

  if (emulatorState === EmulatorState.STOPPED) {
    fileNameContainer.innerText = defaultLoadedRomTitle;
  }
}

function updatePlayPauseButtonState(emulatorState: EmulatorState): void {
  if (!playIcon || !pauseIcon || !togglePlayPauseBtn) return;

  let playIconDisplay = 'inline';
  let pauseIconDisplay = 'none';
  let buttonDisabled = true;

  if (emulatorState === EmulatorState.PLAYING) {
    playIconDisplay = 'none';
    pauseIconDisplay = 'inline';
    buttonDisabled = false;
  } else if (emulatorState === EmulatorState.PAUSED) {
    buttonDisabled = false;
  }

  playIcon.style.display = playIconDisplay;
  pauseIcon.style.display = pauseIconDisplay;
  togglePlayPauseBtn.disabled = buttonDisabled;
}

function updateFullscreenButtonState(isFullScreen: boolean): void {
  if (!fullscreenIcon || !exitFullscreenIcon || !fullscreenBtn) return;

  if (isFullScreen) {
    fullscreenIcon.style.display = 'none';
    exitFullscreenIcon.style.display = 'inline';

    fullscreenBtn.title = 'Exit Fullscreen (0)';
  } else {
    fullscreenIcon.style.display = 'inline';
    exitFullscreenIcon.style.display = 'none';

    fullscreenBtn.title = 'Enter Fullscreen (0)';
  }
}

function updateRecordButtonState(isRecording: boolean): void {
  if (!recordCanvasBtn) return;

  if (isRecording) {
    recordCanvasBtn.classList.add('recording');
    recordCanvasBtn.title = 'Stop Recording (R)';
  } else {
    recordCanvasBtn.classList.remove('recording');
    recordCanvasBtn.title = 'Start Recording (R)';
  }
}

function updateButtonEnabledState(button: HTMLButtonElement | null, emulatorState: EmulatorState): void {
  if (!button) return;

  const enabled = emulatorState === EmulatorState.PLAYING || emulatorState === EmulatorState.PAUSED;

  button.disabled = !enabled;
}

function updateResetButtonState(emulatorState: EmulatorState): void {
  updateButtonEnabledState(resetRomBtn, emulatorState);
}

function updateStopButtonState(emulatorState: EmulatorState): void {
  updateButtonEnabledState(stopRomBtn, emulatorState);
}

function updateAllControlsState(emulatorState: EmulatorState): void {
  updatePlayPauseButtonState(emulatorState);
  updateResetButtonState(emulatorState);
  updateStopButtonState(emulatorState);
}

function registerEmulatorStateChangeEvent(emulatorInstance: Chip8Emulator): void {
  emulatorInstance.addEventListener(EmulatorEvents.EMULATOR_STATE_CHANGED, (event) => {
    const { state } = (event as CustomEvent<EmulatorStateChangedEvent>).detail;

    updateAllControlsState(state);
    updateCurrentEmulationState(state);
    setDefaultRomTitle(state);
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

function registerRecordCanvasButtonEventHandlers(emulatorInstance: Chip8Emulator): void {
  if (!recordCanvasBtn) return;

  recordCanvasBtn.addEventListener('click', async () => {
    await emulatorInstance.toggleRecordCanvas();
  });
}

function registerFullscreenEventHandlers(emulatorInstance: Chip8Emulator): void {
  emulatorInstance.addEventListener(EmulatorEvents.FULLSCREEN_MODE_CHANGED, (event) => {
    const { fullscreen } = (event as CustomEvent<EmulatorFullScreenEvent>).detail;

    updateFullscreenButtonState(fullscreen);
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

function registerRecordCanvasEventHandlers(emulatorInstance: Chip8Emulator): void {
  emulatorInstance.addEventListener(EmulatorEvents.RECORD_CANVAS_CHANGED, (event) => {
    const { recording } = (event as CustomEvent<EmulatorRecordCanvasEvent>).detail;

    updateRecordButtonState(recording);
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
