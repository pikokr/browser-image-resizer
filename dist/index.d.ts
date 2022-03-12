export declare type BrowserImageResizerConfig = {
    quality: number;
    maxWidth: number;
    maxHeight: number;
    maxSize?: number;
    scaleRatio?: number;
    debug: boolean;
    mimeType: string;
    onScale?: (imageData: string) => void;
};
export declare function readAndCompressImage(file: Blob, userConfig: Partial<BrowserImageResizerConfig>): Promise<Blob>;
