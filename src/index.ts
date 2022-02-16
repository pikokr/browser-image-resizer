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
      img.onload = async function() {
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
            if (Orientation) scaleImageOptions.orientation = await dropOrientationIfNeeded(Orientation.value);
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

// Cache result of dropOrientationIfNeeded
const _browser_quirks = {};

// Some browsers will automatically draw images respecting their EXIF orientation
// while others won't, and the safest way to detect that is to examine how it
// is done on a known image.
// See https://github.com/w3c/csswg-drafts/issues/4666
// and https://github.com/blueimp/JavaScript-Load-Image/commit/1e4df707821a0afcc11ea0720ee403b8759f3881
function dropOrientationIfNeeded(orientation: number) {
  if (orientation === 1) return Promise.resolve(1);
  return new Promise<number>(resolve => {
    switch (_browser_quirks['image-orientation-automatic']) {
      case true:
        resolve(1);
        break;
      case false:
        resolve(orientation);
        break;
      default:
        // black 2x1 JPEG, with the following meta information set:
        // - EXIF Orientation: 6 (Rotated 90° CCW)
        const testImageURL =
          'data:image/jpeg;base64,/9j/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAA' +
          'AAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBA' +
          'QEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE' +
          'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAEAAgMBEQACEQEDEQH/x' +
          'ABKAAEAAAAAAAAAAAAAAAAAAAALEAEAAAAAAAAAAAAAAAAAAAAAAQEAAAAAAAAAAAAAAAA' +
          'AAAAAEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8H//2Q==';
        const img = new Image();
        img.onload = () => {
          const automatic = img.width === 1 && img.height === 2;
          _browser_quirks['image-orientation-automatic'] = automatic;
          resolve(automatic ? 1 : orientation);
        };
        img.onerror = () => {
          _browser_quirks['image-orientation-automatic'] = false;
          resolve(orientation);
        };
        img.src = testImageURL;
    }
  });
}
