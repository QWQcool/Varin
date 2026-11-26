import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { Cursor } from "../../components/Cursor";
import { Screen } from "../../components/Screen";
import { color, font } from "../../theme";
import { camEase } from "../camera";
import { clamp, pop, rise } from "../motion";
import { useSceneFrame } from "../scene";
import { C } from "../timeline";
import { Hi, Title } from "../Title";
import { PAPER } from "./Dispatch";

const K = C.devices;

/** Same rectangle the views chapter ends on: x 80..960, centred on y 520. */
const DESK = { x: 80, y: 520 - (1410 * 880) / 2220 / 2, k: 880 / 2220 };

/** Real Android captures are 780 × 1688 (390 × 844 CSS at DPR 2). */
const PHONE = { x: 1340, y: 128, k: 0.47, bezel: 14 };
const PW = 780 * PHONE.k;
const PH = 1688 * PHONE.k;
const phonePt = (x: number, y: number) => ({ x: PHONE.x + PHONE.bezel + x * PHONE.k, y: PHONE.y + PHONE.bezel + y * PHONE.k });
export const PHONE_CENTER = phonePt(390, 844);

const NODE = { x: 1150, y: 520 };

/** Stage zoom about the phone while the thumb works, then a dive through its screen. */
const stageScale = (f: number) => {
  const tap = interpolate(f, [44, 64, 108, 126], [1, 1.42, 1.42, 1], { ...clamp, easing: camEase.follow });
  const dive = f > K.dive ? Math.exp(((f - K.dive) / 26) * Math.log(9)) : 1;
  return tap * dive;
};

