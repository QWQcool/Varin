import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { color, font } from "../../theme";
import { camEase } from "../camera";
import { clamp, rise } from "../motion";
import { useSceneFrame } from "../scene";
import { C, PRE } from "../timeline";
import { Hi, Title } from "../Title";

const K = C.recover;

const STEPS = [
  "读取 src/auth · 12 个文件",
  "拆分 SessionStore",
  "修改 server/auth/session.ts",
  "跑单元测试 · 128 通过",
  "更新登录页调用",
  "跑集成测试",
  "生成迁移说明",
  "提交补丁 · 6 个文件",
];
const FIRST = 34;
const ROW = 84;
const LIST_X = 820;
const LIST_Y = 150;
/** Steps finished before the power cut; the next one was in flight. */
const DONE_BEFORE = 3;

const appearAt = (i: number) => (i <= DONE_BEFORE ? K.grow + i * 32 : K.resume + (i - DONE_BEFORE - 1) * 15 + 8);
const doneAt = (i: number) => (i < DONE_BEFORE ? appearAt(i) + 22 : K.resume + (i - DONE_BEFORE) * 15);

/** Where the last tick sits on screen at the hit (list pushed 1.1× about (1100, 520), followed up by 3.5 half-rows). */
export const RESUME_DOT = {
  x: 1100 + (LIST_X + 24 - 1100) * 1.1,
  y: 520 + (LIST_Y + (STEPS.length - 1) * ROW + 24 - 520) * 1.1 - (STEPS.length - 1 - 3.5) * ROW * 0.5,
};

