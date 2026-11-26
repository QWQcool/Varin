import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { Cursor } from "../../components/Cursor";
import { Lattice } from "../../components/Lattice";
import { Screen } from "../../components/Screen";
import { color, font } from "../../theme";
import { camAt, camEase, CamKey, camStyle, inWorld, pathAt, PathKey, Placement, toScreen } from "../camera";
import { clamp } from "../motion";
import { useSceneFrame } from "../scene";
import { C } from "../timeline";
import { Hi, Title } from "../Title";
import { PAPER } from "./Dispatch";
import { RESUME_DOT } from "./Recover";

const K = C.views;
const P: Placement = { x: 0, y: 0, k: 0.75 };
const W = (x: number, y: number) => inWorld(P, x, y);

/** Where the window sits when chapter 06 takes over: x 80..960 on screen. */
export const DESK_Z = 880 / (2220 * P.k);
export const DESK_CAM = { x: 832 - (520 - 960) / DESK_Z, y: 529 - (520 - 540) / DESK_Z };

const VIEWS = [
  { src: "ui/readme-varin-zh.png", label: "聊天", note: "围绕目标和 Varin 交流" },
  { src: "ui/readme-workbench-zh.png", label: "工作台", note: "直接和执行的 Agent 协作" },
  { src: "ui/readme-ide-zh.png", label: "IDE", note: "亲手改文件、看终端" },
];

/**
 * The switcher menu is cut out of the real menu captures (switcher centre (184, 44) there) and pinned to each
 * conversation capture's own switcher. Rows: Varin 122, 工作台 178, IDE 234 (capture y in the menu capture).
 */
const MENUS = [
  { src: "ui/menu-from-varin.png", switcher: { x: 205, y: 38 }, row: 178 },
  { src: "ui/menu-from-workbench.png", switcher: { x: 210, y: 37 }, row: 234 },
];
const MENU_BOX = { x: 98, y: 82, w: 348, h: 192 };

const CAM: readonly CamKey[] = [
  [-14, 832, 540, 1.0],
  [28, 832, 540, 1.0],
  [42, 620, 400, 1.28],
  [56, 620, 400, 1.28],
  [72, 832, 540, 1.0, camEase.snap],
  [108, 832, 540, 1.0],
  [122, 620, 400, 1.28],
  [136, 620, 400, 1.28],
  [152, 832, 540, 1.0, camEase.snap],
  [K.shrink, 832, 540, 1.02],
  [240, DESK_CAM.x, DESK_CAM.y, DESK_Z, camEase.follow],
];

const row = (m: number) => W(272 + MENUS[m].switcher.x - 184, MENUS[m].row + MENUS[m].switcher.y - 44);
const CURSOR: readonly PathKey[] = [
  [0, 900, 620],
  [K.menu[0] - 4, W(205, 38).x, W(205, 38).y],
  [K.pick[0] - 4, row(0).x, row(0).y],
  [90, 560, 300],
  [K.menu[1] - 4, W(210, 37).x, W(210, 37).y],
  [K.pick[1] - 4, row(1).x, row(1).y],
  [180, 700, 420],
];

export const ViewsScene: React.FC = () => {
  const f = useSceneFrame();
  const cam = camAt(f, CAM);
  const current = f >= K.swap[1] ? 2 : f >= K.swap[0] ? 1 : 0;
  const iris = interpolate(f, [-14, 0], [0, 2300], { ...clamp, easing: camEase.whip });
  const cursorAt = toScreen(cam, pathAt(f, CURSOR));
  const flash = interpolate(f, [-1, 0, 6], [0, 0.35, 0], clamp);

  return (
    <AbsoluteFill style={{ background: PAPER, clipPath: `circle(${iris}px at ${RESUME_DOT.x}px ${RESUME_DOT.y}px)` }}>
      <div style={camStyle(cam)}>
        <Screen at={P} layers={VIEWS.map((v, i) => ({ src: v.src, opacity: i === current ? 1 : 0 }))}>
          {MENUS.map((m, i) => {
            const open = interpolate(f, [K.menu[i], K.menu[i] + 5], [0, 1], { ...clamp, easing: camEase.snap });
            const close = interpolate(f, [K.pick[i] + 1, K.pick[i] + 5], [1, 0], clamp);
            const vis = open * close;
            if (vis <= 0) return null;
            const dx = m.switcher.x - 184;
            const dy = m.switcher.y - 44;
            const hover = i === 0 && f >= K.pick[0] - 6 ? 1 : 0;
            return (
              <div
                key={m.src}
                style={{
                  position: "absolute",
                  left: MENU_BOX.x + dx,
                  top: MENU_BOX.y + dy,
                  width: MENU_BOX.w,
                  height: MENU_BOX.h,
                  borderRadius: 22,
                  overflow: "hidden",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.16)",
                  opacity: vis,
                  scale: 0.94 + 0.06 * open,
                  transformOrigin: "30% 0",
                }}
              >
                <Img src={staticFile(m.src)} style={{ position: "absolute", left: -MENU_BOX.x, top: -MENU_BOX.y, width: 2220, height: 1410 }} />
                <div style={{ position: "absolute", left: 12, top: m.row - 28 - MENU_BOX.y, width: 324, height: 56, borderRadius: 14, background: "rgba(0,0,0,0.05)", opacity: hover }} />
              </div>
            );
          })}
          {MENUS.map((m, i) => (
            <Lattice key={i} frame={f} coverAt={K.pick[i]} revealAt={K.swap[i] + 2} origin={m.switcher} />
          ))}
        </Screen>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, display: "flex", justifyContent: "center", gap: 16, opacity: interpolate(f, [8, 16, K.shrink - 6, K.shrink + 4], [0, 1, 1, 0], clamp) }}>
        {VIEWS.map((v, i) => {
          const active = i === current;
          const pulse = interpolate(f, [K.swap[i - 1] ?? -99, (K.swap[i - 1] ?? -99) + 10], [1.15, 1], { ...clamp, easing: camEase.snap });
          return (
            <div
              key={v.label}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                padding: "12px 26px",
                borderRadius: 999,
                background: active ? color.ink : "rgba(32,39,42,0.08)",
                color: active ? color.paper : color.muted,
                fontFamily: font.sans,
                scale: active ? pulse : 1,
                boxShadow: active ? "0 14px 30px rgba(0,0,0,0.2)" : "none",
              }}
            >
              <span style={{ fontSize: 34, fontWeight: 750 }}>{v.label}</span>
              <span style={{ fontSize: 22, fontWeight: 450, opacity: 0.8 }}>{v.note}</span>
            </div>
          );
        })}
      </div>

      <Cursor x={cursorAt.x} y={cursorAt.y} frame={f} clicks={[K.menu[0], K.pick[0], K.menu[1], K.pick[1]]} opacity={interpolate(f, [0, 6, 176, 184], [0, 1, 1, 0], clamp)} />

      <Title
        f={f}
        at={4}
        out={100}
        gone={K.shrink}
        corner="tr"
        index="05"
        title="三种距离"
        lines={[
          <>
            同一份工作，看你想<Hi>靠多近</Hi>。
          </>,
        ]}
        size={54}
        sub="聊天 · 工作台 · IDE，一键切换。"
      />
      <AbsoluteFill style={{ background: "#ffffff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
