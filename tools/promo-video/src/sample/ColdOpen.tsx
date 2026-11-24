import React from "react";
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { TerminalLine, TerminalWindow } from "../components/TerminalWindow";
import { Pt, quadLength, quadPoint } from "../lib/geometry";
import { color, font } from "../theme";
import { T } from "./timeline";

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const printed = (frame: number, at: number) => interpolate(frame, [at, at + 6], [0, 1], { ...clamp, easing: ease });

const NODE: Pt = { x: 905, y: 505 };
const LINKS = [
  { to: { x: 790, y: 336 }, bend: 0, chip: "按 y 确认", phase: 0 },
  { to: { x: 1130, y: 372 }, bend: 0, chip: "开新会话", phase: 2.1 },
  { to: { x: 1060, y: 724 }, bend: 60, chip: "重新登录", phase: 4.2 },
].map((link) => {
  const control = { x: (NODE.x + link.to.x) / 2 + link.bend, y: (NODE.y + link.to.y) / 2 - 40 };
  return { ...link, control, length: quadLength(NODE, control, link.to) };
});

/** Bars 1-2: the viewer is addressed directly. */
const Sentence: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const chars = Array.from(T.sentence);
  const typed = Math.max(0, Math.min(chars.length, Math.floor((frame - T.typeStart) / T.typeStep) + 1));
  const typing = typed < chars.length;
  const cursorOn = typing || frame % 15 < 9;
  const agentStart = T.sentence.indexOf("Agent");
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: interpolate(frame, [T.sentenceOut, T.sentenceOut + 15], [1, 0], clamp),
        translate: `0px ${interpolate(frame, [T.sentenceOut, T.sentenceOut + 15], [0, -40], { ...clamp, easing: Easing.in(Easing.quad) })}px`,
      }}
    >
      <div style={{ fontFamily: font.sans, fontSize: 92, fontWeight: 700, color: color.nightText, letterSpacing: 1, display: "flex", alignItems: "center" }}>
        {chars.slice(0, typed).map((ch, i) => (
          <span key={i} style={{ color: i >= agentStart && i < agentStart + 5 ? "#9db6e3" : undefined, whiteSpace: "pre" }}>
            {ch}
          </span>
        ))}
        <span style={{ width: 7, height: 96, marginLeft: 10, borderRadius: 3, background: "#7fa2dd", opacity: cursorOn ? 1 : 0 }} />
      </div>
    </div>
  );
};

/** Bars 3-6: three agents work, then each stalls on something only the viewer can unblock. */
const Sessions: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const [dsIn, cxIn, clIn] = T.termIn;
  const [dsStall, cxStall, clStall] = T.stall;
  const alert = (at: number) => interpolate(frame, [at, at + 3, at + 18], [0, 1, 0.25], clamp);

  const ds: TerminalLine[] = [
    { text: "› 跑一遍回归测试", reveal: printed(frame, dsIn + 6) },
    { text: "  running 418 tests …", tone: "dim", reveal: printed(frame, dsIn + 18) },
    { text: "✗ 3 failed · auth.spec.ts", tone: "error", reveal: printed(frame, dsStall) },
    { text: "? 允许执行 npm install？(y/n) █", tone: "prompt", reveal: printed(frame, dsStall + 4) },
  ];
  const cx: TerminalLine[] = [
    { text: "› 重构 auth 会话接口", reveal: printed(frame, cxIn + 6) },
    { text: "✓ 读取 12 个文件", tone: "done", reveal: printed(frame, cxIn + 18) },
    { text: "✓ 修改 server/auth/session.ts", tone: "done", reveal: printed(frame, cxIn + 30) },
    { text: "⚠ 上下文已用 96%，正在压缩…", tone: "warn", reveal: printed(frame, cxStall) },
  ];
  const cl: TerminalLine[] = [
    { text: "› 重做登录页面 UI", reveal: printed(frame, clIn + 6) },
    { text: "✓ 生成 LoginPage.tsx · 3 个组件", tone: "done", reveal: printed(frame, clIn + 20) },
    { text: "✗ 会话已断开，请重新登录", tone: "error", reveal: printed(frame, clStall) },
  ];

  return (
    <>
      <TerminalWindow
        logo="logos/deepseek-harness.svg"
        name="DeepSeek Harness"
        status={frame >= dsStall ? "等你确认" : "运行中"}
        statusTone={frame >= dsStall ? "prompt" : "run"}
        alert={alert(dsStall)}
        width={640}
        lines={ds}
        style={{
          left: 150,
          top: 104,
          opacity: interpolate(frame, [dsIn, dsIn + 10], [0, 1], clamp),
          translate: `${interpolate(frame, [dsIn, dsIn + 20], [-90, 0], { ...clamp, easing: ease })}px 0px`,
        }}
      />
      <TerminalWindow
        logo="logos/codex.svg"
        logoFilter="invert(1)"
        name="Codex"
        status={frame >= cxStall ? "上下文将满" : "运行中"}
        statusTone={frame >= cxStall ? "warn" : "run"}
        alert={alert(cxStall)}
        width={640}
        lines={cx}
        style={{
          left: 1130,
          top: 140,
          opacity: interpolate(frame, [cxIn, cxIn + 10], [0, 1], clamp),
          translate: `${interpolate(frame, [cxIn, cxIn + 20], [90, 0], { ...clamp, easing: ease })}px 0px`,
        }}
      />
      <TerminalWindow
        logo="logos/claude-white.svg"
        name="Claude Code"
        status={frame >= clStall ? "已断开" : "运行中"}
        statusTone={frame >= clStall ? "error" : "run"}
        alert={alert(clStall)}
        width={640}
        lines={cl}
        style={{
          left: 1060,
          top: 532,
          opacity: interpolate(frame, [clIn, clIn + 10], [0, 1], clamp),
          translate: `0px ${interpolate(frame, [clIn, clIn + 20], [90, 0], { ...clamp, easing: ease })}px`,
        }}
      />
    </>
  );
};

