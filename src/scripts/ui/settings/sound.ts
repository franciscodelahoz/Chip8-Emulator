import type { Chip8Emulator } from '../../emulator/emulator';
import { GeneralEmulatorSettings } from '../../constants/settings.constants';
import { settingsStorage } from '../../storage/settings.storage';
import {
  AudioModeState, defaultAudioGain, defaultAudioModeState, maximumAudioGain,
} from '../../constants/audio.constants';

const audioModeStateSelect = document.getElementById('audio-mode-select') as HTMLSelectElement | null;

const soundLevelRange = document.getElementById('sound-level-range') as HTMLInputElement | null;
const soundLevelValue = document.getElementById('sound-level-value');

function applyAudioModeSettings(emulatorInstance: Chip8Emulator, mode: AudioModeState): void {
  switch (mode) {
    case AudioModeState.ALL: {
      emulatorInstance.setSoundState(true);
      emulatorInstance.setXOChipSoundState(true);
      break;
    }

    case AudioModeState.CHIP8_ONLY: {
      emulatorInstance.setSoundState(true);
      emulatorInstance.setXOChipSoundState(false);
      break;
    }

    case AudioModeState.NONE: {
      emulatorInstance.setSoundState(false);
      emulatorInstance.setXOChipSoundState(false);
      break;
    }

    default: {
      console.warn('Unknown audio mode');
    }
  }
}

async function setInitialAudioModeState(emulatorInstance: Chip8Emulator): Promise<void> {
  const storedSoundState = await settingsStorage.getSetting<AudioModeState>(GeneralEmulatorSettings.AUDIO_MODE_STATE);
  const soundState = storedSoundState ?? defaultAudioModeState;

  if (audioModeStateSelect) {
    audioModeStateSelect.value = soundState;
  }

  applyAudioModeSettings(emulatorInstance, soundState);
}

function setInitialAudioModeSelectState(emulatorInstance: Chip8Emulator): void {
  if (!audioModeStateSelect) return;

  audioModeStateSelect.addEventListener('change', async () => {
    const audioMode = audioModeStateSelect.value as AudioModeState;

    applyAudioModeSettings(emulatorInstance, audioMode);
    await settingsStorage.setSetting(GeneralEmulatorSettings.AUDIO_MODE_STATE, audioMode);
  });
}

function convertAudioGainToSoundLevel(gain: number): number {
  return Math.round(gain * 100);
}

function convertSoundLevelToGain(soundLevel: number): number {
  return soundLevel / 100;
}

function setSoundGainPercentageValue(value: number, element: HTMLElement | null): void {
  if (!element) return;

  const percentage = Math.ceil((value / maximumAudioGain) * 100);

  element.innerText = `${percentage}%`;
}

function setRangeBackgroundColorProgress(value: number): void {
  if (!soundLevelRange) return;

  const soundLevel = value * 10;

  soundLevelRange.style.background = `linear-gradient(to right, #34ff66 ${soundLevel}%, #ccc ${soundLevel}%)`;
}

async function setCurrentSoundLevel(emulatorInstance: Chip8Emulator): Promise<void> {
  const storedGainLevel = await settingsStorage.getSetting<number>(GeneralEmulatorSettings.GAIN_LEVEL);
  const gainLevel = storedGainLevel ?? defaultAudioGain;

  emulatorInstance.setAudioGain(gainLevel);

  const soundLevel = convertAudioGainToSoundLevel(gainLevel);

  if (soundLevelRange) {
    soundLevelRange.value = soundLevel.toString();
  }

  setRangeBackgroundColorProgress(soundLevel);
  setSoundGainPercentageValue(gainLevel, soundLevelValue);
}

function setInitialSoundLevelRangeState(emulatorInstance: Chip8Emulator): void {
  if (!soundLevelRange) return;

  soundLevelRange.addEventListener('input', async () => {
    const soundLevel = Number.parseInt(soundLevelRange.value, 10);
    const gain = convertSoundLevelToGain(soundLevel);

    setSoundGainPercentageValue(gain, soundLevelValue);
    setRangeBackgroundColorProgress(soundLevel);

    emulatorInstance.setAudioGain(gain);
    await settingsStorage.setSetting(GeneralEmulatorSettings.GAIN_LEVEL, gain);
  });
}

export async function initializeSoundSettingsModule(emulatorInstance: Chip8Emulator): Promise<void> {
  await setInitialAudioModeState(emulatorInstance);
  await setCurrentSoundLevel(emulatorInstance);

  setInitialAudioModeSelectState(emulatorInstance);
  setInitialSoundLevelRangeState(emulatorInstance);
}
