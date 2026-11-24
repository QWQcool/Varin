import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { color, font } from "../../theme";
import { clamp, pop, rise } from "../motion";
import { C } from "../timeline";
import { Eyebrow, Headline, Mark } from "../Type";

const K = C.bots;

/** Varin plus the 15 built-in Bot characters (packages/ui/src/workbenches/bot/figurePresets). */
const CAST = ["claude", "deepseek", "gemini", "glm", "gpt", "grok", "jev", "kimi", "llama", "minimax", "mistral", "perplexity", "qwen", "seed", "wenxin"];
const VARIN = 140;
const SIZE = 100;

const Bubble: React.FC<{ readonly avatar: string; readonly name: string; readonly text: React.ReactNode; readonly at: number; readonly f: number; readonly self?: boolean }> = ({
  avatar,
  name,
  text,
  at,
  f,
  self,
}) => {
  const on = rise(f, at, 12);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: self ? "row-reverse" : "row",
        alignItems: "flex-start",
        gap: 14,
        opacity: on,
        translate: `0px ${(1 - on) * 18}px`,
      }}
    >
      {self ? (
        <div style={{ width: 52, height: 52, borderRadius: 26, background: color.ink, color: color.paper, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 650 }}>你</div>
      ) : (
        <Img src={staticFile(avatar)} style={{ width: 52, height: 52, borderRadius: 26, background: "#ffffff", border: `1px solid ${color.line}` }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: self ? "flex-end" : "flex-start" }}>
        {self ? null : <div style={{ fontSize: 22, color: color.muted, fontWeight: 550 }}>{name}</div>}
        <div
          style={{
            maxWidth: 600,
            padding: "12px 20px",
            borderRadius: 16,
            background: self ? color.accent : "#ffffff",
            color: self ? "#fafafa" : color.text,
            border: self ? "none" : `1px solid ${color.line}`,
            fontSize: 28,
            lineHeight: 1.45,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export const BotsScene: React.FC = () => {
  const f = useCurrentFrame();
  const panelOn = rise(f, K.chat - 10, 16);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 1300px 900px at 960px 620px, #f5f5f0 0%, #efefe8 60%, #e7e7df 100%)", fontFamily: font.sans }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, display: "flex", justifyContent: "center", gap: 10 }}>
        {CAST.map((id, i) => {
          const at = K.rise + i * 4 + (i % 3) * 2;
          const up = interpolate(f, [at, at + 14], [0, 1], pop);
          const hop = interpolate(f, [K.chat + 30 + (i % 5) * 6, K.chat + 36 + (i % 5) * 6, K.chat + 44 + (i % 5) * 6], [0, -10, 0], clamp);
          return (
            <Img
              key={id}
              src={staticFile(`bots/${id}.webp`)}
              style={{
                width: SIZE,
                height: SIZE,
                borderRadius: 24,
                background: "#ffffff",
                border: `1px solid ${color.line}`,
                boxShadow: "0 10px 24px rgba(32,39,42,0.10)",
                opacity: Math.min(1, up * 1.5),
                translate: `0px ${(1 - up) * 160 + hop}px`,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 960 - VARIN / 2,
          top: 1080 - 40 - SIZE - 24 - VARIN,
          width: VARIN,
          height: VARIN,
          borderRadius: 32,
          overflow: "hidden",
          background: "#ffffff",
          border: `3px solid ${color.accent}`,
          boxSizing: "border-box",
          boxShadow: `0 14px 36px ${color.accentGlow}`,
          opacity: rise(f, K.varin, 8),
          scale: interpolate(f, [K.varin, K.varin + 16], [0.4, 1], pop),
          translate: `0px ${(1 - rise(f, K.varin, 16)) * 60}px`,
        }}
      >
        <Img src={staticFile("bots/varin.png")} style={{ position: "absolute", width: 318, height: 318, left: -93, top: -12 }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 960 + VARIN / 2 + 16,
          top: 1080 - 40 - SIZE - 24 - VARIN / 2 - 22,
          padding: "6px 16px",
          borderRadius: 999,
          background: color.accent,
          color: "#fafafa",
          fontSize: 26,
          fontWeight: 650,
          opacity: rise(f, K.varin + 12, 10),
        }}
      >
        Varin
      </div>

      <div
        style={{
          position: "absolute",
          left: 1000,
          top: 130,
          width: 800,
          padding: "26px 30px",
          boxSizing: "border-box",
          borderRadius: 22,
          background: "rgba(250,250,250,0.92)",
          border: `1px solid ${color.line}`,
          boxShadow: "0 30px 70px rgba(32,39,42,0.12)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          opacity: panelOn,
          translate: `0px ${(1 - panelOn) * 30}px`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 650, color: color.ink, paddingBottom: 12, borderBottom: `1px solid ${color.line}` }}>
          # 发布小组
          <span style={{ fontSize: 19, fontWeight: 450, color: color.muted }}>4 位成员</span>
        </div>
        <Bubble
          self
          avatar=""
          name="你"
          f={f}
          at={K.chat}
          text={
            <>
              <span style={{ fontWeight: 650 }}>@Claude</span> 写一版发布海报文案，<span style={{ fontWeight: 650 }}>@DeepSeek</span> 把反馈里的问题列出来
            </>
          }
        />
        <Bubble avatar="bots/claude.webp" name="Claude" f={f} at={K.chat + 45} text="收到，先给你两种语气。" />
        <Bubble avatar="bots/deepseek.webp" name="DeepSeek" f={f} at={K.chat + 75} text="整理好了：高频问题 5 条，附原帖链接。" />
      </div>

      <Eyebrow index="07" title="Bot 群聊" reveal={rise(f, 4)} style={{ left: 120, top: 196 }} />
      <Headline
        lines={[
          "再给它配一群",
          <>
            会<Mark draw={rise(f, 50, 14)}>协作</Mark>的 Bot。
          </>,
        ]}
        reveal={[rise(f, 14), rise(f, 28)]}
        size={74}
        style={{ left: 116, top: 246 }}
      />
      <div style={{ position: "absolute", left: 120, top: 450, fontSize: 34, color: color.muted, lineHeight: 1.5, opacity: rise(f, 60) }}>
        <div>16 个内置角色，</div>
        <div>各有记忆、模型和日程。</div>
      </div>
    </AbsoluteFill>
  );
};
