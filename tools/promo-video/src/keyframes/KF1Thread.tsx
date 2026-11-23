import React from "react";
import { AbsoluteFill, Interactive } from "remotion";
import { TerminalWindow } from "../components/TerminalWindow";
import { color, font } from "../theme";

/**
 * Keyframe 1 · 0:09 · Hook
 * The viewer's own reality: several agents, each stalled on something only a human can unblock,
 * and the human shuttling between them.
 */
export const KF1Thread: React.FC = () => {
  const node = { x: 905, y: 505 };
  const anchors = [
    { x: 790, y: 336, chip: "复制报错", cx: 842, cy: 404 },
    { x: 1130, y: 372, chip: "按 y 确认", cx: 1024, cy: 420 },
    { x: 1060, y: 724, chip: "重新登录", cx: 1012, cy: 600 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse 1100px 760px at 900px 470px, #262e31 0%, #1a1f22 55%, #121618 100%)",
        fontFamily: font.sans,
      }}
    >
      <TerminalWindow
        logo="logos/deepseek-harness.svg"
        name="DeepSeek Harness"
        status="上下文将满"
        statusTone="warn"
        width={640}
        style={{ left: 150, top: 104 }}
        lines={[
          { text: "› 重构 auth 会话模块", tone: "plain" },
          { text: "✓ 读取 12 个文件", tone: "done" },
          { text: "✓ 修改 src/auth/session.ts", tone: "done" },
          { text: "⚠ 上下文已用 96%，正在压缩…", tone: "warn" },
        ]}
      />
      <TerminalWindow
        logo="logos/codex.svg"
        logoFilter="invert(1)"
        name="Codex"
        status="等你确认"
        statusTone="prompt"
        width={640}
        style={{ left: 1130, top: 140 }}
        lines={[
          { text: "› 跑一遍全部测试", tone: "plain" },
          { text: "  running 418 tests …", tone: "dim" },
          { text: "✗ 3 failed · auth.spec.ts", tone: "error" },
          { text: "? 允许执行 npm install？(y/n) █", tone: "prompt" },
        ]}
      />
      <TerminalWindow
        logo="logos/claude-white.svg"
        name="Claude Code"
        status="已断开"
        statusTone="error"
        width={640}
        style={{ left: 1060, top: 532 }}
        lines={[
          { text: "› 查 OAuth 2.1 迁移资料", tone: "plain" },
          { text: "✓ 已阅读 6 个网页", tone: "done" },
          { text: "✗ 会话已断开，请重新登录", tone: "error" },
        ]}
      />

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor="rgba(120,160,230,0.55)" />
            <stop offset="100%" stopColor="rgba(75,111,172,0)" />
          </radialGradient>
        </defs>
        {anchors.map((a, i) => (
          <g key={i}>
            <path
              d={`M ${node.x} ${node.y} Q ${(node.x + a.x) / 2 + (i === 2 ? 60 : 0)} ${(node.y + a.y) / 2 - 40} ${a.x} ${a.y}`}
              stroke="rgba(120,160,230,0.18)"
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M ${node.x} ${node.y} Q ${(node.x + a.x) / 2 + (i === 2 ? 60 : 0)} ${(node.y + a.y) / 2 - 40} ${a.x} ${a.y}`}
              stroke="#7fa2dd"
              strokeWidth={2.4}
              strokeDasharray="2 11"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx={a.x} cy={a.y} r={6} fill="#7fa2dd" />
          </g>
        ))}
        <circle cx={node.x} cy={node.y} r={110} fill="url(#nodeGlow)" />
        <circle cx={node.x} cy={node.y} r={54} fill="none" stroke="rgba(127,162,221,0.25)" strokeWidth={1.5} />
        <circle cx={node.x} cy={node.y} r={32} fill="none" stroke="rgba(127,162,221,0.45)" strokeWidth={1.5} />
        <circle cx={node.x} cy={node.y} r={15} fill="#7fa2dd" />
      </svg>

      {anchors.map((a, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: a.cx,
            top: a.cy,
            translate: "-50% -50%",
            padding: "6px 14px",
            borderRadius: 999,
            background: "#2a3236",
            border: "1px solid #3d474b",
            color: "#c9d6ee",
            fontSize: 21,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {a.chip}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: node.x,
          top: node.y + 70,
          translate: "-50% 0",
          color: color.nightText,
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: 2,
        }}
      >
        你
      </div>

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
        }}
      >
        <div style={{ color: "#8e9694", fontWeight: 600 }}>而你，</div>
        <div>
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
              }}
            />
            <span style={{ position: "relative" }}>那根线</span>
          </span>
          。
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
