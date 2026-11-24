import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { color, font } from "../../theme";
import { clamp, rise, settle } from "../motion";
import { C } from "../timeline";
import { Eyebrow } from "../Type";

const K = C.views;
const VIEWS = [
  { src: "ui/readme-varin-zh.png", label: "聊天", note: "围绕目标和 Varin 交流" },
  { src: "ui/readme-workbench-zh.png", label: "工作台", note: "直接和执行的 Agent 协作" },
  { src: "ui/readme-ide-zh.png", label: "IDE", note: "亲手改文件、看终端" },
];
const W = 1180;
const H = (W * 705) / 1110;
const X = (1920 - W) / 2;
const Y = 176;

export const ViewsScene: React.FC = () => {
  const f = useCurrentFrame();
  const current = f >= K.view[2] ? 2 : f >= K.view[1] ? 1 : 0;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 1400px 900px at 960px 560px, #f5f5f0 0%, #efefe8 60%, #e7e7df 100%)", fontFamily: font.sans }}>
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
          opacity: rise(f, 0, 18),
          scale: interpolate(f, [0, 20], [0.96, 1], settle),
        }}
      >
        {VIEWS.map((v, i) => {
          const at = K.view[i];
          const wipe = i === 0 ? 1 : interpolate(f, [at, at + 14], [0, 1], settle);
          return (
            <Img
              key={v.src}
              src={staticFile(v.src)}
              style={{
                position: "absolute",
                inset: 0,
                width: W,
                height: H,
                clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
              }}
            />
          );
        })}
        {[1, 2].map((i) => {
          const at = K.view[i];
          const edge = interpolate(f, [at, at + 14], [0, 1], settle);
          const visible = f >= at && f < at + 16;
          return visible ? (
            <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: edge * W - 2, width: 4, background: color.accent, boxShadow: `0 0 24px ${color.accentGlow}` }} />
          ) : null;
        })}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: Y + H + 28, display: "flex", justifyContent: "center", gap: 18 }}>
        {VIEWS.map((v, i) => {
          const active = i === current;
          const on = rise(f, K.view[i], 10);
          return (
            <div
              key={v.label}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                padding: "12px 24px",
                borderRadius: 999,
                background: active ? color.ink : "rgba(32,39,42,0.06)",
                color: active ? color.paper : color.muted,
                opacity: 0.35 + 0.65 * on,
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700 }}>{v.label}</span>
              <span style={{ fontSize: 22, fontWeight: 450, opacity: active ? 0.8 : 0.7 }}>{v.note}</span>
            </div>
          );
        })}
      </div>

      <Eyebrow index="05" title="三种距离" reveal={rise(f, 4)} style={{ left: X, top: 74 }} />
      <div
        style={{
          position: "absolute",
          left: X + 300,
          top: 64,
          fontSize: 56,
          fontWeight: 700,
          color: color.ink,
          letterSpacing: -0.5,
          opacity: rise(f, 14),
          translate: `0px ${(1 - rise(f, 14)) * 16}px`,
        }}
      >
        同一份工作，看你想靠多近。
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 1080,
          pointerEvents: "none",
          opacity: interpolate(f, [K.view[1] - 2, K.view[1] + 4, K.view[1] + 10], [0, 0.12, 0], clamp) + interpolate(f, [K.view[2] - 2, K.view[2] + 4, K.view[2] + 10], [0, 0.12, 0], clamp),
          background: "#ffffff",
        }}
      />
    </AbsoluteFill>
  );
};
