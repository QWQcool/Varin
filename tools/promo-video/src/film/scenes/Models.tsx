import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Chibi, CharId } from "../../components/Chibi";
import { color, font } from "../../theme";
import { clamp, pop, rise, settle } from "../motion";
import { C } from "../timeline";
import { Eyebrow, Headline, Mark, Sub } from "../Type";

const K = C.models;

type Model = {
  readonly name: string;
  readonly logo: string;
  readonly char?: CharId;
  readonly tint: string;
};

/** Order matches the deal: the first cards get the longest flight. */
const DECK: readonly Model[] = [
  { name: "DeepSeek", logo: "logos/provider-deepseek.svg", char: "deepseek", tint: "#e6ecfb" },
  { name: "Claude", logo: "logos/claude-orange.svg", char: "claude", tint: "#f8ebe3" },
  { name: "GPT", logo: "logos/provider-openai.svg", char: "gpt", tint: "#eeeef2" },
  { name: "Gemini", logo: "logos/provider-google.svg", char: "gemini", tint: "#eaf1fb" },
  { name: "Kimi", logo: "logos/provider-kimi-for-coding.svg", char: "kimi", tint: "#eef0f3" },
  { name: "Qwen", logo: "logos/provider-qwen.svg", char: "qwen", tint: "#ecebfa" },
  { name: "Grok", logo: "logos/grok.svg", char: "grok", tint: "#f3efe6" },
  { name: "本地模型", logo: "logos/provider-ollama.svg", tint: "#eef0ee" },
];

/** 4 x 2 grid on the right; cards land in their real slots. */
const CARD_W = 250;
const CARD_H = 300;
const GRID_X = 820;
const GRID_Y = 170;
const GAP = 24;
const slot = (i: number) => ({ x: GRID_X + (i % 4) * (CARD_W + GAP), y: GRID_Y + Math.floor(i / 4) * (CARD_H + GAP) });

const ROLES = [
  { role: "主对话", model: "Claude", i: 1 },
  { role: "规划", model: "GPT", i: 2 },
  { role: "跑腿与测试", model: "DeepSeek", i: 0 },
  { role: "记忆嵌入", model: "本地模型", i: 7 },
];

export const ModelsScene: React.FC = () => {
  const f = useCurrentFrame();
  const rolesOn = rise(f, K.roles, 18);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 1300px 900px at 1200px 520px, #f5f5f0 0%, #efefe8 60%, #e7e7df 100%)" }}>
      {DECK.map((m, i) => {
        const at = K.deal[i];
        const land = interpolate(f, [at, at + 12], [0, 1], settle);
        const s = slot(i);
        const fromX = 960 - CARD_W / 2;
        const fromY = 1180;
        const x = fromX + (s.x - fromX) * land;
        const y = fromY + (s.y - fromY) * land;
        const spin = (1 - land) * (i % 2 ? 18 : -18);
        const settleBounce = interpolate(f, [at + 12, at + 16, at + 22], [0, -6, 0], clamp);
        const chosen = ROLES.find((r) => r.i === i);
        const dim = chosen ? 1 : 1 - 0.55 * rolesOn;
        const charIn = interpolate(f, [at + 6, at + 18], [0, 1], pop);
        return (
          <div
            key={m.name}
            style={{
              position: "absolute",
              left: x,
              top: y + settleBounce,
              width: CARD_W,
              height: CARD_H,
              rotate: `${spin}deg`,
              borderRadius: 22,
              overflow: "hidden",
              background: m.tint,
              border: `1px solid ${color.line}`,
              boxShadow: `0 ${18 * land}px ${40 * land}px rgba(32,39,42,0.12)`,
              opacity: land > 0 ? dim : 0,
              outline: chosen ? `${3 * rolesOn}px solid ${color.accent}` : "none",
              outlineOffset: 3,
            }}
          >
            {m.char ? (
              <Chibi
                id={m.char}
                height={m.char === "deepseek" ? 250 : 300}
                style={{
                  left: "50%",
                  translate: `-50% ${(1 - charIn) * 70}px`,
                  top: m.char === "deepseek" ? 30 : 6,
                  filter: "none",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: "40px 40px 110px",
                  borderRadius: 18,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Img src={staticFile(m.logo)} style={{ width: 92, height: 92 }} />
              </div>
            )}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 78,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 18px",
                background: "rgba(250,250,250,0.94)",
                borderTop: `1px solid ${color.line}`,
              }}
            >
              <Img src={staticFile(m.logo)} style={{ width: 30, height: 30 }} />
              <span style={{ fontFamily: font.sans, fontSize: 27, fontWeight: 650, color: color.ink }}>{m.name}</span>
            </div>
            {chosen ? (
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: color.accent,
                  color: "#fafafa",
                  fontFamily: font.sans,
                  fontSize: 28,
                  fontWeight: 650,
                  opacity: interpolate(f, [K.roles + ROLES.indexOf(chosen) * 15, K.roles + ROLES.indexOf(chosen) * 15 + 10], [0, 1], clamp),
                  scale: interpolate(f, [K.roles + ROLES.indexOf(chosen) * 15, K.roles + ROLES.indexOf(chosen) * 15 + 14], [0.6, 1], pop),
                }}
              >
                {chosen.role}
              </div>
            ) : null}
          </div>
        );
      })}

      <Eyebrow index="03" title="模型分工" reveal={rise(f, 6)} style={{ left: 120, top: 196 }} />
      <Headline
        lines={[
          "每件事，",
          <>
            交给<Mark draw={rise(f, 60, 14)}>对的模型</Mark>。
          </>,
        ]}
        reveal={[rise(f, 16), rise(f, 30)]}
        size={78}
        style={{ left: 116, top: 246 }}
      />
      <Sub lines={["用你自己的 Key 或本地模型，", "用量按渠道和模型记账。"]} reveal={rise(f, K.roles + 30)} style={{ left: 120, top: 460 }} />
    </AbsoluteFill>
  );
};
