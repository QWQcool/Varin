import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { color, font } from "../../theme";
import { clamp, rise, settle } from "../motion";
import { C } from "../timeline";
import { Eyebrow, Headline, Mark, Sub } from "../Type";

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
/** Step numbers shown on screen: a long task already well underway. */
const FIRST = 34;
const ROW = 64;
const LIST_X = 1010;
const LIST_Y = 160;
/** Steps done before the blackout, and the step that was in flight. */
const DONE_BEFORE = 3;

export const RecoverScene: React.FC = () => {
  const f = useCurrentFrame();
  const dark = interpolate(f, [K.blackout, K.blackout + 2], [0, 1], clamp) * interpolate(f, [K.relight, K.relight + 10], [1, 0], clamp);
  const restarted = f >= K.relight;
  const hum = interpolate(f, [K.blackout + 10, K.blackout + 20, K.relight - 8, K.relight], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 1200px 820px at 1200px 520px, #222a2d 0%, #1a1f22 60%, #121618 100%)", fontFamily: font.sans }}>
      <div style={{ position: "absolute", left: LIST_X - 40, top: LIST_Y - 6, width: 2, height: ROW * STEPS.length, background: "#2f383b" }} />
      {STEPS.map((text, i) => {
        const appear = i < DONE_BEFORE + 1 ? K.grow + i * 45 : K.resume + (i - DONE_BEFORE - 1) * 15 + 15;
        const show = rise(f, appear, 10);
        const doneAt = i < DONE_BEFORE ? appear + 30 : K.resume + (i - DONE_BEFORE) * 15;
        const done = f >= doneAt;
        const inFlight = i === DONE_BEFORE && f < K.resume;
        const resumedHere = i === DONE_BEFORE;
        const ringPulse = resumedHere ? interpolate(f, [K.resume, K.resume + 4, K.resume + 30], [0, 1, 0], clamp) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: LIST_X - 60, top: LIST_Y + i * ROW, display: "flex", alignItems: "center", gap: 22, opacity: show, translate: `0px ${(1 - show) * 14}px` }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: done ? "rgba(143,191,106,0.16)" : "#242b2e",
                border: `2px solid ${done ? color.successOnDark : inFlight ? "#9db6e3" : "#3a4447"}`,
                boxShadow: `0 0 0 ${8 * ringPulse}px rgba(157,182,227,${0.35 * ringPulse})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {done ? (
                <svg width={20} height={20} viewBox="0 0 18 18">
                  <path d="M4 9.5 L7.5 13 L14 5.5" stroke={color.successOnDark} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : inFlight ? (
                <div style={{ width: 12, height: 12, borderRadius: 6, background: "#9db6e3", opacity: f % 30 < 18 ? 1 : 0.35 }} />
              ) : null}
            </div>
            <div style={{ fontFamily: "Inter", fontSize: 24, fontWeight: 600, color: "#7c8784", width: 54 }}>#{FIRST + i}</div>
            <div style={{ fontSize: 30, fontWeight: 500, color: done ? "#d7dcd9" : "#a9b3b0" }}>{text}</div>
            {resumedHere && restarted ? (
              <div
                style={{
                  marginLeft: 8,
                  padding: "5px 12px",
                  borderRadius: 999,
                  border: "1px solid #9db6e366",
                  color: "#9db6e3",
                  fontSize: 26,
                  fontWeight: 600,
                  opacity: rise(f, K.resume, 8),
                }}
              >
                从这里接着做
              </div>
            ) : null}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: LIST_X - 60,
          top: LIST_Y + STEPS.length * ROW + 20,
          display: "flex",
          gap: 14,
          opacity: rise(f, K.resume + 12, 12),
          translate: `0px ${(1 - rise(f, K.resume + 12, 14)) * 14}px`,
        }}
      >
        {["持久执行记录", "文件恢复点", "Rust 内核"].map((t) => (
          <div key={t} style={{ padding: "8px 16px", borderRadius: 10, background: "#242b2e", border: "1px solid #343d40", color: "#d7dcd9", fontSize: 30, fontWeight: 550 }}>
            {t}
          </div>
        ))}
      </div>

      <Eyebrow index="04" title="可恢复" tone="dark" reveal={rise(f, 6)} style={{ left: 120, top: 196 }} />
      <Headline
        tone="dark"
        lines={[
          restarted ? "重启之后，" : "长任务，",
          restarted ? (
            <>
              工作<Mark tone="dark" draw={rise(f, K.resume + 10, 14)}>接着做</Mark>。
            </>
          ) : (
            "最怕中途断掉。"
          ),
        ]}
        reveal={restarted ? [rise(f, K.relight + 4), rise(f, K.relight + 14)] : [rise(f, 16), rise(f, 30)]}
        size={78}
        style={{ left: 116, top: 246 }}
      />
      <Sub
        tone="dark"
        lines={["执行过程逐步落盘，", "进程退出也不会丢进度。"]}
        reveal={rise(f, K.resume + 22)}
        style={{ left: 120, top: 460 }}
      />

      <AbsoluteFill style={{ background: "#050607", opacity: dark }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 520,
          textAlign: "center",
          fontFamily: font.mono,
          fontSize: 34,
          color: "#76817f",
          opacity: dark * interpolate(f, [K.blackout + 12, K.blackout + 20], [0, 1], clamp),
          letterSpacing: 1,
        }}
      >
        varin-kernel 进程已退出
        <span style={{ opacity: hum > 0 && f % 20 < 12 ? 1 : 0 }}> _</span>
      </div>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 700px 500px at 960px 540px, rgba(157,182,227,0.22), rgba(157,182,227,0))",
          opacity: interpolate(f, [K.relight, K.relight + 3, K.relight + 24], [0, 1, 0], settle),
        }}
      />
    </AbsoluteFill>
  );
};