/** Bar 6: the viewer becomes the node every stalled session routes through. */
const Thread: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const draw = interpolate(frame, [T.nodeIn, T.nodeIn + 24], [0, 1], { ...clamp, easing: ease });
  const nodeScale = interpolate(frame, [T.nodeIn, T.nodeIn + 14], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const sinceBeat = (frame - T.nodeIn) % 15;
  const pulse = frame >= T.nodeIn ? 1 + 0.22 * Math.exp(-sinceBeat / 4) : 1;

  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor="rgba(120,160,230,0.55)" />
            <stop offset="100%" stopColor="rgba(75,111,172,0)" />
          </radialGradient>
        </defs>
        {LINKS.map((link, i) => {
          const d = `M ${NODE.x} ${NODE.y} Q ${link.control.x} ${link.control.y} ${link.to.x} ${link.to.y}`;
          return (
            <g key={i}>
              <path
                d={d}
                stroke="rgba(120,160,230,0.2)"
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={link.length}
                strokeDashoffset={link.length * (1 - draw)}
              />
              <path
                d={d}
                stroke="#7fa2dd"
                strokeWidth={2.4}
                strokeDasharray="2 11"
                fill="none"
                strokeLinecap="round"
                opacity={interpolate(frame, [T.nodeIn + 14, T.nodeIn + 24], [0, 1], clamp)}
              />
              <circle cx={link.to.x} cy={link.to.y} r={6 * draw} fill="#7fa2dd" />
            </g>
          );
        })}
        <g style={{ scale: nodeScale, transformOrigin: `${NODE.x}px ${NODE.y}px` }}>
          <circle cx={NODE.x} cy={NODE.y} r={110} fill="url(#nodeGlow)" />
          <circle cx={NODE.x} cy={NODE.y} r={54 * pulse} fill="none" stroke="rgba(127,162,221,0.25)" strokeWidth={1.5} />
          <circle cx={NODE.x} cy={NODE.y} r={32} fill="none" stroke="rgba(127,162,221,0.45)" strokeWidth={1.5} />
          <circle cx={NODE.x} cy={NODE.y} r={15} fill="#7fa2dd" />
        </g>
      </svg>

      {LINKS.map((link, i) => {
        const start = T.nodeIn + 12 + i * 8;
        const t = 0.5 + 0.13 * Math.sin(((frame - start) / 30) * 2 * Math.PI + link.phase);
        const at = quadPoint(NODE, link.control, link.to, t);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: at.x,
              top: at.y,
              translate: "-50% -50%",
              padding: "6px 14px",
              borderRadius: 999,
              background: "#2a3236",
              border: "1px solid #3d474b",
              color: "#c9d6ee",
              fontFamily: font.sans,
              fontSize: 21,
              fontWeight: 500,
              whiteSpace: "nowrap",
              opacity: interpolate(frame, [start, start + 8], [0, 1], clamp),
            }}
          >
            {link.chip}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: NODE.x,
          top: NODE.y + 70,
          translate: "-50% 0",
          color: color.nightText,
          fontFamily: font.sans,
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: 2,
          opacity: interpolate(frame, [T.nodeIn + 6, T.nodeIn + 14], [0, 1], clamp),
        }}
      >
        你
      </div>
    </>
  );
};

