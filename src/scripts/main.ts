import '../styles/style.css';

import {
  Chip8Quirks,
  defaultQuirkConfigurations,
  schipQuirkConfigurations,
  xoChipQuirkConfigurations
} from './constants/chip8.constants';
import { CPU } from './emulator/cpu';
import { AudioInterface } from './interfaces/audio';
import { DisplayInterface } from './interfaces/display';
import { KeyBoardInterface } from './interfaces/keyboard';

const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
const input = document.getElementById('file') as HTMLInputElement | null;
const resetRomBtn = document.getElementById('reset-rom-btn') as HTMLElement | null;

const configurationSideBar = document.getElementById('configuration-sidebar') as HTMLElement | null;
const closeConfigurationSideBarBtn = document.getElementById('close-configurations-button') as HTMLElement | null;
const openConfigurationSideBarBtn = document.getElementById('open-configurations-button') as HTMLElement | null;

const cyclesPerFrameSelect = document.getElementById('cycles-per-frame-select') as HTMLSelectElement | null;
const soundStateCheckbox = document.getElementById('sound-state-checkbox') as HTMLInputElement | null;

const soundLevelRange = document.getElementById('sound-level-range') as HTMLInputElement | null;
const soundLevelValue = document.getElementById('sound-level-value') as HTMLElement | null;

const quirkConfigCheckboxes = document.getElementsByClassName('quirk-checkbox') as HTMLCollectionOf<HTMLInputElement>;

const chip8ProfileBtn = document.getElementById('chip8-profile') as HTMLElement | null;
const schipProfileBtn = document.getElementById('schip-profile') as HTMLElement | null;
const xoChipProfileBtn = document.getElementById('xo-chip-profile') as HTMLElement | null;

const displayInstance = new DisplayInterface(canvas);
const keyboardInstance = new KeyBoardInterface();
const audioInstance = new AudioInterface();

const cpu = new CPU(displayInstance, audioInstance, keyboardInstance);

let loop = 0;
let lastFrameTime = 0;

const targetFPS = 60;
let frameInterval = 1000 / targetFPS;

function step(currentTime: number) {
  const deltaTime = currentTime - lastFrameTime;

  if (deltaTime >= frameInterval) {
    try {
      cpu.cycle();
    } catch(error) {
      console.error(error);
      stop();
    }

    lastFrameTime = currentTime;
  }

  loop = window.requestAnimationFrame(step);
}

function start() {
  loop = window.requestAnimationFrame(step);
}

function stop() {
  window.cancelAnimationFrame(loop);
}

function readAsArrayBuffer(fileInput: HTMLInputElement): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const input: File | undefined = fileInput?.files?.[0];

    if (!input) {
      reject('no file input found');
    }

    const fileReader = new FileReader();

    fileReader.readAsArrayBuffer(input as File);

    fileReader.addEventListener('load', (e) => resolve(e.target?.result as ArrayBuffer));
    fileReader.addEventListener('error', (error) => reject(error));
  });
}

async function readFile(fileInput: GenericEvent<HTMLInputElement>) {
  const arrayBuffer = await readAsArrayBuffer(fileInput.target);
  const romData = new Uint8Array(arrayBuffer);
  return romData;
}

function closeSideMenu() {
  if (configurationSideBar) {
    configurationSideBar.classList.remove('active');
  }
}

function openSideMenu() {
  if (configurationSideBar) {
    configurationSideBar.classList.toggle('active');
  }
}

function getQuirkValue(quirkName: Chip8Quirks) {
  const storedQuirkValue = window.localStorage.getItem(quirkName);

  if (!storedQuirkValue) {
    return cpu.getQuirkValue(quirkName);
  }

  const parsedStoredValue = storedQuirkValue === 'true' ? true : false;

  cpu.setQuirkValue(quirkName, parsedStoredValue);
  return parsedStoredValue;
}

function setQuirkValue(quirkName: Chip8Quirks, value: boolean) {
  const parsedValueToStore = value ? 'true' : 'false';

  window.localStorage.setItem(quirkName, parsedValueToStore);
  cpu.setQuirkValue(quirkName, value);
}

function setQuirkValuesFromProfiles(quirkValues: Record<Chip8Quirks, boolean>) {
  const quirkValuesKeys = Object.keys(quirkValues) as Array<Chip8Quirks>;

  quirkValuesKeys.forEach((quirkName) => {
    const quirk = [ ...quirkConfigCheckboxes ].find((element) => {
      return element.getAttribute('data-quirk-property-name') === quirkName;
    });

    if (quirk) {
      quirk.checked = quirkValues[quirkName];
      setQuirkValue(quirkName, quirkValues[quirkName]);
    }
  });
}

