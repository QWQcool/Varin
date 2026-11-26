import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { color, font } from "../../theme";
import { camEase } from "../camera";
import { clamp, pop, rise } from "../motion";
import { useSceneFrame } from "../scene";
import { C } from "../timeline";
import { Hi, Title } from "../Title";
import { PAPER } from "./Dispatch";

const K = C.bots;

/** The 15 built-in Bot characters (packages/ui/src/workbenches/bot/figurePresets) plus Varin. */
const CAST = ["claude", "deepseek", "gemini", "glm", "gpt", "grok", "jev", "kimi", "llama", "minimax", "mistral", "perplexity", "qwen", "seed", "wenxin"];
const SIZE = 104;
const ROW_Y = 948;
const ROW_GAP = 14;
const ROW_X0 = 960 - (CAST.length * SIZE + (CAST.length - 1) * ROW_GAP) / 2;

/** Burst positions: a ring around the centre, alternating radii, deterministic. */
const burst = CAST.map((_, i) => {
  const a = (i / CAST.length) * Math.PI * 2 - Math.PI / 2 + 0.2;
  const r = i % 2 ? 330 : 440;
  return { x: 960 + Math.cos(a) * r * 1.45, y: 540 + Math.sin(a) * r * 0.86, rot: ((i * 37) % 30) - 15 };
});

export const VARIN_AT = { x: 390, y: 640 };
const VARIN = 190;

const SPEAK: Record<string, number> = { claude: K.chat[1], deepseek: K.chat[2], gemini: K.chat[3] };

