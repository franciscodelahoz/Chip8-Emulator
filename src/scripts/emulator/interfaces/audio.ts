/**
 * Audio Interface Implementation for CHIP-8 and XO-CHIP
 * --------------------------------------------------
 *
 * This implementation handles two different audio systems:
 *
 * 1. Standard CHIP-8:
 *    - Simple beeping sound using Web Audio API's OscillatorNode
 *    - Uses a triangle wave at a fixed frequency
 *    - Diagram:
 *
 *    [Sound Timer > 0] -----> [OscillatorNode] -----> [GainNode] -----> [AudioDestination]
 *           |               (triangle wave 600Hz)     (volume 0-1)        (speakers)
 *           |                      ^
 *           |                      |
 *    [Timer = 0] -------------> [Stop/Start]
 *
 * 2. XO-CHIP (Based on Octo emulator implementation):
 *    - Advanced audio pattern playback using AudioWorklet
 *    - Based on implementation from the Octo emulator by John Earnest
 *    - Diagram:
 *
 *    [16-byte Pattern Buffer] --> [AudioWorklet] --> [GainNode] --> [AudioDestination]
 *            |                    (pattern proc.)    (volume 0-1)      (speakers)
 *            |                         |
 *            |                         v
 *    [Sound Timer > 0] ---------> [Start/Stop]
 */

import {
  defaultAudioGain,
  maximumAudioGain,
  audioFrameRate,
  audioPatternBits,
  pitchScaleFactor,
  supersamplingRate,
  cutOffFrequency,
  frequency,
  pitchBias,
  oscillatorFrequency,
} from '../../constants/audio.constants';

export class AudioInterface {
  private readonly audioContext: AudioContext;

  private readonly gain: GainNode;

  private readonly finish: AudioDestinationNode;

  private oscillator: OscillatorNode | null = null;

  // Audio API properties
  private audioWorkletNode: AudioWorkletNode | null = null;

  private audioProcessorReady: boolean = false;

  private audioPatternPosition: number = 0;

  private currentAudioPattern: Uint8Array = new Uint8Array(16);

  private currentPitch: number = 64;

  private isPlayingPattern: boolean = false;

  private readonly lowPassBuffer: number[] = new Array(5).fill(0); // 4 filter steps + 1

  constructor() {
    this.audioContext = new AudioContext();
    this.gain = new GainNode(this.audioContext, {
      gain: defaultAudioGain,
    });

    this.finish = this.audioContext.destination;

    this.gain.connect(this.finish);
    this.setupAudioWorklet();
  }

