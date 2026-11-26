import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { Chibi, CharId } from "../../components/Chibi";
import { Cursor } from "../../components/Cursor";
import { Screen } from "../../components/Screen";
import { LOCK } from "../../sample/Reveal";
import { color, font } from "../../theme";
import { camAt, camEase, CamKey, camStyle, inWorld, pathAt, PathKey, Placement, toScreen } from "../camera";
import { clamp, pop, rise, slam } from "../motion";
import { useSceneFrame } from "../scene";
import { C } from "../timeline";
import { Hi, Title } from "../Title";

const K = C.dispatch;
const P: Placement = { x: 0, y: 0, k: 0.75 };
const W = (x: number, y: number) => inWorld(P, x, y);

export const PAPER = "radial-gradient(ellipse 1300px 900px at 960px 520px, #f5f5f0 0%, #efefe8 60%, #e7e7df 100%)";

/** The title-bar mark in the home capture: bbox x 115..140, y 33..54. The lockup mark is 114 units at 219.6/128 px. */
const MARK = W(127.5, 43.5);
const MARK_W = 26 * P.k;
const Z0 = ((114 * LOCK.markSize) / 128) / MARK_W;
const CAM0 = { x: MARK.x - (LOCK.markX - 960) / Z0, y: MARK.y - (LOCK.markY - 540) / Z0 };

/** Agent wall: the window is the centre tile of a 7 × 3 grid. */
const TILE = { w: 2220 * P.k, h: 1410 * P.k };
const PITCH = { x: TILE.w + 220, y: TILE.h + 220 };
const GRID_Z = 0.135;
const GRID_CAM = { x: TILE.w / 2, y: TILE.h / 2 - (650 - 540) / GRID_Z };

const CAM: readonly CamKey[] = [
  [-30, CAM0.x, CAM0.y, Z0],
  [-24, CAM0.x, CAM0.y, Z0],
  [0, 832, 540, 1.0, camEase.whip],
  [8, 832, 540, 1.0],
  [34, 610, 640, 1.42],
  [62, 650, 650, 1.42],
  [70, 670, 650, 1.42],
  [90, 832, 470, 1.06, camEase.snap],
  [142, 600, 330, 1.36],
  [160, 620, 340, 1.36],
  [180, 1180, 400, 1.2, camEase.whip],
  [244, 1220, 410, 1.26],
  [276, GRID_CAM.x, GRID_CAM.y, GRID_Z, camEase.whip],
  [360, GRID_CAM.x, GRID_CAM.y - 40, GRID_Z * 0.94],
];

const PROMPT = "一起准备周五的发布吧。帮我把用户反馈、版本说明和官网的工作统筹起来。";

type Status = "running" | "done" | "waiting";
const STATUS: Record<Status, { label: string; fg: string; bg: string }> = {
  running: { label: "进行中", fg: color.accent, bg: "rgba(75,111,172,0.12)" },
  done: { label: "已完成 · 418 通过", fg: color.success, bg: "rgba(95,141,61,0.13)" },
  waiting: { label: "等你确认", fg: "#8d6c15", bg: "rgba(141,108,21,0.13)" },
};

const MATES: readonly { logo: string; name: string; role: string; task: string; char: CharId; final: Status }[] = [
  { logo: "logos/deepseek-harness.svg", name: "DeepSeek Harness", role: "测试", task: "回归测试", char: "deepseek", final: "done" },
  { logo: "logos/codex.svg", name: "Codex", role: "后端", task: "auth 会话接口重构", char: "gpt", final: "running" },
  { logo: "logos/claude-orange.svg", name: "Claude Code", role: "前端", task: "登录页重设计", char: "claude", final: "waiting" },
];
const CARD = { x: 1250, w: 430, h: 104, ys: [196, 344, 492] };
const ORIGIN = W(1490, 480);

