import QRCode from "qrcode";

/** Returns a data URL PNG of a QR code encoding the given URL. */
export async function makeQrDataUrl(url) {
  return QRCode.toDataURL(url, { width: 260, margin: 2, color: { dark: "#17241F", light: "#EDF0EE" } });
}
