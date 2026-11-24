import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { color, font } from "../../theme";
import { clamp, pop, rise } from "../motion";
import { C } from "../timeline";
import { Eyebrow, Headline, Mark } from "../Type";

const K = C.devices;

const NODES = [
  { x: 1000, y: 330, title: "你的电脑", sub: "发起任务", icon: "laptop" },
  { x: 1440, y: 330, title: "Varin 服务", sub: "服务器上执行", icon: "server" },
  { x: 1440, y: 700, title: "你的手机", sub: "随手批准", icon: "phone" },
] as const;

const Icon: React.FC<{ readonly kind: (typeof NODES)[number]["icon"] }> = ({ kind }) => (
  <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke={color.accent} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {kind === "laptop" ? (
      <>
        <rect x="4" y="5" width="16" height="11" rx="1.5" />
        <path d="M2.5 19h19" />
      </>
    ) : kind === "server" ? (
      <>
        <rect x="4" y="4" width="16" height="7" rx="1.5" />
        <rect x="4" y="13" width="16" height="7" rx="1.5" />
        <path d="M8 7.5h.01M8 16.5h.01" />
      </>
    ) : (
      <>
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
        <path d="M11 18.5h2" />
      </>
    )}
  </svg>
);

const NODE_W = 300;
const NODE_H = 120;
const center = (i: number) => ({ x: NODES[i].x + NODE_W / 2, y: NODES[i].y + NODE_H / 2 });

export const DevicesScene: React.FC = () => {
  const f = useCurrentFrame();
  const approved = f >= K.approve;
  const tap = interpolate(f, [K.approve - 6, K.approve, K.approve + 10], [0, 1, 0], clamp);
  const pulse = (from: number) => interpolate(f, [from, from + 20], [0, 1], clamp);

  const links: [number, number, number][] = [
    [0, 1, K.nodes[1]],
    [1, 2, K.nodes[2]],
  ];

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 1300px 900px at 1200px 520px, #f5f5f0 0%, #efefe8 60%, #e7e7df 100%)", fontFamily: font.sans }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {links.map(([a, b, at], i) => {
          const p = center(a);
          const q = center(b);
          const draw = rise(f, at, 18);
          const send = i === 1 ? pulse(K.phone - 20) : pulse(K.nodes[1] + 20);
          const back = pulse(K.approve);
          return (
            <g key={i}>
              <line x1={p.x} y1={p.y} x2={p.x + (q.x - p.x) * draw} y2={p.y + (q.y - p.y) * draw} stroke="rgba(75,111,172,0.35)" strokeWidth={3} strokeDasharray="4 10" strokeLinecap="round" />
              {send > 0 && send < 1 ? <circle cx={p.x + (q.x - p.x) * send} cy={p.y + (q.y - p.y) * send} r={9} fill={color.accent} /> : null}
              {i === 1 && back > 0 && back < 1 ? <circle cx={q.x + (p.x - q.x) * back} cy={q.y + (p.y - q.y) * back} r={9} fill={color.success} /> : null}
            </g>
          );
        })}
      </svg>

      {NODES.map((n, i) => {
        const on = interpolate(f, [K.nodes[i], K.nodes[i] + 14], [0, 1], pop);
        const lit = i === 2 && approved ? interpolate(f, [K.approve, K.approve + 4, K.approve + 24], [0, 1, 0.3], clamp) : 0;
        return (
          <div
            key={n.title}
            style={{
              position: "absolute",
              left: n.x,
              top: n.y,
              width: NODE_W,
              height: NODE_H,
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "0 24px",
              boxSizing: "border-box",
              borderRadius: 20,
              background: color.surface,
              border: `1px solid ${i === 1 ? color.accent : color.line}`,
              boxShadow: `0 18px 40px rgba(32,39,42,0.10), 0 0 0 ${3 * lit}px ${color.success}`,
              opacity: on * (i === 2 ? 1 - rise(f, K.phone, 10) : 1),
              scale: 0.8 + 0.2 * on,
            }}
          >
            <Icon kind={n.icon} />
            <div>
              <div style={{ fontSize: 30, fontWeight: 650, color: color.ink }}>{n.title}</div>
              <div style={{ fontSize: 22, color: color.muted }}>{n.sub}</div>
            </div>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 1400,
          top: 560,
          width: 380,
          height: 410,
          borderRadius: 34,
          background: "#1f2629",
          padding: 12,
          boxSizing: "border-box",
          boxShadow: "0 30px 70px rgba(32,39,42,0.25)",
          opacity: rise(f, K.phone, 10),
          scale: 0.3 + 0.7 * rise(f, K.phone, 18),
          transformOrigin: "190px 200px",
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: 24, background: "#f3f3f3", padding: 22, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, color: color.muted }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: "#8d6c15" }} />
            Claude Code 等你确认
          </div>
          <div style={{ fontSize: 29, fontWeight: 650, color: color.ink, lineHeight: 1.35 }}>登录页改好了，要不要合并到主分支？</div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              height: 62,
              borderRadius: 14,
              background: approved ? color.success : color.accent,
              color: "#fafafa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 650,
              scale: 1 - 0.05 * tap,
            }}
          >
            {approved ? "已批准 ✓" : "批准"}
          </div>
          <div style={{ height: 52, borderRadius: 14, border: `1px solid ${color.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: color.muted }}>
            再看看
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1562,
          top: 811,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "rgba(32,39,42,0.18)",
          border: "2px solid rgba(255,255,255,0.7)",
          opacity: interpolate(f, [K.approve - 14, K.approve - 6, K.approve + 8, K.approve + 16], [0, 1, 1, 0], clamp),
          scale: 1 - 0.25 * tap,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 1000,
          top: 200,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 18px",
          borderRadius: 12,
          background: "#ffffff",
          border: `1px solid ${color.line}`,
          boxShadow: "0 12px 28px rgba(32,39,42,0.10)",
          fontSize: 23,
          fontWeight: 550,
          color: color.ink,
          opacity: rise(f, K.desktop, 12),
        }}
      >
        <span style={{ color: color.success }}>●</span> 同一个会话已在电脑上继续
      </div>

      <Eyebrow index="06" title="跨设备" reveal={rise(f, 4)} style={{ left: 120, top: 196 }} />
      <Headline
        lines={[
          "一个对话，",
          <>
            跨你连上的<Mark draw={rise(f, 50, 14)}>每台设备</Mark>。
          </>,
        ]}
        reveal={[rise(f, 14), rise(f, 28)]}
        size={78}
        style={{ left: 116, top: 246 }}
      />
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 470,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          fontSize: 34,
          fontWeight: 500,
          color: color.muted,
        }}
      >
        {["电脑发起", "服务器执行", "手机批准"].map((t, i) => (
          <div key={t} style={{ opacity: rise(f, K.nodes[i] + 6), translate: `${(1 - rise(f, K.nodes[i] + 6)) * -14}px 0px` }}>
            <span style={{ color: color.accent, fontFamily: "Inter", fontWeight: 700, marginRight: 14 }}>{i + 1}</span>
            {t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
