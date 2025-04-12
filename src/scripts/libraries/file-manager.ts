import type { FileData, FileManagerPickerOptions } from '../types/file-manager.types';

export class FileManager {
  private async getFileFromHandler(fileHandle: File | FileSystemFileHandle): Promise<File> {
    if (fileHandle instanceof FileSystemFileHandle) {
      return fileHandle.getFile();
    }

    return fileHandle;
  }

  private async extractFileContent(files: FileList | FileSystemFileHandle[]): Promise<FileData | null> {
    if (!files?.length) return null;

    const fileHandle = files[0];
    const fileData = await this.getFileFromHandler(fileHandle);

    const arrayBuffer = await fileData.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    return {
      data,
      name: fileHandle.name,
    };
  }

  private async openModernFilePicker(options: FileManagerPickerOptions): Promise<FileData | null> {
    const filePickerOptions: OpenFilePickerOptions = {
      types: [ {
        description : options.description,
        accept      : {
          [options.mimeType]: options.extensions,
        },
      } ],
      multiple: false,
    };

    const fileHandle = await window.showOpenFilePicker(filePickerOptions)
      .catch((error: unknown) => {
        if ((error as Error).name === 'AbortError') {
          return null;
        }

        throw error;
      });

    if (!fileHandle) return null;

    const fileData = await this.extractFileContent(fileHandle);

    return fileData;
  }

  private async openFallbackFilePicker(options: FileManagerPickerOptions): Promise<FileData | null> {
    return new Promise((resolve) => {
      const fileInput = document.createElement('input');

      const accept = Array.isArray(options.extensions) ? options.extensions.join(',') :
        options.extensions;

      fileInput.type = 'file';
      fileInput.accept = accept;
      fileInput.style.display = 'none';

      fileInput.addEventListener('change', async (event) => {
        let fileData = null;
        const target = event.target as HTMLInputElement;

        if (target?.files?.length) {
          fileData = await this.extractFileContent(target.files);
        }

        document.body.removeChild(fileInput);
        resolve(fileData);
      });

      document.body.appendChild(fileInput);
      fileInput.click();
    });
  }

  public async openFilePicker(options: FileManagerPickerOptions): Promise<FileData | null> {
    if ('showOpenFilePicker' in window) {
      return this.openModernFilePicker(options);
    }

    return this.openFallbackFilePicker(options);
  }

  public registerFileHandler(callback: (fileData: FileData | null) => void): void {
    window.launchQueue?.setConsumer(async (launchParams) => {
      if (launchParams.files.length) {
        try {
          const files = launchParams.files as FileSystemFileHandle[];
          const fileData = await this.extractFileContent(files);

          callback(fileData);
        } catch (error) {
          console.error('Error processing file from file handler:', error);
          callback(null);
        }
      }
    });
  }
}
