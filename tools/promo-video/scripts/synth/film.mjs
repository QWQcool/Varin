#!/usr/bin/env node
/**
 * Original score + foley for the full film, synthesised from code (no sampled audio).
 * Every event is read from src/film/timeline.ts and src/sample/timeline.ts, the same frames the picture uses.
 *
 * Writes public/audio/film.wav (music + SFX) and public/audio/film-sfx.wav (SFX only).
 * 120 BPM, A minor. Sections (V2 timeline):
 *   0-12   intro (identical to the approved sample)          12-43.4 theme A, clap from 16 s, lead from 28 s
 *   43.4   the floor drops      44-49 narrowed groove        49-50.5 power cut      51-54 rebuild
 *   54-70  theme B (clap, lead) 70-78 bots: groove + bells     78-82 build
 *   82     final hit, Am(add9) decaying to the end
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { T } from "../../src/sample/timeline.ts";
import { C, FPS, S } from "../../src/film/timeline.ts";
import { Biquad, Bus, SR, freeverb, limit, loudness, mtof, panGains, peakOf, pingPong, polyblep, rng, voice, writeWav } from "./dsp.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../../public/audio");
const s = (frame) => frame / FPS;
const DUR = s(S.finale.to);
const N = Math.round(DUR * SR);
const TAU = 2 * Math.PI;

const CUT = s(T.silence);
const HIT1 = s(T.impact);
const REC = S.recover.from;
const BLACKOUT = s(REC + C.recover.blackout);
const RELIGHT = s(REC + C.recover.relight);
const HIT2 = s(REC + C.recover.hit);
const FIN = S.finale.from;
const HIT3 = s(FIN + C.finale.lock);
const GAP3 = HIT3 - 0.5;

const music = new Bus(N);
const musicSend = new Bus(N);
const pumped = new Bus(N);
const arpBus = new Bus(N);
const leadBus = new Bus(N);
const sfx = new Bus(N);
const sfxSend = new Bus(N);

let seed = 1;
const nextSeed = () => (seed = (seed * 9301 + 49297) % 233280) + 1;

// ---------------------------------------------------------------- instruments

function tick(t0, gain, pan) {
  const r = rng(nextSeed());
  const bp = new Biquad().set("bp", 4800, 2.5);
  const [pl, pr] = panGains(pan);
  voice(music, t0, 0.06, (t, o) => {
    const v = (bp.run(r() * 2 - 1) * Math.exp(-t / 0.0035) * 2.2 + Math.sin(TAU * 2900 * t) * Math.exp(-t / 0.005) * 0.3) * gain;
    o[0] = v * pl;
    o[1] = v * pr;
  }, musicSend, 0.2);
}

function keystroke(t0, gain, space) {
  const r = rng(nextSeed());
  const bp = new Biquad().set("bp", (space ? 1300 : 2300) * (0.85 + 0.3 * r()), 1.4);
  const hp = new Biquad().set("hp", 500, 0.7);
  const thump = (space ? 115 : 165) * (0.9 + 0.2 * r());
  const [pl, pr] = panGains((r() - 0.5) * 0.35);
  const g = gain * (0.8 + 0.4 * r());
  voice(sfx, t0, 0.1, (t, o) => {
    const click = bp.run(hp.run(r() * 2 - 1)) * Math.exp(-t / 0.0045) * 2.6;
    const body = Math.sin(TAU * thump * t) * Math.exp(-t / 0.016) * 0.4;
    const up = t > 0.055 ? bp.run(r() * 2 - 1) * Math.exp(-(t - 0.055) / 0.003) * 0.9 : 0;
    const v = (click + body + up) * g;
    o[0] = v * pl;
    o[1] = v * pr;
  }, sfxSend, 0.12);
}

function hat(t0, gain, open = false) {
  const r = rng(nextSeed());
  const h1 = new Biquad().set("hp", 7200, 0.7);
  const h2 = new Biquad().set("hp", 7200, 0.7);
  const dec = open ? 0.11 : 0.03;
  voice(music, t0, dec * 6, (t, o) => {
    const v = h2.run(h1.run(r() * 2 - 1)) * Math.exp(-t / dec) * gain;
    o[0] = v * 0.85;
    o[1] = v;
  }, musicSend, 0.08);
}

const kickTimes = [];
function kick(bus, t0, gain) {
  kickTimes.push(t0);
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

function clap(t0, gain) {
  const r = rng(nextSeed());
  const bp = new Biquad().set("bp", 1250, 1.1);
  voice(music, t0, 0.3, (t, o) => {
    const burst = t < 0.03 ? Math.exp(-((t % 0.01) / 0.0025)) : Math.exp(-(t - 0.02) / 0.09);
    const v = bp.run(r() * 2 - 1) * burst * gain * 2.4;
    o[0] = v * 0.92;
    o[1] = v;
  }, musicSend, 0.3);
}

function snare(t0, gain) {
  const r = rng(nextSeed());
  const bp = new Biquad().set("bp", 1900, 0.8);
  voice(music, t0, 0.18, (t, o) => {
    const v = (bp.run(r() * 2 - 1) * Math.exp(-t / 0.07) * 1.6 + Math.sin(TAU * 190 * t) * Math.exp(-t / 0.04) * 0.5) * gain;
    o[0] = v;
    o[1] = v;
  }, musicSend, 0.2);
}

function heartbeat(t0, gain) {
  const r = rng(nextSeed());
  const lp = new Biquad().set("lp", 220, 0.7);
  let ph = 0;
  voice(music, t0, 0.3, (t, o) => {
    ph += (48 + 40 * Math.exp(-t / 0.03)) / SR;
    const v = (Math.sin(TAU * ph) * Math.exp(-t / 0.11) + lp.run(r() * 2 - 1) * Math.exp(-t / 0.02) * 0.5) * gain;
    o[0] = v;
    o[1] = v;
  });
}

function land(t0, gain, pan) {
  const [pl, pr] = panGains(pan);
  voice(sfx, t0, 0.16, (t, o) => {
    const v = (Math.sin(TAU * 1050 * t) * Math.exp(-t / 0.02) + Math.sin(TAU * 2480 * t) * Math.exp(-t / 0.008) * 0.45 + Math.sin(TAU * 520 * t) * Math.exp(-t / 0.03) * 0.35) * gain;
    o[0] = v * pl;
    o[1] = v * pr;
  }, sfxSend, 0.3);
}

function stall(t0, gain) {
  const r = rng(nextSeed());
  const lp = new Biquad().set("lp", 380, 0.7);
  let ph = 0;
  voice(sfx, t0, 0.6, (t, o) => {
    ph += (52 + 48 * Math.exp(-t / 0.05)) / SR;
    const v = (Math.sin(TAU * ph) * Math.exp(-t / 0.22) + lp.run(r() * 2 - 1) * Math.exp(-t / 0.03) * 0.7) * gain;
    o[0] = v;
    o[1] = v;
  }, sfxSend, 0.25);
}

/** Soft wooden tap; pitch shifts the whole body. */
function tap(t0, gain, pitch = 1, pan = 0) {
  const r = rng(nextSeed());
  const bp = new Biquad().set("bp", 2600 * pitch, 2);
  const [pl, pr] = panGains(pan);
  voice(sfx, t0, 0.12, (t, o) => {
    const v = (Math.sin(TAU * 720 * pitch * t) * Math.exp(-t / 0.025) + Math.sin(TAU * 1680 * pitch * t) * Math.exp(-t / 0.008) * 0.4 + bp.run(r() * 2 - 1) * Math.exp(-t / 0.002) * 0.6) * gain;
    o[0] = v * pl;
    o[1] = v * pr;
  }, sfxSend, 0.2);
}

