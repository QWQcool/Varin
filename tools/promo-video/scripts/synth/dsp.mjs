/**
 * Minimal deterministic DSP for the promo score. No dependencies, no Math.random.
 */
import fs from "node:fs";
import path from "node:path";

export const SR = 48000;

export const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Bus {
  constructor(n) {
    this.n = n;
    this.L = new Float32Array(n);
    this.R = new Float32Array(n);
  }
  add(i, l, r) {
    if (i >= 0 && i < this.n) {
      this.L[i] += l;
      this.R[i] += r;
    }
  }
  mix(from, gain = 1) {
    for (let i = 0; i < this.n; i++) {
      this.L[i] += from.L[i] * gain;
      this.R[i] += from.R[i] * gain;
    }
    return this;
  }
  apply(gainAt) {
    for (let i = 0; i < this.n; i++) {
      const g = gainAt(i / SR);
      this.L[i] *= g;
      this.R[i] *= g;
    }
    return this;
  }
}

export class Biquad {
  constructor() {
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.b0 = 1;
    this.b1 = this.b2 = this.a1 = this.a2 = 0;
  }
  set(type, freq, q = 0.707) {
    const f = Math.min(Math.max(freq, 10), SR * 0.45);
    const w = (2 * Math.PI * f) / SR;
    const c = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (type === "lp") {
      b0 = (1 - c) / 2;
      b1 = 1 - c;
      b2 = b0;
    } else if (type === "hp") {
      b0 = (1 + c) / 2;
      b1 = -(1 + c);
      b2 = b0;
    } else {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
    }
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * c) / a0;
    this.a2 = (1 - alpha) / a0;
    return this;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

export function polyblep(t, dt) {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

export const panGains = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)];

/** Renders one voice: `render(t, out, i)` writes [left, right] into `out`. */
export function voice(bus, startSec, lenSec, render, send = null, sendAmt = 0) {
  const start = Math.round(startSec * SR);
  const len = Math.round(lenSec * SR);
  const out = [0, 0];
  for (let i = 0; i < len; i++) {
    out[0] = 0;
    out[1] = 0;
    render(i / SR, out, i);
    bus.add(start + i, out[0], out[1]);
    if (send) send.add(start + i, out[0] * sendAmt, out[1] * sendAmt);
  }
}

/** Freeverb (Jezar) at the current sample rate. */
export function freeverb(input, { room = 0.84, damp = 0.3, gain = 0.015 } = {}) {
  const scale = SR / 44100;
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const comb = (len) => ({ buf: new Float32Array(Math.round(len * scale)), i: 0, store: 0 });
  const ap = (len) => ({ buf: new Float32Array(Math.round(len * scale)), i: 0 });
  const cL = combT.map(comb);
  const cR = combT.map((t) => comb(t + 23));
  const aL = apT.map(ap);
  const aR = apT.map((t) => ap(t + 23));
  const out = new Bus(input.n);
  const runComb = (c, x) => {
    const y = c.buf[c.i];
    c.store = y * (1 - damp) + c.store * damp;
    c.buf[c.i] = x + c.store * room;
    if (++c.i >= c.buf.length) c.i = 0;
    return y;
  };
  const runAp = (a, x) => {
    const b = a.buf[a.i];
    a.buf[a.i] = x + b * 0.5;
    if (++a.i >= a.buf.length) a.i = 0;
    return b - x;
  };
  for (let n = 0; n < input.n; n++) {
    const x = (input.L[n] + input.R[n]) * gain;
    let l = 0;
    let r = 0;
    for (let k = 0; k < 8; k++) {
      l += runComb(cL[k], x);
      r += runComb(cR[k], x);
    }
    for (let k = 0; k < 4; k++) {
      l = runAp(aL[k], l);
      r = runAp(aR[k], r);
    }
    out.L[n] = l;
    out.R[n] = r;
  }
  return out;
}

