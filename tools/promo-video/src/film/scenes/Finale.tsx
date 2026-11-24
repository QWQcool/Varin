import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { font } from "../../theme";
import { clamp, rise, settle } from "../motion";
import { C } from "../timeline";

const K = C.finale;

const LEAD = "M-35 -19 L-11 -43 L44 -43 L57 -30 L2 -30 L-21 -7 L-21 26 L-35 12 Z";
const TRAIL = "M35 19 L11 43 L-44 43 L-57 30 L-2 30 L21 7 L21 -26 L35 -12 Z";

/** .github/readme/assets/wordmark.svg geometry scaled by Z, centred on (960, y). */
const Z = 0.92;
const LOCK = {
  y: 170,
  markX: 960 + (380 - 518) * Z,
  markScale: 1.28 * Z,
  textX: 960 + (495 - 518) * Z,
  baseline: 170 + (154 - 120) * Z,
  fontSize: 102 * Z,
  letterSpacing: -4 * Z,
};

/** One representative element per chapter flies in from the edges and gathers round the lockup. */
const TOKENS = [
  { label: "DeepSeek Harness · 测试", from: [-500, -300], to: [400, 210], logo: "logos/deepseek-harness.svg" },
  { label: "Codex · 后端", from: [2400, -260], to: [1520, 210], logo: "logos/codex.svg" },
  { label: "Claude Code · 前端", from: [-520, 640], to: [330, 360], logo: "logos/claude-orange.svg" },
  { label: "需要你时才问你", from: [2420, 640], to: [1600, 360], logo: "" },
  { label: "每件事交给对的模型", from: [-400, 1200], to: [420, 510], logo: "logos/provider-deepseek.svg" },
  { label: "重启后接着做", from: [2300, 1200], to: [1500, 510], logo: "" },
  { label: "电脑 · 服务器 · 手机", from: [700, 1300], to: [650, 660], logo: "" },
  { label: "16 位 Bot 角色", from: [1300, 1300], to: [1270, 660], logo: "" },
];

export const FinaleScene: React.FC = () => {
  const f = useCurrentFrame();
  const lock = K.lock;
  const scatter = interpolate(f, [lock - 6, lock + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const castUp = interpolate(f, [lock, lock + 40], [0, 1], settle);
  const markIn = interpolate(f, [lock - 18, lock], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.9, 0.45) });
  const recoil = interpolate(f, [lock, lock + 2, lock + 10], [1, 1.07, 1], clamp);

  return (
    <AbsoluteFill style={{ background: "#141b2b", fontFamily: font.sans }}>
      <Img
        src={staticFile("cast/varin-cast-dark.webp")}
        style={{
          position: "absolute",
          left: 0,
          top: 444,
          width: 1920,
          height: 637,
          opacity: castUp,
          translate: `0px ${(1 - castUp) * 160}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #141b2b 0%, #141b2b 44%, rgba(20,27,43,0.55) 56%, rgba(20,27,43,0) 66%, rgba(20,27,43,0) 86%, rgba(12,16,26,0.85) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 820px 360px at 960px 250px, rgba(120,150,210,0.18) 0%, rgba(120,150,210,0) 70%)",
          opacity: rise(f, lock, 20),
        }}
      />

      {TOKENS.map((t, i) => {
        const at = K.gather + i * 6;
        const p = interpolate(f, [at, at + 24], [0, 1], settle);
        const x = t.from[0] + (t.to[0] - t.from[0]) * p;
        const y = t.from[1] + (t.to[1] - t.from[1]) * p;
        const outX = (t.to[0] - 960) * 1.6 * scatter;
        const outY = (t.to[1] - 300) * 1.6 * scatter;
        return (
          <div
            key={t.label}
            style={{
              position: "absolute",
              left: x + outX,
              top: y + outY,
              translate: "-50% -50%",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 26px",
              borderRadius: 16,
              background: "rgba(36,43,46,0.94)",
              border: "1px solid #4b6fac88",
              boxShadow: "0 0 30px rgba(75,111,172,0.25)",
              color: "#eef1ef",
              fontSize: 32,
              fontWeight: 550,
              whiteSpace: "nowrap",
              opacity: p * (1 - scatter),
            }}
          >
            {t.logo ? <Img src={staticFile(t.logo)} style={{ width: 34, height: 34, filter: t.logo.includes("codex") ? "invert(1)" : undefined }} /> : <span style={{ width: 12, height: 12, borderRadius: 6, background: "#9db6e3" }} />}
            {t.label}
          </div>
        );
      })}

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g transform={`translate(${LOCK.markX - 1400 * (1 - markIn)} ${LOCK.y - 900 * (1 - markIn)}) scale(${LOCK.markScale * recoil})`}>
          <path d={LEAD} fill="#eeeee8" />
        </g>
        <g transform={`translate(${LOCK.markX + 1400 * (1 - markIn)} ${LOCK.y + 900 * (1 - markIn)}) scale(${LOCK.markScale * recoil})`}>
          <path d={TRAIL} fill="#8e9694" />
        </g>
        <text
          x={LOCK.textX}
          y={LOCK.baseline}
          fill="#eeeee8"
          fontFamily="Inter"
          fontSize={LOCK.fontSize}
          fontWeight={600}
          letterSpacing={LOCK.letterSpacing}
          style={{ clipPath: `inset(-40% ${interpolate(f, [lock + 6, lock + 20], [100, 0], settle)}% -40% 0)` }}
        >
          Varin
        </text>
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 266,
          textAlign: "center",
          fontSize: 84,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#eeeee8",
          opacity: rise(f, lock + 18, 12),
          translate: `0px ${(1 - rise(f, lock + 18, 16)) * 22}px`,
        }}
      >
        通用 <span style={{ color: "#9db6e3" }}>Super Agent</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 384,
          textAlign: "center",
          fontSize: 36,
          fontWeight: 450,
          letterSpacing: 1,
          color: "#a3aec4",
          opacity: rise(f, lock + 32, 12),
        }}
      >
        一次关于「Agent 之上」的探索
      </div>
      <div style={{ position: "absolute", left: 120, bottom: 48, fontSize: 38, fontWeight: 500, letterSpacing: 1, color: "#d5dae4", opacity: rise(f, lock + 50, 14) }}>
        开源 · 可自部署 · 模型自选
      </div>
      <div style={{ position: "absolute", right: 120, bottom: 48, fontFamily: "Inter", fontSize: 40, fontWeight: 600, color: "#e6eaf1", opacity: rise(f, lock + 50, 14) }}>
        github.com/Astrmira/Varin
      </div>
      <AbsoluteFill style={{ background: "#ffffff", opacity: interpolate(f, [lock, lock + 1, lock + 6], [0, 0.22, 0], clamp) }} />
    </AbsoluteFill>
  );
};