/** Mechanical switch: press and release transients. */
function click(t0, gain) {
  const r = rng(nextSeed());
  const bp = new Biquad().set("bp", 3600, 3);
  voice(sfx, t0, 0.08, (t, o) => {
    const a = bp.run(r() * 2 - 1) * Math.exp(-t / 0.0018) * 2 + Math.sin(TAU * 1850 * t) * Math.exp(-t / 0.004) * 0.6;
    const b = t > 0.034 ? Math.sin(TAU * 2300 * (t - 0.034)) * Math.exp(-(t - 0.034) / 0.003) * 0.45 : 0;
    const v = (a + b) * gain;
    o[0] = v;
    o[1] = v;
  }, sfxSend, 0.15);
}

/** Card being dealt: a short paper swish. */
function flick(t0, gain, pan) {
  const r = rng(nextSeed());
  const bp = new Biquad();
  const [pl, pr] = panGains(pan);
  voice(sfx, t0, 0.12, (t, o, i) => {
    if (i % 32 === 0) bp.set("bp", 1800 + 30000 * t, 1.2);
    const env = Math.min(1, t / 0.012) * Math.exp(-t / 0.045);
    const v = bp.run(r() * 2 - 1) * env * gain * 1.8;
    o[0] = v * pl;
    o[1] = v * pr;
  }, sfxSend, 0.15);
}

