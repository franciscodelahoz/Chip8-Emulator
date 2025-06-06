export const defaultAudioGain = 0.06;

export const maximumAudioGain = 0.1;

export const oscillatorFrequency = 600;

export enum AudioModeState {
  ALL = 'all',
  CHIP8_ONLY = 'chip8-only',
  NONE = 'none',
}

export const defaultAudioModeState = AudioModeState.ALL;

// XO-CHIP audio constants
export const audioFrameRate = 60;

export const audioPatternBits = 8;

export const pitchScaleFactor = 48;

export const supersamplingRate = 384000;

export const frequency = 4000;

export const pitchBias = 64;

export const defaultAudioPitch = 64;

export const cutOffFrequency = 18000;
