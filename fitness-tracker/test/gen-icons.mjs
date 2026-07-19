// One-off icon generator: draws a dumbbell on a dark rounded square and
// writes PNGs (192, 512, 180 apple-touch). No dependencies — hand-rolled
// PNG encoder using node:zlib.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const BG = [0x14, 0x1a, 0x24], ACCENT = [0xe0, 0x7b, 0x39], LIGHT = [0xf0, 0x9a, 0x5e];

function drawIcon(S) {
  const px = Buffer.alloc(S * S * 4);
  const put = (x, y, [r, g, b]) => {
    const i = (y * S + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  };
  const corner = S * 0.18;
  const inRounded = (x, y) => {
    const cx = Math.min(Math.max(x, corner), S - corner);
    const cy = Math.min(Math.max(y, corner), S - corner);
    return (x - cx) ** 2 + (y - cy) ** 2 <= corner ** 2;
  };

  // Dumbbell geometry (diagonal for style): bar + 2 inner plates + 2 outer plates
  const c = S / 2;
  const ang = -Math.PI / 5.2;
  const cos = Math.cos(ang), sin = Math.sin(ang);
  // transform into dumbbell-local coords
  const local = (x, y) => {
    const dx = x - c, dy = y - c;
    return [dx * cos - dy * sin, dx * sin + dy * cos];
  };
  const barHalf = S * 0.30, barR = S * 0.045;
  const plateInner = { d: S * 0.235, w: S * 0.045, h: S * 0.15 };
  const plateOuter = { d: S * 0.315, w: S * 0.038, h: S * 0.105 };

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (!inRounded(x + 0.5, y + 0.5)) continue; // transparent corner
      put(x, y, BG);
      const [lx, ly] = local(x + 0.5, y + 0.5);
      const ax = Math.abs(lx), ay = Math.abs(ly);
      const inBar = ax <= barHalf && ay <= barR;
      const inPlate = (p) => Math.abs(ax - p.d) <= p.w && ay <= p.h;
      if (inPlate(plateInner) || inPlate(plateOuter)) put(x, y, ACCENT);
      else if (inBar) put(x, y, LIGHT);
    }
  }
  return encodePNG(S, S, px);
}

mkdirSync(new URL('../icons/', import.meta.url), { recursive: true });
const out = (name, size) =>
  writeFileSync(new URL(`../icons/${name}`, import.meta.url), drawIcon(size));
out('icon-192.png', 192);
out('icon-512.png', 512);
out('apple-touch-icon.png', 180);
console.log('icons written');