/** packages/web/application-host/lib/external-agents/profiles.ts: the twenty external Agent profiles. */
const AGENTS: readonly [string, string][] = [
  ["Codex", "codex.svg"],
  ["Claude Code", "claude-orange.svg"],
  ["DeepSeek Harness", "deepseek-harness.svg"],
  ["Gemini CLI", "gemini.png"],
  ["Kimi Code", "kimi.png"],
  ["Cursor Agent", "cursor.svg"],
  ["Qoder", "qoder.svg"],
  ["Grok", "grok.svg"],
  ["Pi", "pi.svg"],
  ["OpenCode", "opencode.svg"],
  ["CodeBuddy", "codebuddy.svg"],
  ["Cline", "cline.svg"],
  ["TRAE CLI", "trae.svg"],
  ["Kiro CLI", "kiro.svg"],
  ["Google Antigravity", "google-antigravity.svg"],
  ["Hermes Agent", "hermes-agent.svg"],
  ["OpenClaw", "openclaw.svg"],
  ["MiniMax Code", "minimax-code.svg"],
  ["ZCode", "zcode.svg"],
  ["Command Code", "command-code.svg"],
];
const SLOTS = (() => {
  const all: { c: number; r: number; d: number }[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) if (!(c === 3 && r === 1)) all.push({ c, r, d: Math.hypot((c - 3) * PITCH.x, (r - 1) * PITCH.y) + c * 0.1 });
  return all.sort((a, b) => a.d - b.d);
})();

const CURSOR: readonly PathKey[] = [
  [-12, 760, 560],
  [K.click, 450, 612],
  [36, 560, 700],
  [K.send - 4, 1051, 675],
  [100, 980, 560],
  [170, 1110, 470],
  [244, 1160, 520],
];

const Mark: React.FC<{ readonly at: { x: number; y: number }; readonly width: number; readonly opacity: number; readonly tint: number }> = ({ at, width, opacity, tint }) => {
  const s = width / 114;
  return (
    <svg style={{ position: "absolute", left: at.x - 64 * s, top: at.y - 64 * s, overflow: "visible", opacity }} width={128 * s} height={128 * s} viewBox="-64 -64 128 128">
      <path d="M-35 -19 L-11 -43 L44 -43 L57 -30 L2 -30 L-21 -7 L-21 26 L-35 12 Z" fill="#20272a" />
      <path d="M35 19 L11 43 L-44 43 L-57 30 L-2 30 L21 7 L21 -26 L35 -12 Z" fill={tint > 0.5 ? "#33393b" : "#77837f"} />
    </svg>
  );
};

