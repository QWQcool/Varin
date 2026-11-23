#!/usr/bin/env node
/**
 * Original score + foley for the 15-second sample, synthesised from code.
 * Every event time is read from src/sample/timeline.ts, the same frames the picture uses.
 *
 * Writes public/audio/sample15.wav (music + SFX) and public/audio/sample15-sfx.wav (SFX only).
 * 120 BPM, A minor: Am -> F -> E (tension) -> silence -> Am (impact) -> F.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { T, FPS } from "../../src/sample/timeline.ts";
import { Biquad, Bus, SR, freeverb, limit, loudness, mtof, panGains, peakOf, pingPong, polyblep, rng, voice, writeWav } from "./dsp.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../../public/audio");
const s = (frame) => frame / FPS;
const DUR = s(T.end);
const N = Math.round(DUR * SR);
const CUT = s(T.silence);
const HIT = s(T.impact);
const TAU = 2 * Math.PI;

const musicPre = new Bus(N), musicPreSend = new Bus(N);
const sfxPre = new Bus(N), sfxPreSend = new Bus(N);
const musicPost = new Bus(N), musicPostSend = new Bus(N);
const pumped = new Bus(N);
const arpBus = new Bus(N);
const sfxPost = new Bus(N), sfxPostSend = new Bus(N);

let seed = 1;
const nextSeed = () => (seed = (seed * 9301 + 49297) % 233280) + 1;

// ---------- instruments ----------

function tick(t0, gain, pan) {
  const r = rng(nextSeed());
  const bp = new Biquad().set("bp", 4800, 2.5);
  const [pl, pr] = panGains(pan);
  voice(musicPre, t0, 0.06, (t, o) => {
    const v = (bp.run(r() * 2 - 1) * Math.exp(-t / 0.0035) * 2.2 + Math.sin(TAU * 2900 * t) * Math.exp(-t / 0.005) * 0.3) * gain;
    o[0] = v * pl;
    o[1] = v * pr;
  }, musicPreSend, 0.2);
}

function keystroke(t0, gain, space) {
  const r = rng(nextSeed());
  const bp = new Biquad().set("bp", (space ? 1300 : 2300) * (0.85 + 0.3 * r()), 1.4);
  const hp = new Biquad().set("hp", 500, 0.7);
  const thump = (space ? 115 : 165) * (0.9 + 0.2 * r());
  const [pl, pr] = panGains((r() - 0.5) * 0.35);
  const g = gain * (0.8 + 0.4 * r());
  voice(sfxPre, t0, 0.1, (t, o) => {
    const click = bp.run(hp.run(r() * 2 - 1)) * Math.exp(-t / 0.0045) * 2.6;
    const body = Math.sin(TAU * thump * t) * Math.exp(-t / 0.016) * 0.4;
    const up = t > 0.055 ? bp.run(r() * 2 - 1) * Math.exp(-(t - 0.055) / 0.003) * 0.9 : 0;
    const v = (click + body + up) * g;
    o[0] = v * pl;
    o[1] = v * pr;
  }, sfxPreSend, 0.12);
}

function hat(bus, send, t0, gain, open = false) {
  const r = rng(nextSeed());
  const h1 = new Biquad().set("hp", 7200, 0.7);
  const h2 = new Biquad().set("hp", 7200, 0.7);
  const dec = open ? 0.11 : 0.03;
  voice(bus, t0, dec * 6, (t, o) => {
    const v = h2.run(h1.run(r() * 2 - 1)) * Math.exp(-t / dec) * gain;
    o[0] = v * 0.85;
    o[1] = v;
  }, send, 0.08);
}

function kick(bus, t0, gain) {
  const r = rng(nextSeed());
  const hp = new Biquad().set("hp", 1800, 0.7);
  let ph = 0;
  voice(bus, t0, 0.45, (t, o) => {
    ph += (47 + 95 * Math.exp(-t / 0.032)) / SR;
    let v = Math.sin(TAU * ph) * Math.exp(-t / 0.24) + hp.run(r() * 2 - 1) * Math.exp(-t / 0.0018) * 0.35;
    v = (Math.tanh(v * 1.6) / Math.tanh(1.6)) * gain;
    o[0] = v;
    o[1] = v;
  });
}

/** Wooden tick when a terminal window lands. */
function land(t0, gain, pan) {
  const [pl, pr] = panGains(pan);
  voice(sfxPre, t0, 0.16, (t, o) => {
    const v = (Math.sin(TAU * 1050 * t) * Math.exp(-t / 0.02) + Math.sin(TAU * 2480 * t) * Math.exp(-t / 0.008) * 0.45 + Math.sin(TAU * 520 * t) * Math.exp(-t / 0.03) * 0.35) * gain;
    o[0] = v * pl;
    o[1] = v * pr;
  }, sfxPreSend, 0.3);
}

