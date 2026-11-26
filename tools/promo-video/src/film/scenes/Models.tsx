import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { Chibi, CharId } from "../../components/Chibi";
import { color, font } from "../../theme";
import { camEase } from "../camera";
import { clamp, pop } from "../motion";
import { useSceneFrame } from "../scene";
import { C } from "../timeline";
import { Hi, Title } from "../Title";
import { PAPER } from "./Dispatch";

const K = C.models;

type Model = { readonly name: string; readonly logo: string; readonly char?: CharId; readonly tint: string };

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

const CW = 230;
const CH = 290;
const GAP = 24;
const GX = 960 - (4 * CW + 3 * GAP) / 2;
const GY = 150;
const slot = (i: number) => ({ x: GX + (i % 4) * (CW + GAP), y: GY + Math.floor(i / 4) * (CH + GAP) });

/** Which card gets which job, in the order the labels land; then where it waits beside the usage page. */
const ROLES: readonly { role: string; i: number; park: { x: number; y: number } }[] = [
  { role: "主对话", i: 1, park: { x: 96, y: 160 } },
  { role: "规划", i: 2, park: { x: 300, y: 160 } },
  { role: "跑腿与测试", i: 0, park: { x: 96, y: 410 } },
  { role: "记忆嵌入", i: 7, park: { x: 300, y: 410 } },
];
const PARK_SCALE = 0.72;

const USAGE = { x: 590, y: 150, w: 1260 };
const UK = USAGE.w / 2220;

/** Gravity drop: offset in px `t` frames after `at`. */
const drop = (f: number, at: number) => (f > at ? 3.2 * (f - at) ** 2 : 0);