/** Ping-pong delay; returns dry + echoes. */
export function pingPong(input, delaySec, feedback, wet) {
  const d = Math.round(delaySec * SR);
  const bl = new Float32Array(d);
  const br = new Float32Array(d);
  const out = new Bus(input.n);
  let i = 0;
  for (let n = 0; n < input.n; n++) {
    const yl = bl[i];
    const yr = br[i];
    bl[i] = (input.L[n] + input.R[n]) * 0.5 + yr * feedback;
    br[i] = yl * feedback;
    if (++i >= d) i = 0;
    out.L[n] = input.L[n] + yl * wet;
    out.R[n] = input.R[n] + yr * wet;
  }
  return out;
}

/** ITU-R BS.1770 integrated loudness (LUFS) at 48 kHz. */
export function loudness(bus) {
  const kw = (x) => {
    const s1 = { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] };
    const s2 = { b: [1.0, -2.0, 1.0], a: [-1.99004745483398, 0.99007225036621] };
    const out = new Float64Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, u1 = 0, u2 = 0, v1 = 0, v2 = 0;
    for (let i = 0; i < x.length; i++) {
      const y = s1.b[0] * x[i] + s1.b[1] * x1 + s1.b[2] * x2 - s1.a[0] * y1 - s1.a[1] * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
      const v = s2.b[0] * y + s2.b[1] * u1 + s2.b[2] * u2 - s2.a[0] * v1 - s2.a[1] * v2;
      u2 = u1; u1 = y; v2 = v1; v1 = v;
      out[i] = v;
    }
    return out;
  };
  const l = kw(bus.L);
  const r = kw(bus.R);
  const block = Math.round(0.4 * SR);
  const hop = Math.round(0.1 * SR);
  const powers = [];
  for (let s = 0; s + block <= bus.n; s += hop) {
    let sum = 0;
    for (let i = s; i < s + block; i++) sum += l[i] * l[i] + r[i] * r[i];
    powers.push(sum / block);
  }
  const lufs = (p) => -0.691 + 10 * Math.log10(p);
  const abs = powers.filter((p) => lufs(p) > -70);
  if (!abs.length) return -Infinity;
  const relGate = lufs(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const gated = abs.filter((p) => lufs(p) > relGate);
  return lufs(gated.reduce((a, b) => a + b, 0) / gated.length);
}

/** Look-ahead peak limiter. */
export function limit(bus, ceiling, lookaheadSec = 0.005, releaseSec = 0.08) {
  const la = Math.round(lookaheadSec * SR);
  const need = new Float32Array(bus.n);
  for (let i = 0; i < bus.n; i++) {
    const peak = Math.max(Math.abs(bus.L[i]), Math.abs(bus.R[i]));
    need[i] = peak > ceiling ? ceiling / peak : 1;
  }
  const rel = 1 - Math.exp(-1 / (releaseSec * SR));
  // Sliding minimum of need[i .. i+la) with a monotonic deque of indices.
  const deque = new Int32Array(bus.n);
  let head = 0;
  let tail = 0;
  let next = 0;
  let g = 1;
  for (let i = 0; i < bus.n; i++) {
    const end = Math.min(bus.n, i + la);
    while (next < end) {
      while (tail > head && need[deque[tail - 1]] >= need[next]) tail--;
      deque[tail++] = next++;
    }
    while (deque[head] < i) head++;
    const target = Math.min(1, need[deque[head]]);
    g = target < g ? target : g + (target - g) * rel;
    bus.L[i] *= g;
    bus.R[i] *= g;
  }
  return bus;
}

export function peakOf(bus) {
  let p = 0;
  for (let i = 0; i < bus.n; i++) p = Math.max(p, Math.abs(bus.L[i]), Math.abs(bus.R[i]));
  return p;
}

export function writeWav(file, bus) {
  const data = Buffer.alloc(bus.n * 4);
  for (let i = 0; i < bus.n; i++) {
    const l = Math.max(-1, Math.min(1, bus.L[i]));
    const r = Math.max(-1, Math.min(1, bus.R[i]));
    data.writeInt16LE(Math.round(l * 32767), i * 4);
    data.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([header, data]));
}