/** Muted low hit when a session stalls. */
function stall(t0, gain) {
  const r = rng(nextSeed());
  const lp = new Biquad().set("lp", 380, 0.7);
  let ph = 0;
  voice(sfxPre, t0, 0.6, (t, o) => {
    ph += (52 + 48 * Math.exp(-t / 0.05)) / SR;
    const v = (Math.sin(TAU * ph) * Math.exp(-t / 0.22) + lp.run(r() * 2 - 1) * Math.exp(-t / 0.03) * 0.7) * gain;
    o[0] = v;
    o[1] = v;
  }, sfxPreSend, 0.25);
}

/** Detuned saw pad through a moving low-pass. */
function pad(bus, send, sendAmt, t0, t1, notes, gain, attack, release, cutoffAt) {
  const hold = t1 - t0;
  const det = [[-7, 4], [7, -4]];
  const osc = notes.map((m) => det.map((pair) => pair.map((c) => ({ ph: ((m * 7 + c) % 13) / 13, dt: (mtof(m) * 2 ** (c / 1200)) / SR }))));
  const lpL = new Biquad();
  const lpR = new Biquad();
  voice(bus, t0, hold + release, (t, o, i) => {
    if (i % 64 === 0) {
      const fc = cutoffAt(t0 + t);
      lpL.set("lp", fc, 0.8);
      lpR.set("lp", fc, 0.8);
    }
    let l = 0;
    let r = 0;
    for (const voices of osc) {
      for (let ch = 0; ch < 2; ch++) {
        for (const v of voices[ch]) {
          v.ph += v.dt;
          if (v.ph >= 1) v.ph -= 1;
          const saw = 2 * v.ph - 1 - polyblep(v.ph, v.dt);
          if (ch === 0) l += saw;
          else r += saw;
        }
      }
    }
    const a = t < attack ? Math.sin(((t / attack) * Math.PI) / 2) ** 2 : 1;
    const env = t < hold ? a : a * Math.exp(-(t - hold) / (release / 4));
    o[0] = lpL.run(l) * env * gain;
    o[1] = lpR.run(r) * env * gain;
  }, send, sendAmt);
}

function drone(t0, t1, midi, gain) {
  const f = mtof(midi);
  voice(musicPre, t0, t1 - t0, (t, o) => {
    const env = Math.min(1, t / 1.5) * Math.min(1, (t1 - t0 - t) / 0.03);
    const v = (Math.sin(TAU * f * t) + Math.sin(TAU * f * 2 * t) * 0.25) * env * gain;
    o[0] = v;
    o[1] = v;
  });
}