export const ModelsScene: React.FC = () => {
  const f = useSceneFrame();
  const iris = interpolate(f, [-12, 0], [0, 1250], { ...clamp, easing: camEase.snap });
  const toUsage = interpolate(f, [K.usage, K.usage + 16], [0, 1], { ...clamp, easing: camEase.whip });
  const usageIn = interpolate(f, [K.usage + 4, K.usage + 20], [0, 1], { ...clamp, easing: camEase.snap });
  const floor = f > K.drop + 4 ? Math.min(1100, 6 * (f - K.drop - 4) ** 2) : 0;

  return (
    <AbsoluteFill style={{ clipPath: `circle(${iris}px at 960px 540px)`, translate: `0px ${floor}px` }}>
      <AbsoluteFill style={{ background: PAPER }} />

      <div
        style={{
          position: "absolute",
          left: USAGE.x,
          top: USAGE.y + drop(f, K.drop + 6),
          width: 2220,
          height: 1410,
          transformOrigin: "0 0",
          scale: UK,
          borderRadius: 22 / UK,
          overflow: "hidden",
          outline: `${1 / UK}px solid ${color.line}`,
          boxShadow: `0 ${50 / UK}px ${110 / UK}px rgba(32,39,42,0.18)`,
          opacity: usageIn,
          translate: `${(1 - usageIn) * 900 / UK}px 0px`,
          rotate: `${Math.min(10, drop(f, K.drop + 6) / 60)}deg`,
        }}
      >
        <Img src={staticFile("ui/usage.png")} style={{ position: "absolute", inset: 0, width: 2220, height: 1410 }} />
        <div
          style={{
            position: "absolute",
            left: 560,
            top: 520,
            width: 1530,
            height: 370,
            borderRadius: 26,
            border: `7px solid ${color.accent}`,
            opacity: interpolate(f, [K.usage + 30, K.usage + 36], [0, 1], clamp),
            scale: interpolate(f, [K.usage + 30, K.usage + 42], [1.08, 1], { ...clamp, easing: camEase.snap }),
          }}
        />
      </div>

      {DECK.map((m, i) => {
        const at = K.deal[i];
        const land = interpolate(f, [at, at + 11], [0, 1], { ...clamp, easing: camEase.snap });
        if (land <= 0) return null;
        const s = slot(i);
        const role = ROLES.find((r) => r.i === i);
        const roleAt = role ? K.roles[ROLES.indexOf(role)] : 0;
        const fromX = 960 - CW / 2;
        const fromY = 540 - CH / 2;
        let x = fromX + (s.x - fromX) * land;
        let y = fromY + (s.y - fromY) * land;
        let scale = 0.25 + 0.75 * land;
        let rot = (1 - land) * (i % 2 ? 24 : -24);
        let opacity = 1;
        if (role) {
          x += (role.park.x - s.x) * toUsage;
          y += (role.park.y - s.y) * toUsage;
          scale *= 1 + (PARK_SCALE - 1) * toUsage;
          rot += -4 * toUsage * (i % 2 ? -1 : 1);
        } else {
          const out = interpolate(f, [K.roles[0] - 4, K.roles[0] + 8], [0, 1], clamp);
          opacity = 1 - 0.6 * out - 0.4 * toUsage;
          y += toUsage * 700;
          rot += toUsage * (i % 2 ? 30 : -30);
        }
        y += drop(f, K.drop + (i % 4));
        rot += Math.min(40, drop(f, K.drop + (i % 4)) / 20) * (i % 2 ? 1 : -1);
        const bounce = interpolate(f, [at + 11, at + 14, at + 19], [0, -8, 0], clamp);
        const charIn = interpolate(f, [at + 4, at + 14], [0, 1], pop);
        const tag = role ? interpolate(f, [roleAt, roleAt + 9], [0, 1], pop) : 0;
        return (
          <div
            key={m.name}
            style={{
              position: "absolute",
              left: x,
              top: y + bounce,
              width: CW,
              height: CH,
              transformOrigin: "0 0",
              scale,
              rotate: `${rot}deg`,
              borderRadius: 22,
              overflow: "hidden",
              background: m.tint,
              border: `1px solid ${color.line}`,
              boxShadow: `0 18px 40px rgba(32,39,42,0.14)`,
              opacity,
              outline: role ? `${4 * tag}px solid ${color.accent}` : "none",
              outlineOffset: 3,
            }}
          >
            {m.char ? (
              <Chibi id={m.char} height={m.char === "deepseek" ? 240 : 290} style={{ left: "50%", translate: `-50% ${(1 - charIn) * 70}px`, top: m.char === "deepseek" ? 26 : 4, filter: "none" }} />
            ) : (
              <div style={{ position: "absolute", inset: "36px 36px 104px", borderRadius: 18, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Img src={staticFile(m.logo)} style={{ width: 86, height: 86 }} />
              </div>
            )}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 72, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", background: "rgba(250,250,250,0.95)", borderTop: `1px solid ${color.line}` }}>
              <Img src={staticFile(m.logo)} style={{ width: 28, height: 28 }} />
              <span style={{ fontFamily: font.sans, fontSize: 26, fontWeight: 700, color: color.ink }}>{m.name}</span>
            </div>
            {role ? (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  top: 10,
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: color.accent,
                  color: "#fafafa",
                  fontFamily: font.sans,
                  fontSize: 30,
                  fontWeight: 700,
                  opacity: Math.min(1, tag * 2),
                  scale: 0.5 + 0.5 * tag,
                  transformOrigin: "0 0",
                }}
              >
                {role.role}
              </div>
            ) : null}
          </div>
        );
      })}

      <div style={{ translate: `0px ${drop(f, K.drop + 2)}px`, position: "absolute", inset: 0 }}>
        <Title
          f={f}
          at={24}
          out={K.usage - 6}
          gone={K.usage - 6}
          index="03"
          title="模型分工"
          lines={[
            "每件事，",
            <>
              交给<Hi>对的模型</Hi>。
            </>,
          ]}
        />
        <Title
          f={f}
          at={K.usage + 16}
          out={1e9}
          index="03"
          title="模型分工"
          lines={[
            <>
              用你自己的 <Hi>Key</Hi>，或本地模型。
            </>,
          ]}
          size={54}
          sub="用量按渠道和模型记账。"
        />
      </div>
    </AbsoluteFill>
  );
};
