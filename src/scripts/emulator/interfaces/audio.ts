import {
  defaultAudioFrequency,
  defaultAudioGain,
  maximumAudioGain,
} from '../../constants/audio.constants';

export class AudioInterface {
  private readonly audioContext: AudioContext;

  private readonly gain: GainNode;

  private readonly finish: AudioDestinationNode;

  private oscillator: OscillatorNode | null = null;

  constructor() {
    this.audioContext = new AudioContext();

    this.gain = new GainNode(this.audioContext, {
      gain: defaultAudioGain,
    });

    this.finish = this.audioContext.destination;
    this.gain.connect(this.finish);
  }

  play(frequency: number = defaultAudioFrequency): void {
    if (this.audioContext && !this.oscillator) {
      this.oscillator = new OscillatorNode(this.audioContext, {
        type: 'triangle',
        frequency,
      });

      this.oscillator.connect(this.gain);
      this.oscillator.start();
    }
  }

  stop(): void {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();

      this.oscillator = null;
    }
  }

  getAudioGain(): number {
    return this.gain.gain.value;
  }

  setAudioGain(gain: number): void {
    this.gain.gain.value = Math.min(gain, maximumAudioGain);
  }
}