  private async setupAudioWorklet(): Promise<void> {
    try {
      // Load audio processor code as a string
      const processorUrl = URL.createObjectURL(new Blob([
        `/**
         * AudioWorkletProcessor for Chip8 Emulator
         * This class processes audio data for XO-CHIP
         */
        class Chip8AudioProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.buffers = [];
            this.port.onmessage = this.handleMessage.bind(this);
          }

          handleMessage(event) {
            if (event.data.type === 'buffer') {
              // Add a new buffer to the queue
              this.buffers.push({
                buffer: event.data.buffer,
                position: 0,
                duration: event.data.duration
              });

            } else if (event.data.type === 'clear') {
              // Clear all buffers
              this.buffers = [];
            }
          }

          process(inputs, outputs, parameters) {
            const output = outputs[0];
            const channel = output[0];

            if (channel.length === 0) {
              return true;
            }

            let index = 0;

            // Process audio data in the queue
            while (this.buffers.length && index < channel.length) {
              const bufferInfo = this.buffers[0];
              const size = Math.min(channel.length - index, bufferInfo.buffer.length - bufferInfo.position);

              if (size <= 0) {
                this.buffers.shift();
                continue;
              }

              // Copy data to output channel
              for (let i = 0; i < size; i++) {
                channel[index + i] = bufferInfo.buffer[bufferInfo.position + i];
              }

              bufferInfo.position += size;
              index += size;

              // If we're done with the current buffer, remove it
              if (bufferInfo.position >= bufferInfo.buffer.length) {
                this.buffers.shift();
              }
            }

            // Fill the rest with silence
            while (index < channel.length) {
              channel[index++] = 0;
            }

            // Keep processor running
            return true;
          }
        }

        registerProcessor('chip8-audio-processor', Chip8AudioProcessor);`,
      ], { type: 'application/javascript' }));

      await this.audioContext.audioWorklet.addModule(processorUrl);
      URL.revokeObjectURL(processorUrl);

      // Create AudioWorkletNode
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'chip8-audio-processor');
      this.audioWorkletNode.connect(this.gain);

      this.audioProcessorReady = true;
    } catch (error) {
      console.error('Error setting up AudioWorklet:', error);
    }
  }

  // Standard CHIP-8 Audio methods
  play(): void {
    if (this.audioContext && !this.oscillator) {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      this.oscillator = new OscillatorNode(this.audioContext, {
        type      : 'triangle',
        frequency : oscillatorFrequency,
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

    // Clear any pending buffers
    if (this.audioWorkletNode && this.audioProcessorReady) {
      this.audioWorkletNode.port.postMessage({ type: 'clear' });
    }
  }

  getAudioGain(): number {
    return this.gain.gain.value;
  }

  setAudioGain(gain: number): void {
    this.gain.gain.value = Math.min(gain, maximumAudioGain);
  }

  // XO-CHIP Audio methods
  setAudioPattern(patternBuffer: Uint8Array): void {
    // Copy the 16 bytes of pattern buffer
    this.currentAudioPattern = new Uint8Array(patternBuffer);
    this.isPlayingPattern = true;
  }

  setAudioPitch(pitch: number): void {
    this.currentPitch = pitch;
  }

  // Called from the emulator's cycle method
  updateAudio(soundTimer: number): void {
    if (!this.audioContext) return;

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // If sound timer is active, play sound
    if (soundTimer > 0) {
      if (this.isPlayingPattern) {
        // Play XO-CHIP pattern
        this.playXOChipPattern();
      } else {
        // Standard CHIP-8 beep
        this.play();
      }
    } else {
      // Stop audio when timer reaches zero
      this.stop();
      this.isPlayingPattern = false;
    }
  }

  private getLowPassAlpha(samplingFrequency: number): number {
    const cosineCoefficient = Math.cos((2 * Math.PI * cutOffFrequency) / samplingFrequency);

    return cosineCoefficient - 1 + Math.sqrt(cosineCoefficient * cosineCoefficient - 4 * cosineCoefficient + 3);
  }

  private getLowPassFilteredValue(alpha: number, targetValue: number): number {
    this.lowPassBuffer[0] = targetValue;

    for (let i = 1; i < this.lowPassBuffer.length; i += 1) {
      this.lowPassBuffer[i] += (this.lowPassBuffer[i - 1] - this.lowPassBuffer[i]) * alpha;
    }

    return this.lowPassBuffer[this.lowPassBuffer.length - 1];
  }

  private playXOChipPattern(): void {
    if (!this.audioContext || !this.audioProcessorReady) return;

    // Calculate audio parameters
    const soundLength = 1 / audioFrameRate;

    const freq = frequency * 2 ** ((this.currentPitch - pitchBias) / pitchScaleFactor);

    const samples = Math.ceil(this.audioContext.sampleRate * soundLength);

    const bufferLength = this.currentAudioPattern.length * audioPatternBits;

    const audioBuffer = new Float32Array(samples);

    const step = freq / this.audioContext.sampleRate;

    let pos = this.audioPatternPosition;

    // Super-sampling for better audio quality
    const quality = Math.ceil(supersamplingRate / this.audioContext.sampleRate);
    const lowPassAlpha = this.getLowPassAlpha(this.audioContext.sampleRate * quality);

    let value = 0;

    // Generate audio samples
    for (let i = 0; i < samples; i += 1) {
      for (let j = 0; j < quality; j += 1) {
        const cell = Math.floor(pos / audioPatternBits);
        const shift = pos & (audioPatternBits - 1) ^ (audioPatternBits - 1); // Bit position in the byte

        value = this.getLowPassFilteredValue(
          lowPassAlpha,
          (this.currentAudioPattern[cell] >> shift) & 1,
        );

        pos = (pos + step / quality) % bufferLength;
      }

      audioBuffer[i] = value;
    }

    // Send buffer to AudioWorkletNode
    if (this.audioWorkletNode) {
      this.audioWorkletNode.port.postMessage({
        type     : 'buffer',
        buffer   : audioBuffer,
        duration : samples,
      });
    }

    // Update position for next frame
    this.audioPatternPosition = pos;
  }
}
