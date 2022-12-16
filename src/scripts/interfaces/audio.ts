export class AudioInterface {
  private audioContext: AudioContext = new AudioContext();

  private gain: GainNode;

  private finish: AudioDestinationNode;

  private oscillator: OscillatorNode | null = null;

  constructor() {
    this.gain = this.gain = new GainNode(this.audioContext, {
      gain: 0.3,
    });

    this.finish = this.audioContext.destination;
    this.gain.connect(this.finish);
  }

  play(frequency: number = 440) {
    if (this.audioContext && !this.oscillator) {
      this.oscillator = new OscillatorNode(this.audioContext, {
        type: 'square',
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
}
