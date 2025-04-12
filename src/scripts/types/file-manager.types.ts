export type FileMimeType = `${string}/${string}`;

export interface FileData {
  data: Uint8Array;
  name: string;
}

export interface FileManagerPickerOptions {
  description: string;
  extensions: Array<`.${string}`> | `.${string}`;
  mimeType: FileMimeType;
}