const Bubble: React.FC<{ readonly f: number; readonly at: number; readonly avatar?: string; readonly name?: string; readonly children: React.ReactNode }> = ({ f, at, avatar, name, children }) => {
  const on = interpolate(f, [at, at + 8], [0, 1], { ...clamp, easing: camEase.snap });
  const self = !avatar;
  return (
    <div style={{ display: "flex", flexDirection: self ? "row-reverse" : "row", alignItems: "flex-start", gap: 14, opacity: Math.min(1, on * 1.6), translate: `${(1 - on) * (self ? 60 : -60)}px ${(1 - on) * 20}px`, scale: 0.9 + 0.1 * on, transformOrigin: self ? "right top" : "left top" }}>
      {self ? (
        <div style={{ width: 54, height: 54, borderRadius: 27, background: color.ink, color: color.paper, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>你</div>
      ) : (
        <Img src={staticFile(avatar)} style={{ width: 54, height: 54, borderRadius: 27, background: "#ffffff", border: `1px solid ${color.line}`, flexShrink: 0 }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: self ? "flex-end" : "flex-start" }}>
        {name ? <div style={{ fontSize: 21, color: color.muted, fontWeight: 600 }}>{name}</div> : null}
        <div style={{ maxWidth: 620, padding: "12px 20px", borderRadius: 18, background: self ? color.accent : "#ffffff", color: self ? "#fafafa" : color.text, border: self ? "none" : `1px solid ${color.line}`, fontSize: 28, lineHeight: 1.42 }}>{children}</div>
      </div>
    </div>
  );
};

export const BotsScene: React.FC = () => {
  const f = useSceneFrame();
  const enter = interpolate(f, [-10, 0], [0, 1], clamp);
  const toRow = (i: number) => interpolate(f, [K.row + (i % 5) * 2, K.row + (i % 5) * 2 + 14], [0, 1], { ...clamp, easing: camEase.whip });
  const shock = interpolate(f, [K.varin, K.varin + 18], [0, 1], clamp);
  const push = 1 + 0.18 * interpolate(f, [K.push, 238], [0, 1], { ...clamp, easing: (t) => t * t });
  /** Varin's own frame opens into the finale's navy stage. */
  const stage = interpolate(f, [K.push + 4, 232], [0, 1], { ...clamp, easing: camEase.whip });
  const shakeX = f >= K.varin && f < K.varin + 10 ? Math.sin(f * 3.1) * (10 - (f - K.varin)) * 1.6 : 0;

  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden", opacity: enter }}>
      <AbsoluteFill style={{ transformOrigin: `${VARIN_AT.x}px ${VARIN_AT.y}px`, scale: push * (1.15 - 0.15 * enter), translate: `${shakeX}px 0px` }}>
        {CAST.map((id, i) => {
          const at = K.burst + i * 2;
          const out = interpolate(f, [at, at + 12], [0, 1], pop);
          if (out <= 0) return null;
          const b = burst[i];
          const kick = 1 + 0.12 * Math.sin(Math.min(1, shock) * Math.PI) * (f >= K.varin ? 1 : 0);
          const bx = 960 + (b.x - 960) * out * kick;
          const by = 540 + (b.y - 540) * out * kick;
          const r = toRow(i);
          const rx = ROW_X0 + i * (SIZE + ROW_GAP) + SIZE / 2;
          const x = bx + (rx - bx) * r;
          const y = by + (ROW_Y - by) * r;
          const speak = SPEAK[id];
          const hop = speak !== undefined && f >= speak ? Math.sin(((f - speak) / 10) * Math.PI) * Math.exp(-(f - speak) / 8) * 34 : 0;
          const wave = f > K.chat[0] ? Math.sin((f - K.chat[0]) / 6 - i * 0.6) * 3 : 0;
          const size = SIZE * (1.25 - 0.25 * r);
          return (
            <Img
              key={id}
              src={staticFile(`bots/${id}.webp`)}
              style={{
                position: "absolute",
                left: x - size / 2,
                top: y - size / 2 - hop - wave,
                width: size,
                height: size,
                borderRadius: 26,
                background: "#ffffff",
                border: `2px solid ${speak !== undefined && f >= speak && f < speak + 20 ? color.accent : color.line}`,
                boxShadow: "0 12px 26px rgba(32,39,42,0.14)",
                rotate: `${b.rot * (1 - r) * out}deg`,
                scale: Math.min(1, out * 1.2),
              }}
            />
          );
        })}

        <div style={{ position: "absolute", left: 960, top: 540, width: 2, height: 2, borderRadius: 999, boxShadow: `0 0 0 ${shock * 700}px rgba(75,111,172,${0.25 * (1 - shock)})`, opacity: f >= K.varin ? 1 : 0 }} />

        {(() => {
          const on = interpolate(f, [K.varin, K.varin + 10], [0, 1], { ...clamp, easing: camEase.snap });
          if (on <= 0) return null;
          const m = toRow(7);
          const x = 960 + (VARIN_AT.x - 960) * m;
          const y = 540 + (VARIN_AT.y - 540) * m;
          return (
            <>
              <div
                style={{
                  position: "absolute",
                  left: x - VARIN / 2,
                  top: y - VARIN / 2,
                  width: VARIN,
                  height: VARIN,
                  borderRadius: 44,
                  overflow: "hidden",
                  background: "#ffffff",
                  border: `5px solid ${color.accent}`,
                  boxSizing: "border-box",
                  boxShadow: `0 20px 50px ${color.accentGlow}`,
                  scale: interpolate(f, [K.varin, K.varin + 6, K.varin + 12], [2.4, 0.92, 1], clamp),
                  opacity: Math.min(1, on * 2),
                }}
              >
                <Img src={staticFile("bots/varin.png")} style={{ position: "absolute", width: 430, height: 430, left: -126, top: -16 }} />
              </div>
              <div style={{ position: "absolute", left: x - 60, top: y + VARIN / 2 + 12, width: 120, textAlign: "center", fontFamily: "Inter", fontSize: 32, fontWeight: 700, color: color.accent, opacity: rise(f, K.varin + 8, 8) }}>Varin</div>
            </>
          );
        })()}

        <div
          style={{
            position: "absolute",
            left: 860,
            top: 96,
            width: 960,
            padding: "24px 30px",
            boxSizing: "border-box",
            borderRadius: 24,
            background: "rgba(250,250,250,0.95)",
            border: `1px solid ${color.line}`,
            boxShadow: "0 30px 70px rgba(32,39,42,0.14)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            fontFamily: font.sans,
            opacity: rise(f, K.chat[0] - 10, 8),
            translate: `${(1 - rise(f, K.chat[0] - 10, 12)) * 120}px 0px`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 700, color: color.ink, paddingBottom: 12, borderBottom: `1px solid ${color.line}` }}>
            # 发布小组
            <span style={{ fontSize: 20, fontWeight: 450, color: color.muted }}>Varin · Claude · DeepSeek · Gemini</span>
          </div>
          <Bubble f={f} at={K.chat[0]}>
            <b>@Claude</b> 写版海报文案，<b>@DeepSeek</b> 把反馈问题列出来，<b>@Gemini</b> 出三张草图
          </Bubble>
          <Bubble f={f} at={K.chat[1]} avatar="bots/claude.webp" name="Claude">
            收到，先给你两种语气。
          </Bubble>
          <Bubble f={f} at={K.chat[2]} avatar="bots/deepseek.webp" name="DeepSeek">
            整理好了：高频问题 5 条，附原帖链接。
          </Bubble>
          <Bubble f={f} at={K.chat[3]} avatar="bots/gemini.webp" name="Gemini">
            三张草图在画，按 Claude 的文案配。
          </Bubble>
        </div>
      </AbsoluteFill>

      <Title
        f={f}
        at={K.varin + 4}
        out={1e9}
        corner="tl"
        index="07"
        title="Bot 群聊"
        lines={[
          "再给它配一群",
          <>
            会<Hi>协作</Hi>的 Bot。
          </>,
        ]}
        size={60}
        sub="16 个内置角色，各有记忆、模型和日程。"
      />

      {stage > 0 ? (
        <div
          style={{
            position: "absolute",
            left: (VARIN_AT.x - VARIN / 2) * (1 - stage) - 40 * stage,
            top: (VARIN_AT.y - VARIN / 2) * (1 - stage) - 40 * stage,
            width: VARIN + (2000 - VARIN) * stage,
            height: VARIN + (1160 - VARIN) * stage,
            borderRadius: 44 * (1 - stage),
            background: "#141b2b",
            border: `${5 * (1 - stage)}px solid ${color.accent}`,
            boxSizing: "border-box",
            opacity: interpolate(f, [K.push + 4, K.push + 8], [0, 1], clamp),
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
