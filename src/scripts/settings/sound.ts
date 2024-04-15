import { maximumAudioGain } from '../constants/audio.constants';
import { Chip8Emulator } from '../emulator/emulator';

const soundStateCheckbox = document.getElementById('sound-state-checkbox') as HTMLInputElement | null;

const soundLevelRange = document.getElementById('sound-level-range') as HTMLInputElement | null;
const soundLevelValue = document.getElementById('sound-level-value') as HTMLElement | null;

function getSoundState(emulatorInstance: Chip8Emulator) {
  const storedSoundState = window.localStorage.getItem('soundState');

  if (!storedSoundState) {
    return emulatorInstance.getSoundState();
  }

  const parsedStoredValue = storedSoundState === 'true' ? true : false;

  emulatorInstance.setSoundState(parsedStoredValue);
  return parsedStoredValue;
}

function setInitialSoundState(emulatorInstance: Chip8Emulator) {
  if (!soundStateCheckbox) return;

  soundStateCheckbox.checked = getSoundState(emulatorInstance);

  soundStateCheckbox.addEventListener('change', () => {
    const soundState = soundStateCheckbox.checked;

    emulatorInstance.setSoundState(soundState);
    window.localStorage.setItem('soundState', soundState.toString());
  });
}

function convertAudioGainToSoundLevel(gain: number) {
  return Math.round(gain * 100);
}

function convertSoundLevelToGain(soundLevel: number) {
  return soundLevel / 100;
}

function getSoundLevel(emulatorInstance: Chip8Emulator) {
  const storedGainValue = window.localStorage.getItem('gainLevel');

  if (!storedGainValue) {
    return emulatorInstance.getAudioGain();
  }

  const parsedGainValue = Number.parseFloat(storedGainValue);
  emulatorInstance.setAudioGain(parsedGainValue);
  return parsedGainValue;
}

function setSoundGainPercentageValue(value: number, element: HTMLElement | null) {
  if (!element) return;

  const percentage = Math.ceil((value / maximumAudioGain) * 100);
  element.innerText = `${percentage}%`;
}

function setRangeBackgroundColorProgress(value: number) {
  if (!soundLevelRange) return;

  const soundLevel = value * 10;
  soundLevelRange.style.background = `linear-gradient(to right, #34ff66 ${soundLevel}%, #ccc ${soundLevel}%)`;
}

function setInitialSoundLevelState(emulatorInstance: Chip8Emulator) {
  if (!soundLevelRange) return;

  const storedSoundLevel = getSoundLevel(emulatorInstance);
  const soundLevel = convertAudioGainToSoundLevel(storedSoundLevel);

  soundLevelRange.value = soundLevel.toString();

  setRangeBackgroundColorProgress(soundLevel);
  setSoundGainPercentageValue(storedSoundLevel, soundLevelValue);

  soundLevelRange.addEventListener('input', () => {
    const soundLevel = Number.parseInt(soundLevelRange.value, 10);
    const gain = convertSoundLevelToGain(soundLevel);

    setSoundGainPercentageValue(gain, soundLevelValue);
    setRangeBackgroundColorProgress(soundLevel);

    emulatorInstance.setAudioGain(gain);
    window.localStorage.setItem('gainLevel', gain.toString());
  });
}

export function initializeSoundSettingsModule(emulatorInstance: Chip8Emulator) {
  setInitialSoundState(emulatorInstance);
  setInitialSoundLevelState(emulatorInstance);
}
