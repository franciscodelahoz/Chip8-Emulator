import type { CanvasRecorderOptions } from '../types/canvas-recorder.types';

export class CanvasRecorder {
  private readonly canvas: HTMLCanvasElement;

  private stream: MediaStream | null = null;

  private recorder: MediaRecorder | null = null;

  private chunks: Blob[] = [];

  private isRecording: boolean = false;

  private readonly options: Required<CanvasRecorderOptions>;

  constructor(canvas: HTMLCanvasElement, options?: CanvasRecorderOptions) {
    this.canvas = canvas;

    this.options = {
      videoBitsPerSecond : options?.videoBitsPerSecond || 2500000,
      mimeType           : options?.mimeType || 'video/webm',
      fps                : options?.fps || 60,
    };

    if (!this.canvas) {
      throw new Error('Canvas element is required');
    }
  }

  private getSupportedMimeType(): string {
    const preferredMimeTypes = [
      this.options.mimeType,
      'video/webm',
      'video/webm;codecs=vp9',
      'video/vp8',
      'video/webm;codecs=vp8',
      'video/webm;codecs=daala',
      'video/webm;codecs=h264',
      'video/mpeg',
      'video/mp4',
    ];

    for (const mimeType of preferredMimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    throw new Error('No supported MIME type found for recording');
  }

  public start(): void {
    if (this.isRecording) return;

    try {
      this.stream = this.canvas.captureStream(this.options.fps);

      this.recorder = new MediaRecorder(this.stream, {
        mimeType           : this.getSupportedMimeType(),
        videoBitsPerSecond : this.options.videoBitsPerSecond,
      });

      this.chunks = [];
      this.isRecording = true;

      this.recorder.ondataavailable = ({ data }): void => {
        if (data.size > 0) this.chunks.push(data);
      };

      this.recorder.start(50);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  public async stop(): Promise<Blob | null> {
    return new Promise<Blob | null>((resolve) => {
      if (!this.recorder) {
        resolve(null);

        return;
      }

      this.recorder.onstop = (): void => {
        this.isRecording = false;

        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        const hasChunks = this.chunks.length > 0;
        const blob = hasChunks ?
          new Blob(this.chunks, { type: this.getSupportedMimeType() }) :
          null;

        resolve(blob);
      };

      this.recorder.requestData();
      this.recorder.stop();
    });
  }

  public saveBlob(blob: Blob, fileName?: string): void {
    const name = fileName || `chip8_recording_${Date.now()}.webm`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.style.display = 'none';
    a.href = url;
    a.download = name;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  public cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.recorder = null;
    this.chunks = [];
    this.isRecording = false;
  }

  public async stopAndSave(fileName?: string): Promise<void> {
    const blob = await this.stop();

    if (blob) this.saveBlob(blob, fileName);

    this.cleanup();
  }
}
