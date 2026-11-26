import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Cursor } from "../../components/Cursor";
import { Screen } from "../../components/Screen";
import { color, font } from "../../theme";
import { camAt, camEase, CamKey, camStyle, inWorld, pathAt, PathKey, Placement, toScreen } from "../camera";
import { clamp, rise } from "../motion";
import { useSceneFrame } from "../scene";
import { C } from "../timeline";
import { Hi, Title } from "../Title";
import { PAPER } from "./Dispatch";

const K = C.steer;
const P: Placement = { x: 0, y: 0, k: 0.75 };
const W = (x: number, y: number) => inWorld(P, x, y);

/** Capture coordinates in question-idle / question-selected / completed-collapsed (2220 × 1410). */
const UI = {
  composer: W(560, 1203),
  option3: W(300, 853),
  submit: W(1351, 1061),
  fold: W(250, 117),
  selector: W(1172, 1287),
};

export const SELECTOR_ZOOM = 9;

const CAM: readonly CamKey[] = [
  [-8, 832, 540, 1.0],
  [6, 832, 540, 1.0],
  [26, 520, 860, 1.55],
  [46, 560, 860, 1.55],
  [72, 560, 640, 1.34],
  [112, 620, 650, 1.34],
  [140, 832, 540, 1.04, camEase.snap],
  [176, 832, 540, 1.04],
  [206, UI.selector.x, UI.selector.y, 2.6],
  [K.iris + 12, UI.selector.x, UI.selector.y, SELECTOR_ZOOM, camEase.whip],
];

const CURSOR: readonly PathKey[] = [
  [-8, 1000, 700],
  [K.click, UI.composer.x - 120, UI.composer.y],
  [40, 640, 960],
  [90, UI.option3.x, UI.option3.y],
  [K.pick + 4, UI.option3.x, UI.option3.y],
  [K.submit - 4, UI.submit.x, UI.submit.y],
  [150, 300, 200],
  [176, 320, 160],
  [K.selector - 4, UI.selector.x, UI.selector.y],
];

const TYPED = "顺便把移动端也适配一下";

export const SteerScene: React.FC = () => {
  const f = useSceneFrame();
  const cam = camAt(f, CAM);
  const typed = Math.max(0, Math.min(TYPED.length, Math.floor((f - K.typeFrom) / K.typeStep)));
  const queued = rise(f, K.enter, 8);
  const picked = f >= K.pick ? 1 : 0;
  const folded = interpolate(f, [K.folded, K.folded + 8], [0, 1], clamp);
  const whipIn = interpolate(f, [-8, 0], [1, 0], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const cursorAt = toScreen(cam, pathAt(f, CURSOR));

  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden" }}>
      <AbsoluteFill style={{ translate: `${2100 * whipIn}px 0px`, filter: whipIn > 0.01 ? `blur(${whipIn * 26}px)` : undefined }}>
        <div style={camStyle(cam)}>
          <Screen
            at={P}
            layers={[
              { src: "ui/question-idle.png", opacity: 1 - folded },
              { src: "ui/question-selected.png", opacity: picked * (1 - folded) },
              { src: "ui/completed-collapsed.png", opacity: folded },
            ]}
          >
            {f < K.folded + 8 ? (
              <div style={{ position: "absolute", left: 60, top: 1178, width: 900, height: 52, background: "#f7f7f7", opacity: 1 - folded }}>
                <div style={{ position: "absolute", left: 16, top: 2, fontFamily: font.sans, fontSize: 30, lineHeight: "48px", color: "#2b2b2b", whiteSpace: "nowrap", opacity: 1 - queued }}>
                  {f >= K.click ? TYPED.slice(0, typed) : <span style={{ color: "#9a9a9a" }}>描述你想做的事...</span>}
                  {f >= K.click && f < K.enter ? <span style={{ display: "inline-block", width: 3, height: 36, marginLeft: 2, verticalAlign: "-7px", background: color.accent }} /> : null}
                </div>
                {queued > 0 ? <div style={{ position: "absolute", left: 16, top: 2, fontFamily: font.sans, fontSize: 30, lineHeight: "48px", color: "#9a9a9a", opacity: queued }}>描述你想做的事...</div> : null}
              </div>
            ) : null}
            {queued > 0 && folded < 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: 56,
                  top: 1100,
                  width: 1350,
                  height: 50,
                  borderRadius: 14,
                  background: "#ffffff",
                  border: `2px solid ${color.line}`,
                  boxShadow: "0 8px 22px rgba(32,39,42,0.10)",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "0 22px",
                  boxSizing: "border-box",
                  fontFamily: font.sans,
                  fontSize: 26,
                  color: color.muted,
                  opacity: queued * (1 - folded),
                  translate: `0px ${(1 - queued) * 60}px`,
                }}
              >
                <span style={{ color: color.accent, fontWeight: 700 }}>↑</span>
                <span style={{ color: color.text, flex: 1 }}>{TYPED}</span>
                <span style={{ padding: "2px 14px", borderRadius: 999, background: "rgba(75,111,172,0.12)", color: color.accent, fontWeight: 600 }}>已排队 · 下一步处理</span>
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: 86,
                top: 92,
                width: 330,
                height: 52,
                borderRadius: 12,
                border: `5px solid ${color.accent}`,
                opacity: interpolate(f, [K.folded + 10, K.folded + 16, 178, 186], [0, 1, 1, 0], clamp),
                scale: interpolate(f, [K.folded + 10, K.folded + 22], [1.15, 1], { ...clamp, easing: camEase.snap }),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 1060,
                top: 1250,
                width: 236,
                height: 74,
                borderRadius: 37,
                border: `5px solid ${color.accent}`,
                opacity: interpolate(f, [192, 198], [0, 1], clamp),
              }}
            />
          </Screen>
        </div>

        {[
          { text: "需要你时，才问你", at: 76, out: K.submit, x: 110, y: 150 },
          { text: "完成后自动收起，只留结果", at: K.folded + 14, out: 186, x: 600, y: 40 },
        ].map((c) => (
          <div
            key={c.text}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              padding: "14px 28px",
              borderRadius: 999,
              background: color.ink,
              color: color.paper,
              fontFamily: font.sans,
              fontSize: 36,
              fontWeight: 650,
              whiteSpace: "nowrap",
              boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
              opacity: interpolate(f, [c.at, c.at + 6, c.out - 4, c.out + 2], [0, 1, 1, 0], clamp),
              scale: interpolate(f, [c.at, c.at + 8], [0.7, 1], { ...clamp, easing: camEase.snap }),
            }}
          >
            {c.text}
          </div>
        ))}

        <Cursor x={cursorAt.x} y={cursorAt.y} frame={f} clicks={[K.click, K.pick, K.submit, K.selector]} opacity={interpolate(f, [-4, 2, K.iris, K.iris + 6], [0, 1, 1, 0], clamp)} />

        <Title
          f={f}
          at={44}
          out={140}
          gone={200}
          corner="tr"
          index="02"
          title="边干边说"
          lines={[
            "它在干活，",
            <>
              你随时可以<Hi>插话</Hi>。
            </>,
          ]}
          sub="补充要求，排进下一步。"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