function riser(t0, t1, gain) {
  const r = rng(nextSeed());
  const bp = new Biquad();
  const lp = new Biquad();
  const len = t1 - t0;
  let ph = 0;
  voice(sfxPre, t0, len, (t, o, i) => {
    const p = t / len;
    if (i % 32 === 0) {
      bp.set("bp", 300 * (6500 / 300) ** p ** 1.4, 1.6);
      lp.set("lp", 500 + 5000 * p ** 2, 0.9);
    }
    const f = mtof(45 + 36 * p ** 1.6);
    ph += f / SR;
    if (ph >= 1) ph -= 1;
    const saw = 2 * ph - 1 - polyblep(ph, f / SR);
    const tail = Math.min(1, (len - t) / 0.015);
    const v = (bp.run(r() * 2 - 1) * (0.05 + 0.6 * p ** 2.4) * 2.2 + lp.run(saw) * 0.14 * p ** 2) * gain * tail;
    o[0] = v * (1 - 0.2 * Math.sin(TAU * 0.7 * t));
    o[1] = v * (1 + 0.2 * Math.sin(TAU * 0.7 * t));
  }, sfxPreSend, 0.3);
}

function impact(t0) {
  let ph = 0;
  voice(sfxPost, t0, 3.0, (t, o) => {
    ph += (36 + 110 * Math.exp(-t / 0.11)) / SR;
    const v = Math.sin(TAU * ph) * Math.exp(-t / 0.95) * 0.95;
    o[0] = v;
    o[1] = v;
  });
  const rl = rng(nextSeed());
  const rr = rng(nextSeed());
  const hl = new Biquad().set("hp", 350, 0.7), hr = new Biquad().set("hp", 350, 0.7);
  const ll = new Biquad().set("lp", 10000, 0.7), lr = new Biquad().set("lp", 10000, 0.7);
  voice(sfxPost, t0, 2.5, (t, o) => {
    const env = Math.min(1, t / 0.002) * (Math.exp(-t / 0.45) * 0.8 + Math.exp(-t / 1.6) * 0.2) * 0.42;
    o[0] = ll.run(hl.run(rl() * 2 - 1)) * env;
    o[1] = lr.run(hr.run(rr() * 2 - 1)) * env;
  }, sfxPostSend, 0.9);
  const rt = rng(nextSeed());
  const thud = new Biquad().set("bp", 180, 1.2);
  voice(sfxPost, t0, 0.4, (t, o) => {
    const v = thud.run(rt() * 2 - 1) * Math.exp(-t / 0.09) * 1.6;
    o[0] = v;
    o[1] = v;
  });
}

function stab(t0, notes, gain) {
  const osc = notes.flatMap((m) => [-9, 9].map((c) => ({ ph: 0, dt: (mtof(m) * 2 ** (c / 1200)) / SR })));
  const lp = new Biquad();
  voice(musicPost, t0, 1.4, (t, o, i) => {
    if (i % 32 === 0) lp.set("lp", 900 + 5200 * Math.exp(-t / 0.12), 0.9);
    let x = 0;
    for (const v of osc) {
      v.ph += v.dt;
      if (v.ph >= 1) v.ph -= 1;
      x += 2 * v.ph - 1 - polyblep(v.ph, v.dt);
    }
    const y = lp.run(x) * Math.exp(-t / 0.45) * gain;
    o[0] = y;
    o[1] = y;
  }, musicPostSend, 0.55);
}

function bassNote(t0, midi, gain) {
  const f = mtof(midi);
  const dt = f / SR;
  const lp = new Biquad();
  let ph = 0;
  voice(pumped, t0, 0.24, (t, o, i) => {
    if (i % 32 === 0) lp.set("lp", 260 + 1100 * Math.exp(-t / 0.05), 0.9);
    ph += dt;
    if (ph >= 1) ph -= 1;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const env = Math.min(1, t / 0.004) * Math.exp(-t / 0.16);
    const v = (lp.run(saw) * 0.8 + Math.sin(TAU * ph) * 0.6) * env * gain;
    o[0] = v;
    o[1] = v;
  });
}

function pluck(t0, midi, gain, pan) {
  const f = mtof(midi);
  const dt = f / SR;
  const lp = new Biquad();
  const [pl, pr] = panGains(pan);
  let ph = 0;
  voice(arpBus, t0, 0.5, (t, o, i) => {
    if (i % 32 === 0) lp.set("lp", 400 + 5000 * Math.exp(-t / 0.07), 0.9);
    ph += dt;
    if (ph >= 1) ph -= 1;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const tri = 1 - 4 * Math.abs(ph - 0.5);
    const v = lp.run(saw * 0.55 + tri * 0.7) * Math.min(1, t / 0.003) * Math.exp(-t / 0.2) * gain;
    o[0] = v * pl;
    o[1] = v * pr;
  });
}

