/**
 * Full film timeline (V2). One source of truth for scenes (Remotion) and score (scripts/synth/film.mjs).
 * 120 BPM at 30 fps: 1 beat = 15 frames, 1 bar = 60 frames. `bar(n)` is the first frame of bar n (1-based).
 * The cold open 0-359 reuses the approved sample (src/sample/timeline.ts) unchanged.
 */
export const FPS = 30;
export const BEAT = 15;
export const BAR = 60;
export const bar = (n: number) => (n - 1) * BAR;

/** Scene boundaries: where the next chapter owns the picture. */
export const S = {
  open: { from: 0, to: bar(9) },
  dispatch: { from: bar(9), to: bar(15) },
  steer: { from: bar(15), to: bar(19) },
  models: { from: bar(19), to: bar(23) },
  recover: { from: bar(23), to: bar(28) },
  views: { from: bar(28), to: bar(32) },
  devices: { from: bar(32), to: bar(36) },
  bots: { from: bar(36), to: bar(40) },
  finale: { from: bar(40), to: bar(45.75) },
} as const;

export const FILM_FRAMES = S.finale.to;

/**
 * Frames a chapter starts rendering before its boundary, so every boundary is a carry, never a bare cut:
 * dispatch: the lockup's mark is the app's title-bar mark (camera pulls out of it);
 * steer: whip pan; models: iris out of the model selector; recover: the paper floor drops away;
 * views: iris out of the resumed step; devices: the same take continues; bots: dive through the phone;
 * finale: push into Varin's portrait.
 */
export const PRE = {
  open: 0,
  dispatch: 30,
  steer: 8,
  models: 12,
  recover: 18,
  views: 14,
  devices: 0,
  bots: 10,
  finale: 0,
} as const;

/** Chapter-local beats (frames relative to each scene's boundary). */
export const C = {
  dispatch: {
    click: 6,
    typeFrom: 10,
    typeStep: 1.5,
    send: 66,
    stream: [80, 140],
    title: 82,
    titleOut: 150,
    card: [180, 188, 195],
    status: [210, 225, 240],
    pull: 248,
    /** Twenty agent tiles pop on 32nd notes, nearest first. */
    wall: 262,
    wallStep: 3.75,
    wallText: [300, 308],
    whip: 352,
  },
  steer: {
    click: 8,
    typeFrom: 12,
    typeStep: 3,
    enter: 48,
    pick: 100,
    submit: 122,
    folded: 126,
    selector: 212,
    iris: 228,
  },
  models: {
    /** Cards leave the model selector faster and faster. */
    deal: [0, 5, 9, 13, 16, 19, 22, 25],
    roles: [56, 64, 71, 79],
    usage: 112,
    drop: 222,
  },
  recover: {
    grow: 0,
    blackout: 150,
    relight: 195,
    resume: 210,
    /** Bar line into chapter 05: impact 2/3. */
    hit: 300,
  },
  views: {
    menu: [40, 120],
    pick: [54, 134],
    swap: [66, 146],
    shrink: 196,
  },
  devices: {
    phone: 8,
    ask: 30,
    tapOption: 78,
    tapSubmit: 100,
    back: 104,
    synced: 132,
    dive: 214,
  },
  bots: {
    burst: 0,
    varin: 34,
    row: 64,
    chat: [92, 112, 132, 152],
    push: 206,
  },
  finale: {
    gather: 0,
    lock: 120,
    hold: 150,
  },
} as const;
