import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { ColdOpen } from "../../sample/ColdOpen";
import { Reveal } from "../../sample/Reveal";
import { T } from "../../sample/timeline";
import { clamp } from "../motion";
import { PRE, S } from "../timeline";

/**
 * Approved sample (0-449) unchanged up to the lockup. Then the promise lines leave and the lockup
 * fades over the first frames of chapter 01, whose camera starts exactly on the same mark in the app's title bar.
 */
export const OpenScene: React.FC = () => {
  const f = useCurrentFrame();
  const morph = S.dispatch.from - PRE.dispatch;
  return (
    <AbsoluteFill>
      <Sequence name="Cold open" durationInFrames={T.impact + 12}>
        <ColdOpen />
      </Sequence>
      <AbsoluteFill style={{ opacity: interpolate(f, [morph + 2, morph + 8], [1, 0], clamp) }}>
        <Sequence name="Reveal" from={T.bracketFly}>
          <Reveal outro={morph - 12} />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