function whoosh(t0, len, gain) {
  const r = rng(nextSeed());
  const bp = new Biquad();
  voice(sfxPost, t0, len, (t, o, i) => {
    const p = t / len;
    if (i % 32 === 0) bp.set("bp", 600 * (2600 / 600) ** p, 1.3);
    const env = Math.sin(Math.PI * Math.min(1, p * 1.15)) ** 2;
    const v = bp.run(r() * 2 - 1) * env * gain;
    const [pl, pr] = panGains(-0.7 + 1.4 * p);
    o[0] = v * pl;
    o[1] = v * pr;
  }, sfxPostSend, 0.35);
}

function sparkle(t0, gain) {
  const notes = [88, 93, 96, 100];
  const partials = [[1, 1, 0.9], [2.01, 0.35, 0.45], [3.02, 0.18, 0.3], [4.17, 0.1, 0.18]];
  notes.forEach((m, k) => {
    const f = mtof(m);
    const [pl, pr] = panGains(-0.5 + k * 0.33);
    voice(sfxPost, t0 + k * 0.045, 1.6, (t, o) => {
      let v = 0;
      for (const [ratio, amp, dec] of partials) v += Math.sin(TAU * f * ratio * t) * amp * Math.exp(-t / dec);
      v *= Math.min(1, t / 0.002) * gain;
      o[0] = v * pl;
      o[1] = v * pr;
    }, sfxPostSend, 0.6);
  });
}

// ---------- arrangement ----------

const Am = [45, 52, 57, 60];
const F = [41, 48, 57, 60];
const E = [40, 47, 56, 59];

// Bars 1-2: dark pad, clock ticks, typing.
pad(musicPre, musicPreSend, 0.35, 0, 4.0, Am, 0.032, 1.6, 0.8, (t) => 320 + 60 * t + 40 * Math.sin(TAU * 0.25 * t));
drone(0, 8.0, 33, 0.07);
for (let b = 0; b < 8; b++) tick(b * 0.5, b % 4 === 0 ? 0.16 : 0.1, b % 2 ? 0.25 : -0.25);
Array.from(T.sentence).forEach((ch, i) => keystroke(s(T.typeStart + i * T.typeStep), 0.34, ch === " "));

// Bars 3-4: pulse arrives with the agents.
pad(musicPre, musicPreSend, 0.35, 3.85, 8.0, F, 0.032, 0.4, 0.8, (t) => 500 + 90 * (t - 4) + 50 * Math.sin(TAU * 0.25 * t));
for (let t = 4.0; t < 8.0 - 1e-6; t += 0.25) hat(musicPre, musicPreSend, t, Math.round((t - 4) / 0.25) % 2 ? 0.11 : 0.06);
for (const t of [4.0, 5.0, 6.0, 7.0]) kick(musicPre, t, 0.28);
T.termIn.forEach((f, k) => land(s(f), 0.32, [-0.5, 0.5, 0.3][k]));

// Bars 5-6: tension on E, sessions stall, riser into silence.
pad(musicPre, musicPreSend, 0.35, 7.85, CUT, E, 0.034, 0.3, 0.02, (t) => 800 * (3200 / 800) ** ((t - 8) / (CUT - 8)));
drone(8.0, CUT, 28, 0.08);
for (let t = 8.0; t < CUT - 1e-6; t += 0.125) {
  const p = (t - 8) / (CUT - 8);
  hat(musicPre, musicPreSend, t, (Math.round((t - 8) / 0.125) % 2 ? 0.07 : 0.04) * (1 + 1.4 * p));
}
for (let t = 8.0; t < CUT - 1e-6; t += 0.5) kick(musicPre, t, 0.3 + 0.12 * ((t - 8) / (CUT - 8)));
T.stall.forEach((f) => stall(s(f), 0.55));
riser(s(T.riserStart), CUT, 0.4);

