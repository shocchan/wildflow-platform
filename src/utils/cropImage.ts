export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: CropArea,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      // 出力サイズを固定（512x512）
      const OUTPUT_SIZE = 512;
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
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
        OUTPUT_SIZE,
        OUTPUT_SIZE,
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
