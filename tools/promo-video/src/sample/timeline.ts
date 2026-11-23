/**
 * Single source of truth for the 15-second sample timing.
 * Read by the Remotion scenes and by scripts/synth/sample15.mjs (Node type stripping),
 * so picture and sound are pinned to the same frames.
 *
 * Grid: 120 BPM at 30 fps -> 1 beat = 15 frames, 1 bar = 60 frames.
 */
export const FPS = 30;
export const BEAT = 15;

export const T = {
  /** First keystroke, then one character every `typeStep` frames. */
  typeStart: 15,
  typeStep: 3,
  sentence: "你已经在用 Agent 了。",
  sentenceOut: 105,
  /** DeepSeek Harness, Codex, Claude Code land on bars 3, 3.5 and 4. */
  termIn: [120, 150, 180],
  /** Each agent stalls on consecutive beats of bar 5. */
  stall: [240, 255, 270],
  nodeIn: 276,
  headline: [300, 312],
  riserStart: 240,
  /** Music cuts here: one beat of silence before the impact. */
  silence: 345,
  /** Bracket halves start flying in during the silence and land on the impact. */
  bracketFly: 348,
  impact: 360,
  wordmark: 390,
  tagline: 398,
  subline: 410,
  end: 450,
} as const;
