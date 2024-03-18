import {
  defaultAudioFrequency,
  defaultAudioGain,
  maximumAudioGain
} from '../constants/audio.constants';

export class AudioInterface {
  private audioContext: AudioContext;

  private gain: GainNode;

  private finish: AudioDestinationNode;

  private oscillator: OscillatorNode | null = null;

  constructor() {
    this.audioContext = new AudioContext();

    this.gain = new GainNode(this.audioContext, {
      gain: defaultAudioGain,
    });

    this.finish = this.audioContext.destination;
    this.gain.connect(this.finish);
  }

  play(frequency: number = defaultAudioFrequency) {
    if (this.audioContext && !this.oscillator) {
      this.oscillator = new OscillatorNode(this.audioContext, {
        type: 'triangle',
        frequency,
      });

      this.oscillator.connect(this.gain);
      this.oscillator.start();
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
}
