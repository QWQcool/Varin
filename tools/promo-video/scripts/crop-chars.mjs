#!/usr/bin/env node
/**
 * Crops the front view out of each Q-style character sheet (three-view, 1536x864, transparent)
 * and writes it with its own tight bounds to public/chars/<id>.png.
 *
 * Source sheets live outside the repository; set AI_CHARS_DIR if they move.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.env.AI_CHARS_DIR || "D:/AIVideo/AI娘";
const OUT = path.join(project, "public/chars");

/** Front view occupies [0, split) on each sheet; split is the measured valley between figures. */
const SHEETS = {
  claude: { file: "Claude/Claude娘-Q版-三视图-透明.png", split: 557 },
  deepseek: { file: "DeepSeek/DeepSeek娘-Q版-大碗-透明.png", split: 508 },
  gpt: { file: "GPT/GPT娘-Q版-三视图-透明.png", split: 541 },
  gemini: { file: "Gemini/Gemini娘-Q版-三视图-透明.png", split: 590 },
  kimi: { file: "Kimi/Kimi娘-Q版-三视图-透明.png", split: 554 },
  qwen: { file: "Qwen/Qwen娘-Q版-三视图-透明.png", split: 550 },
  grok: { file: "Grok/Grok娘-Q版-三视图-透明.png", split: 546 },
};

function decode(file) {
  const b = fs.readFileSync(file);
  let o = 8;
  let w = 0;
  let h = 0;
  const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o);
    const type = b.toString("ascii", o + 4, o + 8);
    const data = b.subarray(o + 8, o + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6) throw new Error(`${file}: expected 8-bit RGBA`);
    }
    if (type === "IDAT") idat.push(data);
    o += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * 4;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? px[y * stride + x - 4] : 0;
      const up = y ? px[(y - 1) * stride + x] : 0;
      const c = y && x >= 4 ? px[(y - 1) * stride + x - 4] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) {
        const p = a + up - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
      }
      px[y * stride + x] = v & 255;
    }
  }
  return { w, h, px };
}

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (const byte of buf) c = CRC[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function encode(w, h, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(OUT, { recursive: true });
const missing = [];
for (const [id, { file, split }] of Object.entries(SHEETS)) {
  const source = path.join(SRC, file);
  if (!fs.existsSync(source)) {
    missing.push(file);
    continue;
  }
  const { w, h, px } = decode(source);
  let x0 = split;
  let y0 = h;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < split; x++) {
      if (px[(y * w + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const pad = 6;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(split - 1, x1 + pad);
  y1 = Math.min(h - 1, y1 + pad);
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((y + y0) * w + (x + x0)) * 4;
      const di = (y * cw + x) * 4;
      // Feather the cut edge so a neighbouring view never leaves a hard seam.
      const fromCut = split - 1 - (x + x0);
      const feather = fromCut < 10 ? fromCut / 10 : 1;
      out[di] = px[si];
      out[di + 1] = px[si + 1];
      out[di + 2] = px[si + 2];
      out[di + 3] = Math.round(px[si + 3] * feather);
    }
  }
  fs.writeFileSync(path.join(OUT, `${id}.png`), encode(cw, ch, out));
  console.log(`${id}: ${cw}x${ch}`);
}
if (missing.length) {
  console.error(`Missing character sheets under ${SRC}:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
