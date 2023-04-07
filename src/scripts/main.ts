import { CPU } from './emulator/cpu';
import { AudioInterface } from './interfaces/audio';
import { DisplayInterface } from './interfaces/display';
import { KeyBoardInterface } from './interfaces/keyboard';

const canvas: HTMLCanvasElement | null = document.getElementById('canvas') as HTMLCanvasElement | null;
const input: HTMLInputElement | null = document.getElementById('file') as HTMLInputElement | null;

const displayInstance = new DisplayInterface(canvas);
const audioInstance = new KeyBoardInterface();
const keyboardInstance = new AudioInterface();

const cpu = new CPU(displayInstance, keyboardInstance, audioInstance);

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
  if (input) {
    input.addEventListener('change', async (event) => {
      const romData = await readFile(event as GenericEvent<HTMLInputElement>);
      stop();
      cpu.loadRom(romData);
      start();
    });
  }
});
