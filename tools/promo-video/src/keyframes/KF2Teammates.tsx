import React from "react";
import { AbsoluteFill, Interactive } from "remotion";
import { AgentCard } from "../components/AgentCard";
import { AppWindow } from "../components/AppWindow";
import { font } from "../theme";

/**
 * Keyframe 2 · 0:30 · Chapter 01 "调度 Agent"
 * A real Varin conversation (official 0.9.53 README capture) with the external agents it delegates to.
 * Production will re-capture this state at 2x with real Codex / DeepSeek Harness / Claude Code sessions.
 */
export const KF2Teammates: React.FC = () => {
  const ui = { x: 760, y: 186 };
  const links = [
    { from: { x: 620, y: 658 }, to: { x: ui.x + 92, y: ui.y + 217 } },
    { from: { x: 620, y: 768 }, to: { x: ui.x + 92, y: ui.y + 248 } },
    { from: { x: 620, y: 878 }, to: { x: ui.x + 88, y: ui.y + 368 } },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse 1300px 900px at 1100px 520px, #f5f5f0 0%, #efefe8 60%, #e7e7df 100%)",
        fontFamily: font.sans,
      }}
    >
      <AppWindow src="ui/readme-varin-zh.png" width={1080} height={686} style={{ left: ui.x, top: ui.y }} />

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {links.map((l, i) => (
          <g key={i}>
            <path
              d={`M ${l.from.x} ${l.from.y} C ${l.from.x + 120} ${l.from.y}, ${l.to.x - 140} ${l.to.y}, ${l.to.x} ${l.to.y}`}
              stroke="rgba(75,111,172,0.18)"
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M ${l.from.x} ${l.from.y} C ${l.from.x + 120} ${l.from.y}, ${l.to.x - 140} ${l.to.y}, ${l.to.x} ${l.to.y}`}
              stroke="#4b6fac"
              strokeWidth={2.4}
              fill="none"
              strokeLinecap="round"
            />
            <circle cx={l.to.x} cy={l.to.y} r={6} fill="#4b6fac" />
            <circle cx={l.from.x} cy={l.from.y} r={5} fill="#efefe8" stroke="#4b6fac" strokeWidth={2.4} />
          </g>
        ))}
      </svg>

      <AgentCard logo="logos/deepseek-harness.svg" name="DeepSeek Harness" task="回归测试 · 418 通过" status="done" style={{ left: 120, top: 610 }} />
      <AgentCard logo="logos/codex.svg" name="Codex" task="auth 会话接口重构" status="running" style={{ left: 120, top: 720 }} />
      <AgentCard logo="logos/claude-orange.svg" name="Claude Code" task="登录页重设计" status="waiting" style={{ left: 120, top: 830 }} />

      <Interactive.Div
        name="Chapter eyebrow"
        style={{
          position: "absolute",
          left: 120,
          top: 150,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: 1,
          color: "#4b6fac",
        }}
      >
        01 · 调度 Agent
      </Interactive.Div>
      <Interactive.Div
        name="Chapter headline"
        style={{
          position: "absolute",
          left: 116,
          top: 204,
          fontSize: 80,
          fontWeight: 700,
          lineHeight: 1.22,
          letterSpacing: -1,
          color: "#20272a",
        }}
      >
        <div>你的 Agent，</div>
        <div>
          变成它的
          <span style={{ position: "relative", display: "inline-block" }}>
            <span
              style={{
                position: "absolute",
                left: -6,
                right: -6,
                top: "42%",
                bottom: 2,
                borderRadius: 6,
                background: "rgba(75,111,172,0.22)",
              }}
            />
            <span style={{ position: "relative" }}>队友</span>
          </span>
          。
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="Chapter sub"
        style={{
          position: "absolute",
          left: 120,
          top: 424,
          fontSize: 34,
          fontWeight: 450,
          lineHeight: 1.5,
          color: "#686868",
        }}
      >
        <div>各用各的账号和模型，</div>
        <div>结果回到同一个对话。</div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