export const DevicesScene: React.FC = () => {
  const f = useSceneFrame();
  const phoneIn = interpolate(f, [K.phone, K.phone + 16], [0, 1], { ...clamp, easing: camEase.snap });
  const away = interpolate(f, [16, 26, K.synced - 6, K.synced], [0, 1, 1, 0], clamp);
  const synced = interpolate(f, [K.synced - 4, K.synced + 4], [0, 1], clamp);
  const s1 = f >= K.tapOption ? 1 : 0;
  const s2 = interpolate(f, [K.back, K.back + 6], [0, 1], clamp);
  const banner = interpolate(f, [K.ask, K.ask + 8, K.ask + 34, K.ask + 42], [0, 1, 1, 0], clamp);
  const scale = stageScale(f);
  const origin = f > K.dive ? PHONE_CENTER : { x: PHONE_CENTER.x, y: 600 };
  const fingerP = f < K.tapOption + 6 ? phonePt(380, 805) : phonePt(652, 1136);
  const fingerPrev = phonePt(560, 1500);
  const fingerT = interpolate(f, [K.tapOption - 14, K.tapOption - 2, K.tapOption + 8, K.tapSubmit - 4], [0, 1, 1, 1], clamp);
  const finger = f < K.tapOption + 6 ? { x: fingerPrev.x + (fingerP.x - fingerPrev.x) * fingerT, y: fingerPrev.y + (fingerP.y - fingerPrev.y) * fingerT } : (() => {
    const a = phonePt(380, 805);
    const t = interpolate(f, [K.tapOption + 6, K.tapSubmit - 2], [0, 1], { ...clamp, easing: camEase.follow });
    return { x: a.x + (fingerP.x - a.x) * t, y: a.y + (fingerP.y - a.y) * t };
  })();
  const white = interpolate(f, [K.dive + 6, K.dive + 18], [0, 1], clamp);

  const dot = (from: { x: number; y: number }, to: { x: number; y: number }, at: number, len: number) => {
    const t = interpolate(f, [at, at + len], [0, 1], { ...clamp, easing: camEase.follow });
    return t > 0 && t < 1 ? { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t } : null;
  };
  const deskEdge = { x: 960, y: 520 };
  const phoneEdge = { x: PHONE.x, y: 520 };
  const out = [dot(deskEdge, NODE, 12, 10), dot(NODE, phoneEdge, 22, 10)];
  const back = [dot(phoneEdge, NODE, K.back + 2, 12), dot(NODE, deskEdge, K.back + 14, 12)];

  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: `${origin.x}px ${origin.y}px`, scale }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[
            [deskEdge, NODE],
            [NODE, phoneEdge],
          ].map(([a, b], i) => (
            <line key={i} x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * rise(f, 4 + i * 8, 10)} y2={b.y} stroke="rgba(75,111,172,0.45)" strokeWidth={3} strokeDasharray="4 10" strokeLinecap="round" />
          ))}
          {[...out, ...back].map((p, i) => (p ? <circle key={i} cx={p.x} cy={p.y} r={10} fill={i < 2 ? color.accent : color.success} /> : null))}
        </svg>

        <Screen
          at={DESK}
          radius={14}
          layers={[
            { src: "ui/readme-ide-zh.png", opacity: 1 - synced },
            { src: "ui/desktop-synced.png", opacity: synced },
          ]}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(18,22,24,0.62)", opacity: away }} />
          <div
            style={{
              position: "absolute",
              left: 600,
              top: 398,
              width: 1582,
              height: 92,
              borderRadius: 18,
              border: `8px solid ${color.success}`,
              opacity: interpolate(f, [K.synced + 4, K.synced + 10, 206, 212], [0, 1, 1, 0], clamp),
              scale: interpolate(f, [K.synced + 4, K.synced + 16], [1.08, 1], { ...clamp, easing: camEase.snap }),
            }}
          />
        </Screen>
        <div style={{ position: "absolute", left: 80, top: 520, width: 880, textAlign: "center", translate: "0 -50%", fontFamily: font.sans, fontSize: 40, fontWeight: 650, color: "#eeeee8", opacity: away * interpolate(f, [22, 30], [0, 1], clamp) }}>
          你离开了电脑
        </div>

        <div
          style={{
            position: "absolute",
            left: NODE.x - 118,
            top: NODE.y - 40,
            width: 236,
            height: 80,
            borderRadius: 20,
            background: color.surface,
            border: `2px solid ${color.accent}`,
            boxShadow: "0 16px 36px rgba(32,39,42,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontFamily: font.sans,
            fontSize: 28,
            fontWeight: 700,
            color: color.ink,
            scale: interpolate(f, [2, 12], [0, 1], pop),
          }}
        >
          <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={color.accent} strokeWidth={1.8} strokeLinecap="round">
            <rect x="4" y="4" width="16" height="7" rx="1.5" />
            <rect x="4" y="13" width="16" height="7" rx="1.5" />
            <path d="M8 7.5h.01M8 16.5h.01" />
          </svg>
          Varin 服务
        </div>

        <div
          style={{
            position: "absolute",
            left: PHONE.x,
            top: PHONE.y,
            width: PW + PHONE.bezel * 2,
            height: PH + PHONE.bezel * 2,
            borderRadius: 58,
            background: "#1d2326",
            boxShadow: "0 40px 90px rgba(32,39,42,0.3), inset 0 0 0 2px #3a4246",
            translate: `0px ${(1 - phoneIn) * 900}px`,
            rotate: `${(1 - phoneIn) * 8}deg`,
          }}
        >
          <div style={{ position: "absolute", left: PHONE.bezel, top: PHONE.bezel, width: PW, height: PH, borderRadius: 44, overflow: "hidden", background: "#f3f3f3" }}>
            {[
              { src: "ui/phone-ask.png", o: 1 },
              { src: "ui/phone-picked.png", o: s1 },
              { src: "ui/phone-done.png", o: s2 },
            ].map((l) => (l.o > 0 ? <Img key={l.src} src={staticFile(l.src)} style={{ position: "absolute", inset: 0, width: PW, height: PH, opacity: l.o }} /> : null))}
            <div
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                top: 14,
                padding: "14px 18px",
                borderRadius: 22,
                background: "rgba(255,255,255,0.96)",
                boxShadow: "0 10px 26px rgba(0,0,0,0.16)",
                fontFamily: font.sans,
                opacity: banner,
                translate: `0px ${(1 - banner) * -60}px`,
              }}
            >
              <div style={{ fontSize: 17, color: color.muted, fontWeight: 600 }}>Varin · 现在</div>
              <div style={{ fontSize: 21, color: color.ink, fontWeight: 700, marginTop: 2 }}>需要你确认一下</div>
            </div>
          </div>
        </div>

        <Cursor kind="touch" x={finger.x} y={finger.y} frame={f} clicks={[K.tapOption, K.tapSubmit]} opacity={interpolate(f, [K.tapOption - 16, K.tapOption - 8, K.tapSubmit + 8, K.tapSubmit + 14], [0, 1, 1, 0], clamp)} />
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: 120,
          top: 120,
          padding: "14px 26px",
          borderRadius: 999,
          background: color.ink,
          color: color.paper,
          fontFamily: font.sans,
          fontSize: 34,
          fontWeight: 650,
          display: "flex",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
          opacity: interpolate(f, [K.synced + 8, K.synced + 14, K.dive - 4, K.dive + 4], [0, 1, 1, 0], clamp),
          scale: interpolate(f, [K.synced + 8, K.synced + 18], [0.7, 1], { ...clamp, easing: camEase.snap }),
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 7, background: color.successOnDark }} />
        手机上点的，电脑上已经接着做了
      </div>

      <Title
        f={f}
        at={6}
        out={K.synced - 8}
        gone={K.dive}
        index="06"
        title="跨设备"
        lines={[
          "一个对话，",
          <>
            跨你连上的<Hi>每台设备</Hi>。
          </>,
        ]}
        sub="电脑发起 · 服务器执行 · 手机批准"
      />
      <AbsoluteFill style={{ background: "#f4f4ef", opacity: white }} />
    </AbsoluteFill>
  );
};