function setInitialConfigurationsStates() {
  [ ...quirkConfigCheckboxes ].forEach((element) => {
    const quirkName = element.getAttribute('data-quirk-property-name') as Chip8Quirks;
    element.checked = getQuirkValue(quirkName);

    element.addEventListener('change', () => {
      setQuirkValue(quirkName, element.checked);
    });
  });

  chip8ProfileBtn?.addEventListener('click', () => {
    setQuirkValuesFromProfiles(defaultQuirkConfigurations);
  });

  schipProfileBtn?.addEventListener('click', () => {
    setQuirkValuesFromProfiles(schipQuirkConfigurations);
  });

  xoChipProfileBtn?.addEventListener('click', () => {
    setQuirkValuesFromProfiles(xoChipQuirkConfigurations);
  });
}

function getCyclesPerFrame() {
  const storedCyclesPerFrameValue = window.localStorage.getItem('cyclesPerFrame');

  if (!storedCyclesPerFrameValue) {
    return cpu.getCyclesPerFrame();
  }

  const parsedStoredValue = Number.parseInt(storedCyclesPerFrameValue, 10);
  cpu.setCyclesPerFrame(parsedStoredValue);
  return parsedStoredValue;
}

function setInitialCyclesPerFrameSelectState() {
  if (cyclesPerFrameSelect) {
    cyclesPerFrameSelect.value = getCyclesPerFrame().toString();

    cyclesPerFrameSelect.addEventListener('change', () => {
      const cyclesPerFrame = Number.parseInt(cyclesPerFrameSelect.value, 10);
      cpu.setCyclesPerFrame(cyclesPerFrame);
      window.localStorage.setItem('cyclesPerFrame', cyclesPerFrame.toString());
    });
  }
}

function getSoundState() {
  const storedSoundState = window.localStorage.getItem('soundState');

  if (!storedSoundState) {
    return cpu.getSoundState();
  }

  const parsedStoredValue = storedSoundState === 'true' ? true : false;

  cpu.setSoundState(parsedStoredValue);
  return parsedStoredValue;
}

function setInitialSoundState() {
  if (soundStateCheckbox) {
    soundStateCheckbox.checked = getSoundState();

    soundStateCheckbox.addEventListener('change', () => {
      const soundState = soundStateCheckbox.checked;
      cpu.setSoundState(soundState);
      window.localStorage.setItem('soundState', soundState.toString());
    });
  }
}

function convertAudioGainToSoundLevel(gain: number) {
  return Math.round(gain * 100);
}

function convertSoundLevelToGain(soundLevel: number) {
  return soundLevel / 100;
}

function getSoundLevel() {
  const storedGainValue = window.localStorage.getItem('gainLevel');

  if (!storedGainValue) {
    return audioInstance.getAudioGain();
  }

  const parsedGainValue = Number.parseFloat(storedGainValue);
  audioInstance.setAudioGain(parsedGainValue);
  return parsedGainValue;
}

function setInitialSoundLevelState() {
  if (soundLevelRange) {
    const soundLevel = convertAudioGainToSoundLevel(getSoundLevel()).toString();
    soundLevelRange.value = soundLevel;

    if (soundLevelValue) {
      soundLevelValue.innerText = soundLevel;
    }

    soundLevelRange.addEventListener('change', () => {
      const soundLevel = Number.parseInt(soundLevelRange.value, 10);

      if (soundLevelValue) {
        soundLevelValue.innerText = soundLevelRange.value;
      }

      const gain = convertSoundLevelToGain(soundLevel);
      audioInstance.setAudioGain(gain);
      window.localStorage.setItem('gainLevel', gain.toString());
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (input) {
    input.addEventListener('change', async (event) => {
      try {
        const romData = await readFile(event as GenericEvent<HTMLInputElement>);
        stop();
        cpu.loadRom(romData);
        start();
      } catch(error) {
        console.error(error);
      }
    });
  }

  if (resetRomBtn) {
    resetRomBtn.addEventListener('click', () => {
      try {
        stop();
        cpu.resetRom();
        start();
      } catch(error) {
        console.error(error);
      }
    });
  }

  closeConfigurationSideBarBtn?.addEventListener('click', closeSideMenu);
  openConfigurationSideBarBtn?.addEventListener('click', openSideMenu);

  setInitialConfigurationsStates();
  setInitialCyclesPerFrameSelectState();
  setInitialSoundState();
  setInitialSoundLevelState();
});
