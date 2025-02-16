import { defaultAudioGain, defaultSoundState, maximumAudioGain } from '../../constants/audio.constants';
import { GeneralEmulatorSettings } from '../../constants/settings.constants';
import SettingsManager from '../../database/managers/settings.manager';
import type { Chip8Emulator } from '../../emulator/emulator';

const soundStateCheckbox = document.getElementById('sound-state-checkbox') as HTMLInputElement | null;

const soundLevelRange = document.getElementById('sound-level-range') as HTMLInputElement | null;
const soundLevelValue = document.getElementById('sound-level-value');

async function setCurrentSoundState(emulatorInstance: Chip8Emulator): Promise<void> {
  const storedSoundState = await SettingsManager.getSetting<boolean>(GeneralEmulatorSettings.SOUND_STATE);
  const soundState = storedSoundState ?? defaultSoundState;

  if (soundStateCheckbox) {
    soundStateCheckbox.checked = soundState;
  }

  emulatorInstance.setSoundState(soundState);
}

function setInitialSoundStateCheckboxState(emulatorInstance: Chip8Emulator): void {
  if (!soundStateCheckbox) return;

  soundStateCheckbox.addEventListener('change', async () => {
    const soundState = soundStateCheckbox.checked;

    emulatorInstance.setSoundState(soundState);
    await SettingsManager.setSetting(GeneralEmulatorSettings.SOUND_STATE, soundState);
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
  const storedGainLevel = await SettingsManager.getSetting<number>(GeneralEmulatorSettings.GAIN_LEVEL);
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
    await SettingsManager.setSetting(GeneralEmulatorSettings.GAIN_LEVEL, gain);
  });
}

export async function initializeSoundSettingsModule(emulatorInstance: Chip8Emulator): Promise<void> {
  await setCurrentSoundState(emulatorInstance);
  await setCurrentSoundLevel(emulatorInstance);

  setInitialSoundStateCheckboxState(emulatorInstance);
  setInitialSoundLevelRangeState(emulatorInstance);
}
