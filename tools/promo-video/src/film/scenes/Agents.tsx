import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { AppWindow } from "../../components/AppWindow";
import { Chibi, CharId } from "../../components/Chibi";
import { color, font } from "../../theme";
import { clamp, pop, rise, settle } from "../motion";
import { C } from "../timeline";
import { Eyebrow, Headline, Mark, Sub } from "../Type";

const K = C.agents;
const UI = { x: 820, y: 150, w: 1000, h: 635 };

type Status = "running" | "done" | "waiting";
const STATUS: Record<Status, { label: string; fg: string; bg: string }> = {
  running: { label: "进行中", fg: color.accent, bg: "rgba(75,111,172,0.10)" },
  done: { label: "已完成", fg: color.success, bg: "rgba(95,141,61,0.12)" },
  waiting: { label: "等你确认", fg: "#8d6c15", bg: "rgba(141,108,21,0.12)" },
};

type Mate = {
  readonly logo: string;
  readonly logoFilter?: string;
  readonly name: string;
  readonly by?: string;
  readonly role: string;
  readonly task: string;
  readonly char: CharId;
  readonly final: Status;
  readonly anchor: { x: number; y: number };
};

const MATES: readonly Mate[] = [
  {
    logo: "logos/deepseek-harness.svg",
    name: "DeepSeek Harness",
    role: "测试",
    task: "回归测试 · 418 通过",
    char: "deepseek",
    final: "done",
    anchor: { x: UI.x + 120, y: UI.y + 210 },
  },
  {
    logo: "logos/codex.svg",
    name: "Codex",
    by: "by OpenAI",
    role: "后端",
    task: "auth 会话接口重构",
    char: "gpt",
    final: "running",
    anchor: { x: UI.x + 120, y: UI.y + 260 },
  },
  {
    logo: "logos/claude-orange.svg",
    name: "Claude Code",
    role: "前端",
    task: "登录页重设计",
    char: "claude",
    final: "waiting",
    anchor: { x: UI.x + 120, y: UI.y + 310 },
  },
];

const CARD = { x: 290, w: 500, h: 112, gap: 44, top: 548 };