// Bar 7: impact on the bracket contact, then theme A.
impact(HIT);
kick(sfxPost, HIT, 0.75);
stab(HIT, [57, 60, 64, 69], 0.06);
const postKicks = [];
for (let t = HIT; t < DUR - 1e-6; t += 0.5) {
  postKicks.push(t);
  if (t > HIT) kick(musicPost, t, 0.55);
  hat(musicPost, musicPostSend, t + 0.25, 0.1, true);
  if (t >= HIT + 1) {
    hat(musicPost, musicPostSend, t + 0.125, 0.035);
    hat(musicPost, musicPostSend, t + 0.375, 0.035);
  }
}
for (let t = HIT + 0.25; t < DUR; t += 0.5) bassNote(t, t < HIT + 2 ? 33 : 29, 0.3);
pad(pumped, musicPostSend, 0.3, HIT, HIT + 2.0, Am, 0.02, 0.05, 0.5, () => 1800);
pad(pumped, musicPostSend, 0.3, HIT + 1.95, DUR, F, 0.02, 0.1, 0.5, () => 1900);
const arpAm = [57, 60, 64, 71, 69, 64, 60, 64];
const arpF = [53, 57, 60, 67, 65, 60, 57, 60];
for (let k = 0, t = HIT + 0.5; t < DUR - 1e-6; k++, t += 0.125) {
  const pattern = t < HIT + 2 ? arpAm : arpF;
  pluck(t, pattern[k % 8], k % 4 === 0 ? 0.13 : 0.09, k % 2 ? 0.3 : -0.3);
}
whoosh(s(T.wordmark) - 0.12, 0.5, 0.3);
sparkle(s(T.tagline), 0.07);

// ---------- mix ----------

const kickPump = (t) => {
  if (t < HIT) return 1;
  let last = HIT;
  for (const k of postKicks) if (k <= t) last = k;
  return 1 - 0.5 * Math.exp(-(t - last) / 0.11);
};
const arpWithEcho = pingPong(arpBus, 0.375, 0.32, 0.32);
const pumpedMix = new Bus(N).mix(pumped).mix(arpWithEcho).apply(kickPump);

const gatePre = (t) => (t < CUT ? 1 : Math.max(0, 1 - (t - CUT) / 0.02));
const preMusic = new Bus(N).mix(musicPre).mix(freeverb(musicPreSend, { room: 0.82, damp: 0.35 })).apply(gatePre);
const preSfx = new Bus(N).mix(sfxPre).mix(freeverb(sfxPreSend, { room: 0.8, damp: 0.4 })).apply(gatePre);
const postMusic = new Bus(N).mix(musicPost).mix(pumpedMix).mix(freeverb(musicPostSend, { room: 0.86, damp: 0.3 }));
const postSfx = new Bus(N).mix(sfxPost).mix(freeverb(sfxPostSend, { room: 0.9, damp: 0.25, gain: 0.02 }));

const fadeOut = (t) => (t < DUR - 0.4 ? 1 : Math.max(0, (DUR - t) / 0.4));

function master(buses, name) {
  const mix = new Bus(N);
  for (const bus of buses) mix.mix(bus);
  mix.apply(fadeOut);
  const target = -15;
  const before = loudness(mix);
  const gain = 10 ** ((target - before) / 20);
  for (let i = 0; i < N; i++) {
    mix.L[i] *= gain;
    mix.R[i] *= gain;
  }
  limit(mix, 0.89);
  const file = path.join(outDir, name);
  writeWav(file, mix);
  console.log(`${name}: ${loudness(mix).toFixed(1)} LUFS, peak ${(20 * Math.log10(peakOf(mix))).toFixed(1)} dBFS`);
}

master([preMusic, preSfx, postMusic, postSfx], "sample15.wav");
master([preSfx, postSfx], "sample15-sfx.wav");
