import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { color, font } from "../../theme";
import { clamp, rise, settle } from "../motion";
import { C } from "../timeline";
import { Eyebrow, Headline, Mark, Sub } from "../Type";

const K = C.steer;
/** Real 0.9.53 captures are 2220x1410 (1110x705 CSS at DPR 2). Shown at 0.5 => 1110x705. */
const W = 1110;
const H = 705;
const X = 720;
const Y = 196;

const Shot: React.FC<{ readonly src: string; readonly opacity: number; readonly zoom?: number; readonly origin?: string }> = ({
  src,
  opacity,
  zoom = 1,
  origin = "50% 50%",
}) => (
  <Img
    src={staticFile(src)}
    style={{ position: "absolute", inset: 0, width: W, height: H, opacity, scale: zoom, transformOrigin: origin }}
  />
);

const TYPED = "顺便把移动端也适配一下";

export const SteerScene: React.FC = () => {
  const f = useCurrentFrame();
  const enter = rise(f, 0, 22);
  const typed = Math.max(0, Math.min(TYPED.length, Math.floor((f - K.type) / 3)));
  const composerOn = interpolate(f, [K.type - 6, K.type, K.queued + 4, K.queued + 10], [0, 1, 1, 0], clamp);
  const queuedOn = interpolate(f, [K.queued, K.queued + 8, K.question - 4, K.question + 4], [0, 1, 1, 0], clamp);
  const pickedOn = interpolate(f, [K.pick, K.pick + 4], [0, 1], clamp);
  const foldedOn = rise(f, K.folded, 10);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 1300px 900px at 1200px 520px, #f5f5f0 0%, #efefe8 60%, #e7e7df 100%)" }}>
      <div
        style={{
          position: "absolute",
          left: X,
          top: Y,
          width: W,
          height: H,
          borderRadius: 16,
          overflow: "hidden",
          background: color.surface,
          border: `1px solid ${color.line}`,
          boxShadow: "0 40px 90px rgba(32,39,42,0.16), 0 6px 18px rgba(32,39,42,0.08)",
          opacity: enter,
          translate: `${(1 - enter) * 100}px 0px`,
        }}
      >
        <Shot src="ui/question-idle.png" opacity={1 - foldedOn} />
        <Shot src="ui/question-selected.png" opacity={pickedOn * (1 - foldedOn)} />
        <Shot src="ui/completed-collapsed.png" opacity={foldedOn} />

        <div
          style={{
            position: "absolute",
            left: 124,
            top: 47,
            width: 70,
            height: 22,
            background: "#f3f3f3",
            fontFamily: font.sans,
            fontSize: 14,
            lineHeight: "22px",
            color: "#686868",
            opacity: foldedOn,
          }}
        >
          · 18秒
        </div>

        <div
          style={{
            position: "absolute",
            left: 22,
            top: 557,
            width: 688,
            height: 98,
            borderRadius: 16,
            background: "#ffffff",
            border: `1px solid ${color.line}`,
            boxShadow: `0 0 0 ${3 * composerOn}px rgba(75,111,172,0.25)`,
            opacity: composerOn,
            padding: "16px 18px",
            boxSizing: "border-box",
            fontFamily: font.sans,
            fontSize: 17,
            color: color.text,
          }}
        >
          {TYPED.slice(0, typed)}
          <span style={{ display: "inline-block", width: 2, height: 20, marginLeft: 2, verticalAlign: "-4px", background: color.accent, opacity: f % 15 < 9 ? 1 : 0 }} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 25,
            top: 505,
            width: 681,
            height: 40,
            borderRadius: 12,
            background: "#fafafa",
            border: `1px solid ${color.line}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            boxSizing: "border-box",
            fontFamily: font.sans,
            fontSize: 15,
            color: color.muted,
            opacity: queuedOn,
            translate: `0px ${(1 - rise(f, K.queued, 10)) * 18}px`,
          }}
        >
          <span style={{ color: color.accent }}>↑</span>
          <span style={{ color: color.text, flex: 1 }}>{TYPED}</span>
          <span>已排队 · 下一步处理</span>
        </div>
      </div>

      {[
        { text: "插话已排队，下一步处理", from: K.queued + 4, to: K.question },
        { text: "需要你时，才问你", from: K.question + 12, to: K.folded },
        { text: "完成后自动收起，只留结果", from: K.folded + 8, to: K.folded + 80 },
      ].map((c) => (
        <div
          key={c.text}
          style={{
            position: "absolute",
            left: X + W / 2,
            top: Y + H + 28,
            translate: `-50% ${(1 - rise(f, c.from, 12)) * 14}px`,
            padding: "12px 26px",
            borderRadius: 999,
            background: color.ink,
            color: color.paper,
            fontFamily: font.sans,
            fontSize: 32,
            fontWeight: 600,
            whiteSpace: "nowrap",
            opacity: interpolate(f, [c.from, c.from + 8, c.to - 6, c.to], [0, 1, 1, 0], clamp),
          }}
        >
          {c.text}
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          left: X + 30,
          top: Y + 34,
          width: 300,
          height: 40,
          borderRadius: 10,
          border: `3px solid ${color.accent}`,
          opacity: interpolate(f, [K.folded + 10, K.folded + 18, K.folded + 70, K.folded + 80], [0, 1, 1, 0], clamp),
          scale: interpolate(f, [K.folded + 10, K.folded + 22], [1.12, 1], settle),
        }}
      />

      <Eyebrow index="02" title="边干边说" reveal={rise(f, 8)} style={{ left: 120, top: 196 }} />
      <Headline
        lines={[
          "它在干活，",
          <>
            你随时可以<Mark draw={rise(f, 52, 14)}>插话</Mark>。
          </>,
        ]}
        reveal={[rise(f, 18), rise(f, 32)]}
        size={74}
        style={{ left: 116, top: 246 }}
      />
      <Sub
        lines={["补充要求，排进下一步；", "需要你时，才问你；", "完成后只留结果。"]}
        reveal={rise(f, 72)}
        style={{ left: 120, top: 450 }}
      />
    </AbsoluteFill>
  );
};
