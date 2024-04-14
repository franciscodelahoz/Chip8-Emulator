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
  if (soundStateCheckbox) {
    soundStateCheckbox.checked = getSoundState(emulatorInstance);

    soundStateCheckbox.addEventListener('change', () => {
      const soundState = soundStateCheckbox.checked;
      emulatorInstance.setSoundState(soundState);
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
  if (element) {
    const percentage = Math.ceil((value / maximumAudioGain) * 100);
    element.innerText = `${percentage}%`;
  }
}

function setInitialSoundLevelState(emulatorInstance: Chip8Emulator) {
  if (soundLevelRange) {
    const storedSoundLevel = getSoundLevel(emulatorInstance);
    const soundLevel = convertAudioGainToSoundLevel(storedSoundLevel).toString();

    soundLevelRange.value = soundLevel;
    setSoundGainPercentageValue(storedSoundLevel, soundLevelValue);

    soundLevelRange.addEventListener('change', () => {
      const soundLevel = Number.parseInt(soundLevelRange.value, 10);

      const gain = convertSoundLevelToGain(soundLevel);
      setSoundGainPercentageValue(gain, soundLevelValue);

      emulatorInstance.setAudioGain(gain);
      window.localStorage.setItem('gainLevel', gain.toString());
    });
  }
}

export function initializeSoundSettingsModule(emulatorInstance: Chip8Emulator) {
  setInitialSoundState(emulatorInstance);
  setInitialSoundLevelState(emulatorInstance);
}