const MateCard: React.FC<{ readonly mate: Mate; readonly status: Status; readonly flash: number; readonly style: React.CSSProperties }> = ({
  mate,
  status,
  flash,
  style,
}) => {
  const s = STATUS[status];
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        gap: 16,
        width: CARD.w,
        height: CARD.h,
        padding: "0 18px",
        boxSizing: "border-box",
        borderRadius: 18,
        background: color.surface,
        border: `1px solid ${color.line}`,
        boxShadow: `0 18px 40px rgba(32,39,42,0.10), 0 0 0 ${2 * flash}px ${s.fg}`,
        ...style,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "#f1f1ec",
          border: `1px solid ${color.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Img src={staticFile(mate.logo)} style={{ width: 32, height: 32, filter: mate.logoFilter }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: font.sans, fontSize: 28, fontWeight: 650, color: color.ink, letterSpacing: -0.3 }}>{mate.name}</span>
          {mate.by ? <span style={{ fontFamily: "Inter", fontSize: 20, color: color.slate }}>{mate.by}</span> : null}
        </div>
        <div style={{ fontFamily: font.sans, fontSize: 24, color: color.muted, whiteSpace: "nowrap" }}>{mate.task}</div>
      </div>
      <div
        style={{
          padding: "6px 13px",
          borderRadius: 999,
          background: s.bg,
          color: s.fg,
          fontFamily: font.sans,
          fontSize: 23,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {s.label}
      </div>
    </div>
  );
};

export const AgentsScene: React.FC = () => {
  const f = useCurrentFrame();
  const enter = rise(f, K.open, 24);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 1300px 900px at 1100px 520px, #f5f5f0 0%, #efefe8 60%, #e7e7df 100%)" }}>
      <AppWindow
        src="ui/readme-varin-zh.png"
        width={UI.w}
        height={UI.h}
        style={{
          left: UI.x,
          top: UI.y,
          opacity: enter,
          translate: `${(1 - enter) * 120}px 0px`,
          scale: interpolate(f, [K.result, K.result + 40], [1, 1.04], settle),
          transformOrigin: "20% 40%",
        }}
      />

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {MATES.map((m, i) => {
          const y = CARD.top + i * (CARD.h + CARD.gap) + CARD.h / 2;
          const x = CARD.x + CARD.w;
          const d = `M ${x} ${y} C ${x + 90} ${y}, ${m.anchor.x - 120} ${m.anchor.y}, ${m.anchor.x} ${m.anchor.y}`;
          const draw = rise(f, K.card[i] + 6, 18);
          return (
            <g key={i}>
              <path d={d} stroke="rgba(75,111,172,0.18)" strokeWidth={7} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
              <path d={d} stroke={color.accent} strokeWidth={2.4} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
              <circle cx={m.anchor.x} cy={m.anchor.y} r={6 * draw} fill={color.accent} />
            </g>
          );
        })}
      </svg>

      {MATES.map((m, i) => {
        const land = interpolate(f, [K.card[i], K.card[i] + 16], [0, 1], pop);
        const top = CARD.top + i * (CARD.h + CARD.gap);
        const charIn = interpolate(f, [K.char[i], K.char[i] + 14], [0, 1], pop);
        const at = K.status[i];
        const status: Status = f >= at ? m.final : "running";
        const flash = interpolate(f, [at, at + 3, at + 16], [0, 1, 0], clamp);
        const bob = f >= at ? Math.sin(((f - at) / 15) * Math.PI) * Math.exp(-(f - at) / 12) * 14 : 0;
        const charH = m.char === "deepseek" ? 128 : 144;
        return (
          <React.Fragment key={m.name}>
            <div
              style={{
                position: "absolute",
                left: CARD.x - 196,
                top: top + CARD.h + 4 - charH,
                width: 190,
                height: charH,
                overflow: "hidden",
                maskImage: "linear-gradient(180deg, #000 70%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(180deg, #000 70%, transparent 100%)",
                clipPath: `inset(0 0 ${(1 - charIn) * 100}% 0)`,
              }}
            >
              <Chibi
                id={m.char}
                height={charH * 1.8}
                style={{
                  left: m.char === "deepseek" ? 22 : 9,
                  top: (1 - charIn) * charH * 0.7 - bob,
                }}
              />
            </div>
            <MateCard
              mate={m}
              status={status}
              flash={flash}
              style={{
                left: CARD.x,
                top,
                opacity: Math.min(1, land * 1.4),
                translate: `${(1 - land) * 340}px ${(1 - land) * -60}px`,
                scale: 0.85 + 0.15 * land,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: CARD.x + 86,
                top: top - 19,
                padding: "3px 14px",
                borderRadius: 999,
                background: color.ink,
                color: color.paper,
                fontFamily: font.sans,
                fontSize: 24,
                fontWeight: 650,
                opacity: charIn,
                scale: charIn,
              }}
            >
              {m.role}
            </div>
          </React.Fragment>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: UI.x + 96,
          top: UI.y + 380,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 18px",
          borderRadius: 14,
          background: "#ffffff",
          border: `1px solid ${color.line}`,
          boxShadow: "0 14px 34px rgba(32,39,42,0.14)",
          fontFamily: font.sans,
          fontSize: 30,
          fontWeight: 550,
          color: color.ink,
          opacity: rise(f, K.result, 12),
          translate: `0px ${(1 - rise(f, K.result, 16)) * 18}px`,
        }}
      >
        <span style={{ width: 26, height: 26, borderRadius: 13, background: "rgba(95,141,61,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={16} height={16} viewBox="0 0 18 18">
            <path d="M4 9.5 L7.5 13 L14 5.5" stroke={color.success} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        测试已通过 · 接口补丁就绪 · 页面等你看一眼
      </div>

      <Eyebrow index="01" title="调度 Agent" reveal={rise(f, K.title)} style={{ left: 120, top: 150 }} />
      <Headline
        lines={[
          "你的 Agent，",
          <>
            变成它的<Mark draw={rise(f, K.title + 40, 14)}>队友</Mark>。
          </>,
        ]}
        reveal={[rise(f, K.title + 10), rise(f, K.title + 24)]}
        style={{ left: 116, top: 200 }}
      />
      <Sub lines={["测试、后端、前端，", "各交给最擅长的那一个。"]} reveal={rise(f, K.title + 60)} style={{ left: 120, top: 410 }} />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 46,
          textAlign: "center",
          fontFamily: font.sans,
          fontSize: 32,
          fontWeight: 500,
          color: color.slate,
          letterSpacing: 1,
          opacity: rise(f, K.roster, 14),
        }}
      >
        Codex · Claude Code · Pi · DeepSeek Harness · Gemini CLI · Kimi Code …… 共 20 种外部 Agent
      </div>
    </AbsoluteFill>
  );
};