export const RecoverScene: React.FC = () => {
  const f = useSceneFrame();
  const restarted = f >= K.relight;
  const off = interpolate(f, [K.blackout, K.blackout + 6], [0, 1], clamp);
  const on = interpolate(f, [K.relight, K.relight + 8], [0, 1], clamp);
  const dark = off * (1 - on);
  /** CRT: picture squeezes to a line, then a dot; reverses on relight. */
  const squeezeY = f < K.relight ? interpolate(f, [K.blackout, K.blackout + 4], [1, 0.006], { ...clamp, easing: camEase.whip }) : interpolate(f, [K.relight, K.relight + 5], [0.006, 1], { ...clamp, easing: camEase.snap });
  const squeezeX = f < K.relight ? interpolate(f, [K.blackout + 3, K.blackout + 8], [1, 0.002], clamp) : interpolate(f, [K.relight - 3, K.relight + 1], [0.002, 1], clamp);
  const crt = f >= K.blackout && f < K.relight + 6;

  /** Follow the active row. */
  const active = f < K.blackout ? Math.min(DONE_BEFORE, Math.max(0, (f - K.grow) / 32)) : f < K.resume ? DONE_BEFORE : Math.min(STEPS.length - 1, DONE_BEFORE + (f - K.resume) / 15);
  const followY = (active - 3.5) * ROW * 0.5;
  const push = 1 + 0.06 * interpolate(f, [0, K.blackout], [0, 1], clamp) + 0.04 * interpolate(f, [K.resume, K.hit], [0, 1], clamp);
  const shake = f >= K.resume && f < K.hit ? Math.sin(f * 2.1) * 2 * interpolate(f, [K.resume, K.hit], [0.2, 1], clamp) : 0;

  return (
    <AbsoluteFill style={{ background: "#050607" }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 1200px 820px at 1100px 520px, #222a2d 0%, #1a1f22 60%, #121618 100%)",
          fontFamily: font.sans,
          scale: crt ? `${squeezeX} ${squeezeY}` : undefined,
          filter: crt ? `brightness(${1 + 3 * (1 - squeezeY)})` : undefined,
          opacity: f >= K.blackout + 8 && f < K.relight - 3 ? 0 : 1,
        }}
      >
        <div style={{ position: "absolute", inset: 0, transformOrigin: "1100px 520px", scale: push, translate: `${shake}px ${-followY}px` }}>
          <div style={{ position: "absolute", left: LIST_X + 23, top: LIST_Y + 24, width: 2, height: ROW * (STEPS.length - 1), background: "#2f383b" }} />
          {STEPS.map((text, i) => {
            const show = rise(f, appearAt(i), 8);
            const done = f >= doneAt(i);
            const inFlight = i === DONE_BEFORE && f < K.resume;
            const ring = i === DONE_BEFORE ? interpolate(f, [K.resume, K.resume + 4, K.resume + 30], [0, 1, 0], clamp) : interpolate(f, [doneAt(i), doneAt(i) + 3, doneAt(i) + 14], [0, 0.6, 0], clamp);
            const last = i === STEPS.length - 1;
            return (
              <div key={i} style={{ position: "absolute", left: LIST_X, top: LIST_Y + i * ROW, display: "flex", alignItems: "center", gap: 24, opacity: show, translate: `${(1 - show) * 40}px 0px` }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background: last && done ? color.successOnDark : done ? "rgba(143,191,106,0.18)" : "#242b2e",
                    border: `3px solid ${done ? color.successOnDark : inFlight ? "#9db6e3" : "#3a4447"}`,
                    boxShadow: `0 0 0 ${12 * ring}px rgba(157,182,227,${0.4 * ring})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    scale: done ? interpolate(f, [doneAt(i), doneAt(i) + 3, doneAt(i) + 8], [1, 1.25, 1], clamp) : 1,
                  }}
                >
                  {done ? (
                    <svg width={24} height={24} viewBox="0 0 18 18">
                      <path d="M4 9.5 L7.5 13 L14 5.5" stroke={last ? "#121618" : color.successOnDark} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : inFlight ? (
                    <div style={{ width: 14, height: 14, borderRadius: 7, background: "#9db6e3", opacity: f % 20 < 12 ? 1 : 0.35 }} />
                  ) : null}
                </div>
                <div style={{ fontFamily: "Inter", fontSize: 28, fontWeight: 650, color: "#7c8784", width: 64 }}>#{FIRST + i}</div>
                <div style={{ fontSize: 38, fontWeight: 550, color: done ? "#e3e7e4" : "#a9b3b0", whiteSpace: "nowrap" }}>{text}</div>
                {i === DONE_BEFORE && restarted ? (
                  <div style={{ marginLeft: 6, padding: "6px 16px", borderRadius: 999, background: "rgba(157,182,227,0.14)", border: "1px solid #9db6e366", color: "#9db6e3", fontSize: 30, fontWeight: 650, whiteSpace: "nowrap", opacity: rise(f, K.resume, 6), scale: interpolate(f, [K.resume, K.resume + 8], [1.3, 1], { ...clamp, easing: camEase.snap }) }}>
                    从这里接着做
                  </div>
                ) : null}
              </div>
            );
          })}
          <div style={{ position: "absolute", left: LIST_X + 112, top: LIST_Y + STEPS.length * ROW + 10, display: "flex", gap: 14, opacity: rise(f, K.resume + 40, 10) }}>
            {["持久执行记录", "文件恢复点", "Rust 内核"].map((t, i) => (
              <div key={t} style={{ padding: "8px 18px", borderRadius: 12, background: "#242b2e", border: "1px solid #343d40", color: "#d7dcd9", fontSize: 28, fontWeight: 600, opacity: rise(f, K.resume + 40 + i * 5, 8), translate: `0px ${(1 - rise(f, K.resume + 40 + i * 5, 10)) * 16}px` }}>
                {t}
              </div>
            ))}
          </div>
        </div>

        {restarted ? (
          <Title
            f={f}
            at={K.relight + 6}
            out={1e9}
            index="04"
            title="可恢复"
            lines={[
              "重启之后，",
              <>
                工作<Hi>接着做</Hi>。
              </>,
            ]}
            sub="执行过程逐步落盘，进程退出也不丢进度。"
          />
        ) : (
          <Title
            f={f}
            at={18 - PRE.recover}
            out={1e9}
            index="04"
            title="可恢复"
            lines={["长任务，", "最怕中途断掉。"]}
          />
        )}
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 512,
          textAlign: "center",
          fontFamily: font.mono,
          fontSize: 36,
          color: "#76817f",
          letterSpacing: 1,
          opacity: dark * interpolate(f, [K.blackout + 14, K.blackout + 20], [0, 1], clamp),
        }}
      >
        varin-kernel 进程已退出
        <span style={{ opacity: f % 20 < 12 ? 1 : 0 }}> _</span>
      </div>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 700px 500px at 960px 540px, rgba(157,182,227,0.3), rgba(157,182,227,0))",
          opacity: interpolate(f, [K.relight, K.relight + 3, K.relight + 24], [0, 1, 0], clamp),
        }}
      />
    </AbsoluteFill>
  );
};
