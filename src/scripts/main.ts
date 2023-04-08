import '../styles/style.css';

import { CPU } from './emulator/cpu';
import { AudioInterface } from './interfaces/audio';
import { DisplayInterface } from './interfaces/display';
import { KeyBoardInterface } from './interfaces/keyboard';

const canvas: HTMLCanvasElement | null = document.getElementById('canvas') as HTMLCanvasElement | null;
const input: HTMLInputElement | null = document.getElementById('file') as HTMLInputElement | null;

const keys = document.querySelectorAll('.key');

const displayInstance = new DisplayInterface(canvas);
const keyboardInstance = new KeyBoardInterface();
const audioInstance = new AudioInterface();

const cpu = new CPU(displayInstance, audioInstance, keyboardInstance);

const fps = 60;

let loop = 0;
let lastTime = 0;
let fpsInterval = 1000 / fps;

function step(currentTime: number) {
  if (currentTime - lastTime < fpsInterval) {
    loop = window.requestAnimationFrame(step);
    return;
  }

  lastTime = currentTime;
  cpu.cycle();
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

document.addEventListener('DOMContentLoaded', () => {
  displayInstance.setText('Click here to load a ROM...', '30px monospace', 10, 40);

  if (input) {
    input.addEventListener('change', async (event) => {
      const romData = await readFile(event as GenericEvent<HTMLInputElement>);
      stop();
      cpu.loadRom(romData);
      start();
    });
  }

  keys.forEach((key) => {
    key.addEventListener('mousedown', (e) => {
      const keyValue = Number.parseInt(key.getAttribute('aria-value') as string, 16);
      keyboardInstance.pressedKey(keyValue);
    });

    key.addEventListener('mouseup', (e) => {
      const keyValue = Number.parseInt(key.getAttribute('aria-value') as string, 16);
      keyboardInstance.releasedKey(keyValue);
    });
  });
});
