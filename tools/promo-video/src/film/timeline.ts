/**
 * Full film timeline. One source of truth for scenes (Remotion) and score (scripts/synth/film.mjs).
 * 120 BPM at 30 fps: 1 beat = 15 frames, 1 bar = 60 frames. `bar(n)` is the first frame of bar n (1-based).
 * The opening 0-449 reuses the approved sample (src/sample/timeline.ts) unchanged.
 */
export const FPS = 30;
export const BEAT = 15;
export const BAR = 60;
export const bar = (n: number) => (n - 1) * BAR;

/** Scene boundaries, all on bar lines. */
export const S = {
  open: { from: 0, to: bar(9.5) },
  agents: { from: bar(9.5), to: bar(19) },
  steer: { from: bar(19), to: bar(25) },
  models: { from: bar(25), to: bar(31) },
  recover: { from: bar(31), to: bar(37) },
  views: { from: bar(37), to: bar(43) },
  devices: { from: bar(43), to: bar(49) },
  bots: { from: bar(49), to: bar(53) },
  finale: { from: bar(53), to: bar(58) + 45 },
} as const;

export const FILM_FRAMES = S.finale.to;

/** Chapter-local beats (frames relative to each scene's `from`). */
export const C = {
  agents: {
    /** Lockup slides up and away; the brackets open into the real conversation. */
    open: 0,
    title: 15,
    /** Cards are pulled out of the conversation on consecutive beats. */
    card: [150, 180, 210],
    /** Characters pop up behind their cards one beat after each card lands. */
    char: [165, 195, 225],
    /** Status changes: tests pass, backend in progress, frontend asks the user. */
    status: [300, 330, 360],
    result: 450,
    roster: 510,
  },
  steer: {
    type: 30,
    queued: 105,
    question: 150,
    pick: 225,
    folded: 300,
  },
  models: {
    /** Dealt cards accelerate: interval shrinks each deal. */
    deal: [0, 18, 33, 46, 57, 66, 74, 81],
    rest: 111,
    roles: 150,
  },
  recover: {
    grow: 0,
    blackout: 210,
    relight: 255,
    resume: 270,
    /** Bar line into chapter 05: impact 2/3 (audio only; the picture is already wiping). */
    hit: 360,
  },
  views: {
    /** Varin -> Workbench -> IDE, each held for two bars. */
    view: [0, 120, 240],
  },
  devices: {
    nodes: [30, 60, 90],
    phone: 180,
    approve: 240,
    desktop: 270,
  },
  bots: {
    rise: 0,
    /** Varin arrives on her own beat after the other 15. */
    varin: 90,
    chat: 120,
  },
  finale: {
    gather: 0,
    lock: 120,
    hold: 150,
  },
} as const;
