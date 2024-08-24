import {
  defaultAudioFrequency,
  defaultAudioGain,
  maximumAudioGain
} from '../../constants/audio.constants';

export class AudioInterface {
  private audioContext: AudioContext;

  private gain: GainNode;

  private finish: AudioDestinationNode;

  private oscillator: OscillatorNode | null = null;

  private beepPattern: Uint8Array;

  private playingPattern: boolean = false;

  constructor() {
    this.audioContext = new AudioContext();

    this.gain = new GainNode(this.audioContext, {
      gain: defaultAudioGain,
    });

    this.finish = this.audioContext.destination;
    this.gain.connect(this.finish);

    this.beepPattern = new Uint8Array([
      0x00, 0x00,
      0xFF, 0xFF,
      0x00, 0x00,
      0xFF, 0xFF,
      0x00, 0x00,
      0xFF, 0xFF,
      0x00, 0x00,
      0xFF, 0xFF
    ]);
  }

  play(playingPattern: boolean, pattern: Uint8Array, pitch: number) {
    if (!playingPattern) {
      this.oscillator = new OscillatorNode(this.audioContext, {
        type: 'triangle',
        frequency: defaultAudioFrequency,
      });

      this.oscillator.connect(this.gain);
      this.oscillator.start();
    } else {
      const frame = this.generateAudioFrame(pattern, pitch);
      const buffer = this.audioContext.createBuffer(1, frame.length, this.audioContext.sampleRate);

      const data = buffer.getChannelData(0);
      data.set(frame);

      let source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      source.connect(this.gain);
      source.start();
    }
  }

  stop() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();

      this.oscillator = null;
    }
  }

  getAudioGain() {
    return this.gain.gain.value;
  }

  setAudioGain(gain: number) {
    this.gain.gain.value = Math.min(gain, maximumAudioGain);
  }

  private getLowPassAlpha(samplingFrequency: number) {
    const cutoffFrequency = 18000;
    const c = Math.cos(2 * Math.PI * cutoffFrequency / samplingFrequency);

	  return c - 1 + Math.sqrt(c * c - 4 * c + 3);
  }

  private getLowPassFilterValue(alpha: number, targetValue: number) {
    const lowPassFilterSteps = 4;
    const lowPassBuffer = new Array(lowPassFilterSteps + 1).fill(0);

    lowPassBuffer[0] = targetValue;

    for (let i = 1; i < lowPassBuffer.length; i += 1) {
      lowPassBuffer[i] += (lowPassBuffer[i - 1] - lowPassBuffer[i]) * alpha;
    }

    return lowPassBuffer[lowPassBuffer.length - 1];
  }

  private generateAudioFrame(pattern: Uint8Array, pitch: number, sampleRate: number = 48000) {
    // const soundLength = 1/60;
    const soundLength = 0.5;
    const pitchBias = 64;
    const frequency = 4000 * 2 ** ((pitch - pitchBias) / 48);
    const samplesAmount = Math.ceil(sampleRate * soundLength);
    const step = frequency / sampleRate;

    const binaryData: string = pattern.reduce((acc, byte) => {
      acc += byte.toString(2).padStart(8, '0');
      return acc;
    }, '');

    let pos = 0.0;

    const samples = new Uint8Array(samplesAmount);

    const quality = Math.ceil(384000 / this.audioContext.sampleRate);
    const lowPassAlpha = this.getLowPassAlpha(this.audioContext.sampleRate * quality);

    for (let i = 0; i < samplesAmount; i += 1) {
      const p = Math.floor(pos) % binaryData.length;
      samples[i] = binaryData[p] === '1' ? 0x15 : 0;

      for (let j = 0; j < quality; j += 1) {
        samples[i] = this.getLowPassFilterValue(lowPassAlpha, samples[i]);
      }

      pos += step;
    }

    // // IIR filter to smooth square into sine wave
    // for (let i = 1; i < samplesAmount; i += 1) {
    //   samples[i] = Math.floor(samples[i - 1] * 0.4 + samples[i]) % 0xFF;
    // }

    return samples;
  }

  // private generateAudioFrame(pattern: Uint8Array, pitch: number, sampleRate: number = 48000, soundLength: number = 1000/60) {
  //   const frequency = 4000 * Math.pow(2, (pitch - 64) / 48);
  //   const samplesAmount = Math.ceil(sampleRate * soundLength);
  //   const step = frequency / sampleRate;

  //   const binaryData: string = pattern.reduce((acc, byte) => {
  //     acc += byte.toString(2).padStart(8, '0');
  //     return acc;
  //   }, '');

  //   let pos = 0.0;

  //   const samples = new Uint8Array(samplesAmount);

  //   for (let i = 0; i < samplesAmount; i++) {
  //     const p = Math.floor(pos) % binaryData.length;
  //     samples[i] = binaryData[p] === '1' ? 0x15 : 0;
  //     pos += step;
  //   }

  //   // IIR filter to smooth square into sine wave
  //   for (let i = 1; i < samplesAmount; i += 1) {
  //     samples[i] = Math.floor(samples[i - 1] * 0.4 + samples[i]) % 0xFF;
  //   }

  //   return samples;
  // }
}
