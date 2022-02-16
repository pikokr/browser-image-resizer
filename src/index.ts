import * as ExifReader from 'exifreader';
import { initializeOrGetImg } from './browser_operations';
import { scaleImage } from './scaling_operations';
import { dataURItoBuffer } from './data_operations';

export type BrowserImageResizerConfig = {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  maxSize?: number;     // ???
  scaleRatio?: number;  // ???
  autoRotate: boolean;
  debug: boolean;
  mimeType: string;
  onScale?: (imageData: string) => void; // imageData: dataURL
};

const DEFAULT_CONFIG: BrowserImageResizerConfig = {
  quality: 0.5,
  maxWidth: 800,
  maxHeight: 600,
  autoRotate: true,
  debug: false,
  mimeType: 'image/jpeg',
};

export function readAndCompressImage(file: Blob, userConfig: BrowserImageResizerConfig) {
  return new Promise<Blob>((resolve, reject) => {
    const img = initializeOrGetImg();
    const reader = new FileReader();
    const config: BrowserImageResizerConfig = Object.assign({}, DEFAULT_CONFIG, userConfig);

    reader.onload = function(e) {
      if (!e.target || !e.target.result) return reject("cannot load image.");
      img.onerror = function() {
        reject("cannot load image.");
      };
      img.onload = function() {
        const scaleImageOptions: Parameters<typeof scaleImage>[0] = { img, config, orientation: 1 };
        if (config.autoRotate) {
          if (config.debug)
            console.log(
              'browser-image-resizer: detecting image orientation...'
            );
          let buffer = dataURItoBuffer(img.src);
          let Orientation: ExifReader.NumberTag | null;
          try {
            const Result = ExifReader.load(buffer);
            Orientation = Result.Orientation || null;
            if (config.debug) {
              console.log(
                'browser-image-resizer: image orientation from EXIF tag',
                Orientation
              );
            }
            if (Orientation) scaleImageOptions.orientation = Orientation.value;
          } catch (err) {
            console.error('browser-image-resizer: Error getting orientation');
            console.error(err);
          }
        } else if (config.debug) {
            console.log(
              'browser-image-resizer: ignoring EXIF orientation tag because autoRotate is false...'
            );
        }
        try {
          let blob = scaleImage(scaleImageOptions);
          resolve(blob);
        } catch (err) {
          reject(err);
        }
      };
      img.src = typeof e.target.result === 'string' ? e.target.result : URL.createObjectURL(new Blob([e.target.result], { type: file.type }));
    };

    try {
      reader.onerror = function() {
        reject("cannot read image file.");
      }
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err)
    }
  });
}
