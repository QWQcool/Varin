import React from "react";
import { Img, staticFile } from "remotion";

/** Fan-made Q-style personifications. Codex is represented by GPT (OpenAI). */
export type CharId = "claude" | "deepseek" | "gpt" | "gemini" | "kimi" | "qwen" | "grok";

/** Cropped front-view sizes from scripts/crop-chars.mjs. */
export const CHAR_SIZE: Record<CharId, { w: number; h: number }> = {
  claude: { w: 555, h: 849 },
  deepseek: { w: 500, h: 716 },
  gpt: { w: 535, h: 849 },
  gemini: { w: 589, h: 856 },
  kimi: { w: 549, h: 847 },
  qwen: { w: 533, h: 804 },
  grok: { w: 546, h: 836 },
};

type Props = {
  readonly id: CharId;
  /** Rendered height in px; width follows the source aspect. */
  readonly height: number;
  readonly style?: React.CSSProperties;
};

export const Chibi: React.FC<Props> = ({ id, height, style }) => {
  const s = CHAR_SIZE[id];
  return (
    <Img
      src={staticFile(`chars/${id}.png`)}
      style={{
        position: "absolute",
        height,
        width: (height * s.w) / s.h,
        filter: "drop-shadow(0 14px 18px rgba(32,39,42,0.18))",
        ...style,
      }}
    />
  );
};
