import '../styles/style.css';
import { Chip8Quirks, defaultQuirkConfigurations, schipQuirkConfigurations, xoChipQuirkConfigurations } from './constants/chip8.constants';

import { CPU } from './emulator/cpu';
import { AudioInterface } from './interfaces/audio';
import { DisplayInterface } from './interfaces/display';
import { KeyBoardInterface } from './interfaces/keyboard';

const canvas: HTMLCanvasElement | null = document.getElementById('canvas') as HTMLCanvasElement | null;
const input: HTMLInputElement | null = document.getElementById('file') as HTMLInputElement | null;
const resetRomBtn: HTMLElement | null = document.getElementById('reset-rom-btn') as HTMLElement | null;

const configurationSideBar: HTMLElement | null = document.getElementById('configuration-sidebar');
const closeConfigurationSideBarBtn: HTMLElement | null = document.getElementById('close-configurations-button');
const openConfigurationSideBarBtn: HTMLElement | null = document.getElementById('open-configurations-button');

const quirkConfigCheckboxes = document.getElementsByClassName('quirk-checkbox') as HTMLCollectionOf<HTMLInputElement>;

const chip8ProfileBtn: HTMLElement | null = document.getElementById('chip8-profile');
const schipProfileBtn: HTMLElement | null = document.getElementById('schip-profile');
const xoChipProfileBtn: HTMLElement | null = document.getElementById('xo-chip-profile');

const displayInstance = new DisplayInterface(canvas);
const keyboardInstance = new KeyBoardInterface();
const audioInstance = new AudioInterface();

const cpu = new CPU(displayInstance, audioInstance, keyboardInstance);

let loop = 0;
let lastTime = 0;

const fps = 60;
let fpsInterval = 1000 / fps;

function step(currentTime: number) {
  const elapsed = currentTime - lastTime;

  if (elapsed < fpsInterval) {
    loop = window.requestAnimationFrame(step);
    return;
  }

  lastTime = currentTime;

  cpu.cycle();
  loop = window.requestAnimationFrame(step);
}

function start() {
  lastTime = performance.now();
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

  cpu.setQuirkValue(quirkName, parsedStoredValue)
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
      setQuirkValue(quirkName, quirkValues[quirkName])
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
});
