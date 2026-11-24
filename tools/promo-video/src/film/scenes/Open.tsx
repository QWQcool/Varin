import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { ColdOpen } from "../../sample/ColdOpen";
import { Reveal } from "../../sample/Reveal";
import { T } from "../../sample/timeline";
import { clamp } from "../motion";
import { S } from "../timeline";

/**
 * Approved sample (0-449) unchanged, then the lockup holds and lifts away during
 * the last half bar so chapter 01 opens on bar 9.5.
 */
export const OpenScene: React.FC = () => {
  const f = useCurrentFrame();
  const exitAt = S.open.to - 30;
  return (
    <AbsoluteFill style={{ background: "#121618" }}>
      <Sequence name="Cold open" durationInFrames={T.impact + 12}>
        <ColdOpen />
      </Sequence>
      <AbsoluteFill
        style={{
          opacity: interpolate(f, [exitAt + 10, S.open.to], [1, 0], clamp),
          translate: `0px ${interpolate(f, [exitAt, S.open.to], [0, -140], { ...clamp, easing: Easing.in(Easing.cubic) })}px`,
        }}
      >
        <Sequence name="Reveal" from={T.bracketFly}>
          <Reveal />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
