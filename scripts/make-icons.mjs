// Generates the PNG icons (needed by iPhone and Android) without extra packages.
// Run: node scripts/make-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** scale: sun size relative to the icon (smaller for maskable icons). */
function makePng(size, { rounded, scale }) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const c = size / 2;
  const R = size * 0.18 * scale; // sun disc
  const rayIn = size * 0.27 * scale;
  const rayOut = size * 0.38 * scale;
  const rayW = size * 0.028 * scale;
  const corner = size * 0.215;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const i = y * (size * 4 + 1) + 1 + x * 4;
      let rgba = [15, 23, 42, 255]; // #0f172a
      if (rounded) {
        const dx = Math.max(corner - x, 0, x - (size - 1 - corner));
        const dy = Math.max(corner - y, 0, y - (size - 1 - corner));
        if (dx * dx + dy * dy > corner * corner) rgba = [0, 0, 0, 0];
      }
      const px = x - c;
      const py = y - c;
      const d = Math.hypot(px, py);
      if (rgba[3] !== 0) {
        if (d <= R) rgba = [245, 158, 11, 255];
        else if (d >= rayIn && d <= rayOut) {
          // 8 rays, every 45 degrees
          const a = Math.atan2(py, px);
          const step = Math.PI / 4;
          const off = Math.abs(((a % step) + step) % step);
          const dist = Math.min(off, step - off) * d;
          if (dist <= rayW) rgba = [251, 191, 36, 255];
        }
      }
      raw.set(rgba, i);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", makePng(192, { rounded: true, scale: 1 }));
writeFileSync("public/icons/icon-512.png", makePng(512, { rounded: true, scale: 1 }));
// maskable: full-bleed background, sun inside the safe zone
writeFileSync("public/icons/icon-maskable-512.png", makePng(512, { rounded: false, scale: 0.8 }));
// iPhone ignores transparency, so no rounded corners
writeFileSync("public/icons/apple-touch-icon.png", makePng(180, { rounded: false, scale: 1 }));
console.log("icons written");
