import { initializeOrGetImg } from './browser_operations';
import { scaleImage } from './scaling_operations';

export type BrowserImageResizerConfig = {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  maxSize?: number;     // ???
  scaleRatio?: number;  // ???
  debug: boolean;
  mimeType: string;
  onScale?: (imageData: string) => void; // imageData: dataURL
};

const DEFAULT_CONFIG: BrowserImageResizerConfig = {
  quality: 0.5,
  maxWidth: 800,
  maxHeight: 600,
  debug: false,
  mimeType: 'image/jpeg',
};

export function readAndCompressImage(file: Blob, userConfig: Partial<BrowserImageResizerConfig>) {
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
        const scaleImageOptions: Parameters<typeof scaleImage>[0] = { img, config };
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
