export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: CropArea,
  outputSize?: { width: number; height: number },
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const outW = outputSize?.width ?? 512;
      const outH = outputSize?.height ?? 512;
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context error');

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outW,
        outH,
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject('Blob generation error');
        },
        'image/jpeg',
        0.92,
      );
    };
    image.onerror = reject;
  });
};