export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const [h1, h2] = T.headline;
  const [dsIn, cxIn, clIn] = T.termIn;

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse 1100px 760px at 900px 470px, #262e31 0%, #1a1f22 55%, #121618 100%)",
        fontFamily: font.sans,
      }}
    >
      <Sentence frame={frame} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "960px 540px",
          scale: interpolate(frame, [T.impact - 3, T.impact + 7], [1, 0.12], { ...clamp, easing: Easing.in(Easing.cubic) }),
          opacity: interpolate(frame, [T.impact + 1, T.impact + 8], [1, 0], clamp),
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${NODE.x}px ${NODE.y}px`,
            scale: interpolate(frame, [dsIn, T.silence], [1, 1.06], { ...clamp, easing: Easing.inOut(Easing.quad) }),
          }}
        >
          <Sessions frame={frame} />
          <Thread frame={frame} />
        </div>
      </div>

      <Interactive.Div
        name="Workflow caption"
        style={{
          position: "absolute",
          left: 120,
          top: 820,
          fontSize: 58,
          fontWeight: 600,
          color: "#c8ceca",
          letterSpacing: 0.5,
          opacity: interpolate(frame, [228, 240], [1, 0], clamp),
        }}
      >
        <span style={{ opacity: interpolate(frame, [dsIn + 4, dsIn + 14], [0, 1], clamp) }}>一个跑测试，</span>
        <span style={{ opacity: interpolate(frame, [cxIn + 4, cxIn + 14], [0, 1], clamp) }}>一个写后端，</span>
        <span style={{ opacity: interpolate(frame, [clIn + 4, clIn + 14], [0, 1], clamp) }}>一个做前端。</span>
      </Interactive.Div>

      <Interactive.Div
        name="Hook headline"
        style={{
          position: "absolute",
          left: 120,
          top: 772,
          fontSize: 88,
          fontWeight: 700,
          lineHeight: 1.22,
          letterSpacing: -1,
          color: "#eeeee8",
          opacity: interpolate(frame, [T.impact - 4, T.impact + 2], [1, 0], clamp),
        }}
      >
        <div
          style={{
            color: "#8e9694",
            fontWeight: 600,
            opacity: interpolate(frame, [h1, h1 + 8], [0, 1], clamp),
            translate: `0px ${interpolate(frame, [h1, h1 + 14], [24, 0], { ...clamp, easing: ease })}px`,
          }}
        >
          而你，
        </div>
        <div
          style={{
            opacity: interpolate(frame, [h2, h2 + 8], [0, 1], clamp),
            translate: `0px ${interpolate(frame, [h2, h2 + 14], [24, 0], { ...clamp, easing: ease })}px`,
          }}
        >
          成了它们之间的
          <span style={{ position: "relative", display: "inline-block" }}>
            <span
              style={{
                position: "absolute",
                left: 4,
                right: 4,
                bottom: -2,
                height: 9,
                borderRadius: 5,
                background: "#4b6fac",
                transformOrigin: "left center",
                scale: `${interpolate(frame, [h2 + 12, h2 + 24], [0, 1], { ...clamp, easing: ease })} 1`,
              }}
            />
            <span style={{ position: "relative" }}>那根线</span>
          </span>
          。
        </div>
      </Interactive.Div>

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 900px 620px at 905px 505px, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
          opacity: interpolate(frame, [T.silence - 15, T.impact - 2], [0, 0.6], clamp),
        }}
      />
    </AbsoluteFill>
  );
};
