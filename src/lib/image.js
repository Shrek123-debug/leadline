/**
 * Resizes/compresses an uploaded image file client-side before sending it
 * to the server. A full-resolution phone photo can be 5-10MB, which risks
 * hitting Netlify Functions' request size limit and costs more to process
 * for no benefit — a document photo doesn't need to be huge to be legible.
 *
 * Returns { base64, mediaType } where base64 has no "data:...;base64," prefix.
 */
export function resizeImageFile(file, maxDim = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Couldn't read the file"));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Couldn't read that as an image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mediaType: "image/jpeg" });
      };
      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}