/** FM bell / glass chime. */
function bell(bus, send, amt, t0, midi, gain, pan = 0, dur = 1.6, index = 2.2, ratio = 3.5) {
  const f = mtof(midi);
  const [pl, pr] = panGains(pan);
  voice(bus, t0, dur, (t, o) => {
    const env = Math.min(1, t / 0.002) * Math.exp(-t / (dur / 3.2));
    const mod = Math.sin(TAU * f * ratio * t) * index * Math.exp(-t / (dur / 5));
    const v = Math.sin(TAU * f * t + mod) * env * gain;
    o[0] = v * pl;
    o[1] = v * pr;
  }, send, amt);
}
const chime = (t0, midi, gain, pan = 0) => bell(sfx, sfxSend, 0.45, t0, midi, gain, pan, 1.2, 1.1, 2.0);

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

function drone(t0, t1, midi, gain, fadeIn = 1.5, fadeOut = 0.03) {
  const f = mtof(midi);
  voice(music, t0, t1 - t0, (t, o) => {
    const env = Math.min(1, t / fadeIn) * Math.min(1, (t1 - t0 - t) / fadeOut);
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
  voice(sfx, t0, len, (t, o, i) => {
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
  }, sfxSend, 0.3);
}

function impact(t0, scale = 1) {
  let ph = 0;
  voice(sfx, t0, 3.0, (t, o) => {
    ph += (36 + 110 * Math.exp(-t / 0.11)) / SR;
    const v = Math.sin(TAU * ph) * Math.exp(-t / 0.95) * 0.95 * scale;
    o[0] = v;
    o[1] = v;
  });
  const rl = rng(nextSeed());
  const rr = rng(nextSeed());
  const hl = new Biquad().set("hp", 350, 0.7), hr = new Biquad().set("hp", 350, 0.7);
  const ll = new Biquad().set("lp", 10000, 0.7), lr = new Biquad().set("lp", 10000, 0.7);
  voice(sfx, t0, 2.5, (t, o) => {
    const env = Math.min(1, t / 0.002) * (Math.exp(-t / 0.45) * 0.8 + Math.exp(-t / 1.6) * 0.2) * 0.42 * scale;
    o[0] = ll.run(hl.run(rl() * 2 - 1)) * env;
    o[1] = lr.run(hr.run(rr() * 2 - 1)) * env;
  }, sfxSend, 0.9);
  const rt = rng(nextSeed());
  const thud = new Biquad().set("bp", 180, 1.2);
  voice(sfx, t0, 0.4, (t, o) => {
    const v = thud.run(rt() * 2 - 1) * Math.exp(-t / 0.09) * 1.6 * scale;
    o[0] = v;
    o[1] = v;
  });
}

function stab(t0, notes, gain) {
  const osc = notes.flatMap((m) => [-9, 9].map((c) => ({ ph: 0, dt: (mtof(m) * 2 ** (c / 1200)) / SR })));
  const lp = new Biquad();
  voice(music, t0, 1.4, (t, o, i) => {
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
  }, musicSend, 0.55);
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

function sub(t0, len, midi, gain) {
  const f = mtof(midi);
  voice(music, t0, len, (t, o) => {
    const env = Math.min(1, t / 0.06) * Math.min(1, (len - t) / 0.12);
    const v = Math.sin(TAU * f * t) * env * gain;
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

function lead(t0, midi, len, gain) {
  const osc = [-6, 6].map((c) => ({ ph: 0, dt: (mtof(midi) * 2 ** (c / 1200)) / SR }));
  const lp = new Biquad();
  voice(leadBus, t0, len + 0.12, (t, o, i) => {
    if (i % 32 === 0) lp.set("lp", 1400 + 2600 * Math.exp(-t / 0.09), 1.1);
    let x = 0;
    for (const v of osc) {
      v.ph += v.dt;
      if (v.ph >= 1) v.ph -= 1;
      x += 2 * v.ph - 1 - polyblep(v.ph, v.dt);
    }
    const env = Math.min(1, t / 0.005) * (t < len ? 0.65 + 0.35 * Math.exp(-t / 0.08) : 0.65 * Math.exp(-(t - len) / 0.04));
    const y = lp.run(x) * env * gain;
    o[0] = y;
    o[1] = y;
  });
}

function whoosh(t0, len, gain, from = -0.7, to = 0.7) {
  const r = rng(nextSeed());
  const bp = new Biquad();
  voice(sfx, t0, len, (t, o, i) => {
    const p = t / len;
    if (i % 32 === 0) bp.set("bp", 600 * (2600 / 600) ** p, 1.3);
    const env = Math.sin(Math.PI * Math.min(1, p * 1.15)) ** 2;
    const v = bp.run(r() * 2 - 1) * env * gain;
    const [pl, pr] = panGains(from + (to - from) * p);
    o[0] = v * pl;
    o[1] = v * pr;
  }, sfxSend, 0.35);
}

function sparkle(t0, gain) {
  const notes = [88, 93, 96, 100];
  const partials = [[1, 1, 0.9], [2.01, 0.35, 0.45], [3.02, 0.18, 0.3], [4.17, 0.1, 0.18]];
  notes.forEach((m, k) => {
    const f = mtof(m);
    const [pl, pr] = panGains(-0.5 + k * 0.33);
    voice(sfx, t0 + k * 0.045, 1.6, (t, o) => {
      let v = 0;
      for (const [ratio, amp, dec] of partials) v += Math.sin(TAU * f * ratio * t) * amp * Math.exp(-t / dec);
      v *= Math.min(1, t / 0.002) * gain;
      o[0] = v * pl;
      o[1] = v * pr;
    }, sfxSend, 0.6);
  });
}

function powerDown(t0) {
  let ph = 0;
  voice(sfx, t0, 0.9, (t, o) => {
    ph += (40 + 180 * Math.exp(-t / 0.18)) / SR;
    const v = Math.sin(TAU * ph) * Math.exp(-t / 0.35) * 0.45;
    o[0] = v;
    o[1] = v;
  }, sfxSend, 0.3);
  click(t0, 0.5);
}

function hum(t0, t1, gain) {
  const r = rng(nextSeed());
  const lp = new Biquad().set("lp", 900, 0.7);
  voice(sfx, t0, t1 - t0, (t, o) => {
    const env = Math.min(1, t / 0.25) * Math.min(1, (t1 - t0 - t) / 0.05);
    const v = (Math.sin(TAU * 50 * t) * 0.6 + Math.sin(TAU * 100 * t) * 0.5 + Math.sin(TAU * 150 * t) * 0.25 + lp.run(r() * 2 - 1) * 0.15) * env * gain;
    o[0] = v;
    o[1] = v;
  });
}

function powerUp(t0, len) {
  const r = rng(nextSeed());
  const bp = new Biquad();
  let ph = 0;
  voice(sfx, t0, len, (t, o, i) => {
    const p = t / len;
    if (i % 32 === 0) bp.set("bp", 400 + 5000 * p ** 2, 1.4);
    ph += (60 + 700 * p ** 2) / SR;
    const env = Math.min(1, t / 0.02) * (p < 0.9 ? 1 : (1 - p) / 0.1);
    const v = (Math.sin(TAU * ph) * 0.5 + bp.run(r() * 2 - 1) * 0.6 * p) * env;
    o[0] = v * 0.9;
    o[1] = v;
  }, sfxSend, 0.35);
}

// ---------------------------------------------------------------- harmony

const CH = {
  Am: { pad: [45, 52, 57, 60], root: 33, arp: [57, 60, 64, 71, 69, 64, 60, 64], lead: [76, 0, 74, 72, 0, 69, 0, 0] },
  F: { pad: [41, 48, 57, 60], root: 29, arp: [53, 57, 60, 67, 65, 60, 57, 60], lead: [72, 0, 69, 72, 0, 77, 0, 76] },
  C: { pad: [48, 52, 55, 60], root: 36, arp: [52, 55, 60, 67, 64, 60, 55, 60], lead: [76, 0, 79, 76, 0, 72, 0, 74] },
  G: { pad: [43, 50, 55, 59], root: 31, arp: [55, 59, 62, 67, 71, 67, 62, 59], lead: [74, 0, 71, 67, 0, 74, 0, 0] },
  E: { pad: [40, 47, 56, 59], root: 28, arp: [], lead: [] },
  Em: { pad: [40, 47, 52, 55], root: 28, arp: [], lead: [] },
  Dm: { pad: [38, 45, 50, 53], root: 38, arp: [], lead: [] },
};
const PROG = ["Am", "F", "C", "G"];

/** Four-on-the-floor groove with sidechained pad, offbeat bass and 16th plucks. */
function groove(from, to, { arpFrom = from, arpGain = 1, clapOn = false, leadOn = false, padCut = 1900, kickFrom = from }) {
  for (let t = from, k = 0; t < to - 1e-6; t += 2, k++) {
    const ch = CH[PROG[k % 4]];
    const end = Math.min(t + 2, to);
    pad(pumped, musicSend, 0.3, Math.max(from, t - 0.05), end, ch.pad, 0.02, 0.08, 0.5, () => padCut);
    for (let b = 0.25; b < 2; b += 0.5) if (t + b < to) bassNote(t + b, ch.root, 0.3);
    for (let i = 0; i < 16; i++) {
      const tt = t + i * 0.125;
      if (tt >= to) break;
      if (tt >= arpFrom) pluck(tt, ch.arp[i % 8], (i % 4 === 0 ? 0.13 : 0.09) * arpGain, i % 2 ? 0.3 : -0.3);
      if (leadOn && i % 2 === 0) {
        const note = ch.lead[i / 2];
        if (note) lead(tt, note, 0.2, 0.05);
      }
    }
    if (clapOn) {
      clap(t + 0.5, 0.16);
      clap(t + 1.5, 0.16);
    }
  }
  for (let t = from; t < to - 1e-6; t += 0.5) {
    if (t >= kickFrom) kick(music, t, 0.55);
    hat(t + 0.25, 0.1, true);
    if (t >= from + 1) {
      hat(t + 0.125, 0.035);
      hat(t + 0.375, 0.035);
    }
  }
}

// ---------------------------------------------------------------- 0-12 intro (as approved in the sample)

pad(music, musicSend, 0.35, 0, 4.0, CH.Am.pad, 0.032, 1.6, 0.8, (t) => 320 + 60 * t + 40 * Math.sin(TAU * 0.25 * t));
drone(0, 8.0, 33, 0.07);
for (let b = 0; b < 8; b++) tick(b * 0.5, b % 4 === 0 ? 0.16 : 0.1, b % 2 ? 0.25 : -0.25);
Array.from(T.sentence).forEach((ch, i) => keystroke(s(T.typeStart + i * T.typeStep), 0.34, ch === " "));

pad(music, musicSend, 0.35, 3.85, 8.0, CH.F.pad, 0.032, 0.4, 0.8, (t) => 500 + 90 * (t - 4) + 50 * Math.sin(TAU * 0.25 * t));
for (let t = 4.0; t < 8.0 - 1e-6; t += 0.25) hat(t, Math.round((t - 4) / 0.25) % 2 ? 0.11 : 0.06);
for (const t of [4.0, 5.0, 6.0, 7.0]) kick(music, t, 0.28);
T.termIn.forEach((f, k) => land(s(f), 0.32, [-0.5, 0.5, 0.3][k]));

pad(music, musicSend, 0.35, 7.85, CUT, CH.E.pad, 0.034, 0.3, 0.02, (t) => 800 * (3200 / 800) ** ((t - 8) / (CUT - 8)));
drone(8.0, CUT, 28, 0.08);
for (let t = 8.0; t < CUT - 1e-6; t += 0.125) {
  const p = (t - 8) / (CUT - 8);
  hat(t, (Math.round((t - 8) / 0.125) % 2 ? 0.07 : 0.04) * (1 + 1.4 * p));
}
for (let t = 8.0; t < CUT - 1e-6; t += 0.5) kick(music, t, 0.3 + 0.12 * ((t - 8) / (CUT - 8)));
T.stall.forEach((f) => stall(s(f), 0.55));
riser(s(T.riserStart), CUT, 0.4);

impact(HIT1);
kick(sfx, HIT1, 0.75);
stab(HIT1, [57, 60, 64, 69], 0.06);
whoosh(s(T.wordmark) - 0.12, 0.5, 0.3);
sparkle(s(T.tagline), 0.07);

// ---------------------------------------------------------------- 12-44 theme A, then everything rides it

/** A title card or a headline word landing: soft low thump with a wooden top. */
function slamHit(t0, gain = 1) {
  kick(sfx, t0, 0.22 * gain);
  tap(t0, 0.16 * gain, 0.75, 0);
}

/** The product's lattice: a short shimmer of tiny cells. */
function shimmer(t0, len, gain, up = true) {
  for (let i = 0; i < 12; i++) {
    const p = i / 11;
    tap(t0 + p * len, gain * (0.6 + 0.4 * Math.sin(p * Math.PI)), up ? 1.6 + p * 0.9 : 2.5 - p * 0.9, -0.7 + ((i * 7) % 11) / 7.5);
  }
}

/** Falling sweep (the paper floor drops away). */
function fall(t0, len, gain) {
  const r = rng(nextSeed());
  const bp = new Biquad();
  voice(sfx, t0, len, (t, o, i) => {
    const p = t / len;
    if (i % 32 === 0) bp.set("bp", 3200 * (260 / 3200) ** p, 1.4);
    const env = Math.sin(Math.PI * Math.min(1, p * 1.05)) ** 1.5;
    const v = bp.run(r() * 2 - 1) * env * gain;
    o[0] = v;
    o[1] = v;
  }, sfxSend, 0.3);
}

const DP = S.dispatch.from;
const ST = S.steer.from;
const MO = S.models.from;
const DROP = s(MO + C.models.drop);

groove(HIT1, s(DP), { arpFrom: HIT1 + 0.5, kickFrom: HIT1 + 0.5 });
groove(s(DP), s(ST), { clapOn: true, padCut: 2200 });
groove(s(ST), s(MO), { clapOn: true, leadOn: true, padCut: 2300 });
groove(s(MO), DROP, { clapOn: true, leadOn: true, padCut: 2500 });

// 01 dispatch
const D = C.dispatch;
whoosh(s(DP) - 0.85, 0.8, 0.26, 0.4, -0.3);
click(s(DP + D.click), 0.32);
const PROMPT_LEN = "一起准备周五的发布吧。帮我把用户反馈、版本说明和官网的工作统筹起来。".length;
for (let i = 0; i < PROMPT_LEN; i += 2) keystroke(s(DP + D.typeFrom + i * D.typeStep), 0.28, false);
click(s(DP + D.send), 0.4);
whoosh(s(DP + D.send), 0.35, 0.2, -0.2, 0.3);
slamHit(s(DP + D.title + 5));
slamHit(s(DP + D.title + 13), 0.8);
tap(s(DP + 150), 0.2, 1.2, 0);
D.card.forEach((f, i) => {
  land(s(DP + f + 6), 0.3, 0.2 + i * 0.15);
  tap(s(DP + f + 12), 0.18, 1.5 + i * 0.1, 0.4);
});
chime(s(DP + D.status[0]), 88, 0.07, 0.3);
chime(s(DP + D.status[0]) + 0.09, 93, 0.06, 0.3);
tap(s(DP + D.status[1]), 0.2, 1.2, 0.3);
chime(s(DP + D.status[2]), 84, 0.07, 0.3);
whoosh(s(DP + D.pull) - 0.1, 0.9, 0.24, 0.5, -0.5);
for (let i = 0; i < 20; i++) tap(s(DP + D.wall + i * D.wallStep + 3), 0.17 - i * 0.003, 1.0 + i * 0.045, -0.75 + ((i * 7) % 15) / 10);
slamHit(s(DP + D.wallText[0]), 1.2);
slamHit(s(DP + D.wallText[1]), 0.9);
whoosh(s(DP + D.whip) - 0.05, 0.5, 0.32, 0.8, -0.8);

// 02 steer
const E = C.steer;
click(s(ST + E.click), 0.3);
for (let i = 0; i < "顺便把移动端也适配一下".length; i++) keystroke(s(ST + E.typeFrom + E.typeStep * (i + 1)), 0.28, false);
keystroke(s(ST + E.enter), 0.36, true);
whoosh(s(ST + E.enter), 0.3, 0.16, 0.2, -0.4);
slamHit(s(ST + 49));
slamHit(s(ST + 57), 0.8);
tap(s(ST + 76), 0.22, 1.1, -0.4);
click(s(ST + E.pick), 0.42);
click(s(ST + E.submit), 0.42);
whoosh(s(ST + E.folded), 0.35, 0.18, 0.5, -0.2);
tap(s(ST + E.folded + 12), 0.2, 1.3, -0.4);
click(s(ST + E.selector), 0.4);
riser(s(ST + 196), s(ST + E.iris + 8), 0.22);
whoosh(s(ST + E.iris), 0.4, 0.24, 0, 0);

// 03 models
const M = C.models;
M.deal.forEach((f, i) => {
  flick(s(MO + f), 0.34 - i * 0.02, i % 2 ? 0.4 : -0.4);
  tap(s(MO + f + 10), 0.28 - i * 0.02, 1 + (i % 2) * 0.12, i % 2 ? 0.4 : -0.4);
});
slamHit(s(MO + 29));
slamHit(s(MO + 37), 0.8);
M.roles.forEach((f, i) => click(s(MO + f), 0.3 - i * 0.03));
whoosh(s(MO + M.usage), 0.5, 0.24, 0.7, -0.1);
tap(s(MO + M.usage + 30), 0.22, 1.2, 0.2);
slamHit(s(MO + M.usage + 21), 0.8);
fall(DROP, 0.75, 0.5);
kick(sfx, DROP + 0.75, 0.4);

// ---------------------------------------------------------------- 44-54 power cut and recovery

const RC = REC;
const R = C.recover;
pad(music, musicSend, 0.4, s(RC) - 0.05, s(RC) + 2, CH.Dm.pad, 0.03, 0.3, 0.6, () => 700);
pad(music, musicSend, 0.4, s(RC) + 2, s(RC) + 4, CH.Am.pad, 0.03, 0.2, 0.6, () => 760);
pad(music, musicSend, 0.4, s(RC) + 4, BLACKOUT, CH.E.pad, 0.032, 0.2, 0.02, () => 820);
drone(s(RC), BLACKOUT, 26, 0.06, 0.6);
for (let t = s(RC); t < BLACKOUT - 1e-6; t += 0.25) hat(t, Math.round((t - s(RC)) / 0.25) % 2 ? 0.06 : 0.035);
for (let t = s(RC); t < BLACKOUT - 1e-6; t += 0.5) {
  heartbeat(t, 0.5);
  heartbeat(t + 0.2, 0.3);
}
slamHit(s(RC + 5));
slamHit(s(RC + 13), 0.8);
for (let i = 0; i < 4; i++) tap(s(RC + R.grow + i * 32), 0.2, 1.3, 0.4);
for (let i = 0; i < 3; i++) chime(s(RC + R.grow + i * 32 + 22), 86, 0.045, 0.4);

powerDown(BLACKOUT);
hum(BLACKOUT + 0.25, RELIGHT - 0.05, 0.016);
powerUp(RELIGHT - 0.1, 0.5);
const RESUME = s(RC + R.resume);
chime(RESUME, 88, 0.06, 0.3);
for (let i = 1; i < 5; i++) tap(RESUME + i * 0.5, 0.2, 1.3 + i * 0.06, 0.4);
slamHit(s(RC + R.relight + 11));
slamHit(s(RC + R.relight + 19), 0.8);
pad(music, musicSend, 0.35, RESUME, HIT2, CH.E.pad, 0.03, 0.3, 0.02, (t) => 600 * (3600 / 600) ** ((t - RESUME) / (HIT2 - RESUME)));
for (let t = RESUME; t < HIT2 - 1e-6; t += 0.5) kick(music, t, 0.38 + 0.2 * ((t - RESUME) / (HIT2 - RESUME)));
for (let t = RESUME + 0.5; t < HIT2 - 1e-6; t += 0.125) snare(t, 0.06 + 0.13 * ((t - RESUME - 0.5) / (HIT2 - RESUME - 0.5)));
riser(RELIGHT + 0.2, HIT2, 0.34);

impact(HIT2, 0.85);
kick(sfx, HIT2, 0.7);
stab(HIT2, [57, 60, 64, 69], 0.055);

// ---------------------------------------------------------------- 54-70 theme B

groove(HIT2, s(S.bots.from), { clapOn: true, leadOn: true, padCut: 2600, kickFrom: HIT2 + 0.5 });

const VW = S.views.from;
const V = C.views;
whoosh(s(VW) - 0.45, 0.5, 0.2, 0, 0);
slamHit(s(VW + 9), 0.8);
for (let i = 0; i < 2; i++) {
  click(s(VW + V.menu[i]), 0.3);
  click(s(VW + V.pick[i]), 0.36);
  shimmer(s(VW + V.pick[i]), 0.38, 0.11, true);
  shimmer(s(VW + V.swap[i] + 2), 0.4, 0.09, false);
  whoosh(s(VW + V.swap[i]), 0.3, 0.12, -0.3, 0.3);
}
whoosh(s(VW + V.shrink), 1.3, 0.16, 0.4, -0.4);

const DV = S.devices.from;
const Dv = C.devices;
tap(s(DV + 2), 0.24, 1.0, 0);
whoosh(s(DV + Dv.phone), 0.5, 0.22, 0.2, 0.7);
slamHit(s(DV + 11));
slamHit(s(DV + 19), 0.8);
tap(s(DV + 12), 0.14, 2.0, 0);
tap(s(DV + 22), 0.14, 2.2, 0.5);
chime(s(DV + Dv.ask), 84, 0.07, 0.6);
chime(s(DV + Dv.ask) + 0.1, 88, 0.06, 0.6);
tap(s(DV + Dv.tapOption), 0.3, 1.1, 0.6);
tap(s(DV + Dv.tapSubmit), 0.3, 1.0, 0.6);
chime(s(DV + Dv.back), 88, 0.07, 0.5);
chime(s(DV + Dv.back) + 0.09, 93, 0.06, 0.5);
tap(s(DV + Dv.back + 14), 0.14, 2.2, 0);
chime(s(DV + Dv.synced), 84, 0.06, -0.5);
chime(s(DV + Dv.synced) + 0.1, 91, 0.05, -0.5);
riser(s(DV + 196), s(DV + Dv.dive + 20), 0.26);
whoosh(s(DV + Dv.dive + 6), 0.5, 0.26, 0.5, 0);

// ---------------------------------------------------------------- 70-78 bots: the groove keeps going, bells on top

const BT = S.bots.from;
const B = C.bots;
groove(s(BT), s(FIN), { clapOn: true, padCut: 2800 });
const WARM = ["F", "G", "Em", "Am"];
WARM.forEach((name, k) => {
  const t = s(BT) + k * 2;
  CH[name].pad.forEach((m, j) => bell(music, musicSend, 0.5, t + j * 0.25, m + 24, 0.05, j % 2 ? 0.35 : -0.35, 1.2, 1.6, 3.5));
});
for (let i = 0; i < 15; i++) tap(s(BT + B.burst + i * 2 + 2), 0.19 - i * 0.004, 1.1 + i * 0.05, -0.8 + ((i * 7) % 15) / 9);
impact(s(BT + B.varin), 0.45);
kick(sfx, s(BT + B.varin), 0.55);
chime(s(BT + B.varin) + 0.05, 88, 0.08, 0);
chime(s(BT + B.varin) + 0.15, 93, 0.07, 0);
slamHit(s(BT + B.varin + 9), 0.8);
whoosh(s(BT + B.row), 0.45, 0.2, 0.6, -0.6);
B.chat.forEach((f, i) => tap(s(BT + f), 0.22, [1.4, 1.2, 1.25, 1.3][i], 0.4));
riser(s(BT + B.push - 10), s(FIN), 0.3);

// ---------------------------------------------------------------- 78-89.5 finale

const F0 = s(FIN);
pad(music, musicSend, 0.4, F0 - 0.05, F0 + 2, CH.F.pad, 0.03, 0.2, 0.6, (t) => 900 + 600 * (t - F0));
pad(music, musicSend, 0.4, F0 + 2, GAP3, CH.E.pad, 0.032, 0.1, 0.02, (t) => 2100 * (4200 / 2100) ** Math.min(1, (t - F0 - 2) / 1.5));
sub(F0, GAP3 - F0, 41, 0.07);
for (const d of [0, 1, 2, 2.5, 3, 3.25]) kick(music, F0 + d, 0.36 + 0.06 * d);
for (let t = F0 + 2; t < GAP3 - 1e-6; t += 0.125) snare(t, 0.05 + 0.13 * ((t - F0 - 2) / (GAP3 - F0 - 2)));
for (let i = 0; i < 8; i++) whoosh(F0 + s(C.finale.gather + i * 6), 0.35, 0.14 - i * 0.01, i % 2 ? 0.7 : -0.7, 0);
riser(F0 + 0.5, GAP3, 0.42);

impact(HIT3, 1.05);
kick(sfx, HIT3, 0.8);
stab(HIT3, [57, 60, 64, 69, 71], 0.06);
const tailEnd = DUR;
pad(music, musicSend, 0.55, HIT3, tailEnd - 2.2, [45, 52, 57, 60, 64, 71], 0.024, 0.04, 2.2, () => 2600);
sub(HIT3, tailEnd - HIT3 - 0.3, 33, 0.07);
[69, 72, 76, 83].forEach((m, i) => bell(music, musicSend, 0.6, HIT3 + 0.2 + i * 0.12, m + 12, 0.045, -0.45 + i * 0.3, 3.0, 1.4, 3.5));
whoosh(s(FIN + C.finale.lock + 6) - 0.1, 0.45, 0.18, -0.5, 0.5);
sparkle(s(FIN + C.finale.lock + 18), 0.07);

// ---------------------------------------------------------------- mix

const kicks = [...kickTimes].sort((a, b) => a - b);
const pumpAt = (t) => {
  let lo = 0;
  let hi = kicks.length - 1;
  let last = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (kicks[mid] <= t) {
      last = kicks[mid];
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (last < 0 || t - last > 0.6) return 1;
  return 1 - 0.5 * Math.exp(-(t - last) / 0.11);
};

const window = (t, a, b, fade = 0.02) => (t < a - fade || t >= b ? 1 : t < a ? (a - t) / fade : 0);
const musicGate = (t) => window(t, CUT, HIT1) * window(t, BLACKOUT, RELIGHT, 0.01) * window(t, GAP3, HIT3);
const sfxGate = (t) => window(t, CUT, HIT1) * window(t, GAP3, HIT3);
const fadeOut = (t) => (t < DUR - 1.2 ? 1 : Math.max(0, (DUR - t) / 1.2));

const pumpedMix = new Bus(N).mix(pumped).mix(pingPong(arpBus, 0.375, 0.32, 0.32)).apply(pumpAt);
const musicMix = new Bus(N)
  .mix(music)
  .mix(pumpedMix)
  .mix(pingPong(leadBus, 0.375, 0.3, 0.3))
  .mix(freeverb(musicSend, { room: 0.84, damp: 0.32 }))
  .apply(musicGate);
const sfxMix = new Bus(N).mix(sfx).mix(freeverb(sfxSend, { room: 0.88, damp: 0.28, gain: 0.018 })).apply(sfxGate);

function master(buses, name) {
  const mix = new Bus(N);
  for (const bus of buses) mix.mix(bus);
  mix.apply(fadeOut);
  const gain = 10 ** ((-15 - loudness(mix)) / 20);
  for (let i = 0; i < N; i++) {
    mix.L[i] *= gain;
    mix.R[i] *= gain;
  }
  limit(mix, 0.89);
  writeWav(path.join(outDir, name), mix);
  console.log(`${name}: ${DUR.toFixed(2)}s, ${loudness(mix).toFixed(1)} LUFS, peak ${(20 * Math.log10(peakOf(mix))).toFixed(1)} dBFS`);
}

master([musicMix, sfxMix], "film.wav");
master([sfxMix], "film-sfx.wav");