export const DispatchScene: React.FC = () => {
  const f = useSceneFrame();
  const cam = camAt(f, CAM);
  const typed = Math.max(0, Math.min(PROMPT.length, Math.floor((f - K.typeFrom) / K.typeStep)));
  const sent = f >= K.send;
  const swap = interpolate(f, [K.send + 2, K.send + 12], [0, 1], clamp);
  const fly = interpolate(f, [K.send, K.send + 12], [0, 1], { ...clamp, easing: camEase.snap });
  const reveal = interpolate(f, [K.stream[0], K.stream[1]], [240, 1200], clamp);
  const screenIn = interpolate(f, [-26, -16], [0, 1], clamp);
  const whip = interpolate(f, [K.whip, K.whip + 8], [0, 1], { ...clamp, easing: (t) => t * t * t });
  const cursorAt = toScreen(cam, pathAt(f, CURSOR));

  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden" }}>
      <AbsoluteFill style={{ translate: `${-2100 * whip}px 0px`, filter: whip > 0 ? `blur(${whip * 26}px)` : undefined }}>
        <div style={camStyle(cam)}>
          {SLOTS.map((s, i) => {
            const at = K.wall + i * K.wallStep;
            const on = interpolate(f, [at, at + 10], [0, 1], pop);
            if (on <= 0) return null;
            const [name, logo] = AGENTS[i];
            return (
              <div
                key={name}
                style={{
                  position: "absolute",
                  left: (s.c - 3) * PITCH.x,
                  top: (s.r - 1) * PITCH.y,
                  width: TILE.w,
                  height: TILE.h,
                  borderRadius: 90,
                  background: "#fbfbf8",
                  border: `6px solid ${color.line}`,
                  boxShadow: "0 60px 120px rgba(32,39,42,0.14)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 90,
                  scale: on,
                  opacity: Math.min(1, on * 2),
                }}
              >
                <Img src={staticFile(`logos/${logo}`)} style={{ width: 400, height: 400, objectFit: "contain" }} />
                <div style={{ fontFamily: font.sans, fontSize: name.length > 12 ? 140 : 176, fontWeight: 700, color: color.ink, letterSpacing: -3, whiteSpace: "nowrap" }}>{name}</div>
              </div>
            );
          })}

          <Screen
            at={P}
            opacity={screenIn}
            layers={[
              { src: "ui/home-empty.png", opacity: 1 - swap },
              { src: "ui/readme-varin-zh.png", opacity: swap },
            ]}
          >
            {!sent || swap < 1 ? (
              <div style={{ position: "absolute", left: 66, top: 784, width: 1180, height: 64, background: "#f6f6f6", opacity: 1 - swap }}>
                <div style={{ position: "absolute", left: 10, top: 8, fontFamily: font.sans, fontSize: 30, lineHeight: "48px", color: "#2b2b2b", whiteSpace: "nowrap", opacity: sent ? 0 : 1 }}>
                  {f >= K.click ? PROMPT.slice(0, typed) : ""}
                  {f >= K.click && !sent ? (
                    <span style={{ display: "inline-block", width: 3, height: 36, marginLeft: 2, verticalAlign: "-7px", background: color.accent, opacity: typed < PROMPT.length || f % 16 < 9 ? 1 : 0 }} />
                  ) : null}
                </div>
              </div>
            ) : null}
            {typed > 0 && swap < 1 ? (
              <div style={{ position: "absolute", left: 1372, top: 870, width: 60, height: 60, borderRadius: 30, background: color.accent, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - swap, scale: 1 - 0.15 * interpolate(f, [K.send - 2, K.send, K.send + 4], [0, 1, 0], clamp) }}>
                <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </div>
            ) : null}
            {sent && fly < 1.01 && f < K.send + 16 ? (
              <div
                style={{
                  position: "absolute",
                  left: interpolate(fly, [0, 1], [76, 401]),
                  top: interpolate(fly, [0, 1], [794, 128]),
                  fontFamily: font.sans,
                  fontSize: interpolate(fly, [0, 1], [30, 26]),
                  lineHeight: "44px",
                  color: "#2b2b2b",
                  whiteSpace: "nowrap",
                  padding: "0 18px",
                  borderRadius: 22,
                  background: `rgba(232,232,232,${fly})`,
                  opacity: interpolate(f, [K.send + 10, K.send + 15], [1, 0], clamp),
                }}
              >
                {PROMPT}
              </div>
            ) : null}
            {swap > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: reveal,
                  width: 1712,
                  height: Math.max(0, 1206 - reveal),
                  background: "linear-gradient(180deg, rgba(243,243,243,0) 0px, #f3f3f3 70px)",
                  marginTop: -70,
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: 150,
                top: 418,
                width: 1390,
                height: 124,
                borderRadius: 16,
                border: `5px solid ${color.accent}`,
                opacity: interpolate(f, [150, 156, 176, 186], [0, 1, 1, 0], clamp),
                scale: interpolate(f, [150, 162], [1.06, 1], { ...clamp, easing: camEase.snap }),
              }}
            />
          </Screen>

          {f < -10 ? <Mark at={MARK} width={MARK_W} opacity={interpolate(f, [-20, -12], [1, 0], clamp)} tint={rise(f, -26, 6)} /> : null}

          <svg width={4000} height={2000} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {MATES.map((m, i) => {
              const y = CARD.ys[i] + CARD.h / 2;
              const d = `M ${ORIGIN.x} ${ORIGIN.y} C ${ORIGIN.x + 60} ${ORIGIN.y}, ${CARD.x - 70} ${y}, ${CARD.x} ${y}`;
              const draw = rise(f, K.card[i] + 4, 10);
              return (
                <g key={i}>
                  <path d={d} stroke="rgba(75,111,172,0.2)" strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
                  <path d={d} stroke={color.accent} strokeWidth={2.6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
                </g>
              );
            })}
            <circle cx={ORIGIN.x} cy={ORIGIN.y} r={7 * rise(f, K.card[0], 8)} fill={color.accent} />
          </svg>

          {MATES.map((m, i) => {
            const land = interpolate(f, [K.card[i], K.card[i] + 12], [0, 1], pop);
            if (land <= 0) return null;
            const y = CARD.ys[i];
            const charIn = interpolate(f, [K.card[i] + 8, K.card[i] + 20], [0, 1], pop);
            const at = K.status[i];
            const status: Status = f >= at ? m.final : "running";
            const s = STATUS[status];
            const flash = interpolate(f, [at, at + 3, at + 16], [0, 1, 0], clamp);
            const hop = f >= at ? Math.sin(((f - at) / 12) * Math.PI) * Math.exp(-(f - at) / 10) * 22 : 0;
            const x = ORIGIN.x + (CARD.x - ORIGIN.x) * land;
            const yy = ORIGIN.y + (y - ORIGIN.y) * land;
            return (
              <React.Fragment key={m.name}>
                <div style={{ position: "absolute", left: CARD.x + 262, top: y - 88, width: 160, height: 92, overflow: "hidden" }}>
                  <Chibi id={m.char} height={m.char === "deepseek" ? 150 : 170} style={{ left: m.char === "deepseek" ? 22 : 12, top: 8 + (1 - charIn) * 100 - hop }} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top: yy,
                    width: CARD.w,
                    height: CARD.h,
                    transformOrigin: "0 50%",
                    scale: 0.3 + 0.7 * land,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "0 16px",
                    boxSizing: "border-box",
                    borderRadius: 18,
                    background: color.surface,
                    border: `1px solid ${color.line}`,
                    boxShadow: `0 18px 40px rgba(32,39,42,0.14), 0 0 0 ${3 * flash}px ${s.fg}`,
                    fontFamily: font.sans,
                  }}
                >
                  <div style={{ width: 54, height: 54, borderRadius: 14, background: "#f1f1ec", border: `1px solid ${color.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Img src={staticFile(m.logo)} style={{ width: 32, height: 32 }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 25, fontWeight: 700, color: color.ink, whiteSpace: "nowrap" }}>{m.name}</span>
                      <span style={{ padding: "1px 10px", borderRadius: 999, background: color.ink, color: color.paper, fontSize: 18, fontWeight: 650 }}>{m.role}</span>
                    </div>
                    <div style={{ fontSize: 20, color: color.muted, whiteSpace: "nowrap" }}>{m.task}</div>
                  </div>
                  <div style={{ position: "absolute", right: 14, bottom: -18, padding: "4px 12px", borderRadius: 999, background: "#fff", border: `1px solid ${color.line}`, color: s.fg, fontSize: 19, fontWeight: 650, whiteSpace: "nowrap", scale: 1 + 0.2 * flash }}>
                    {s.label}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <Cursor x={cursorAt.x} y={cursorAt.y} frame={f} clicks={[K.click, K.send]} opacity={interpolate(f, [-10, -4, K.pull - 4, K.pull + 4], [0, 1, 1, 0], clamp)} />

        <Title
          f={f}
          at={K.title}
          out={K.titleOut}
          gone={K.pull}
          index="01"
          title="调度 Agent"
          lines={[
            "你的 Agent，",
            <>
              变成它的<Hi>队友</Hi>。
            </>,
          ]}
          sub="测试、后端、前端，各交给最擅长的那一个。"
        />

        <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: font.sans, color: color.ink, letterSpacing: -1 }}>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 1.15, ...slam(f, K.wallText[0]) }}>
            <span style={{ fontFamily: "Inter" }}>20</span> 种外部 Agent
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.3, color: color.slate, ...slam(f, K.wallText[1]) }}>
            都能变成它的<span style={{ color: color.accent }}>队友</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
