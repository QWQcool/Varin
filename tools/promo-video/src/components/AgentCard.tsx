import React from "react";
import { Img, staticFile } from "remotion";
import { color, font } from "../theme";

type Status = "running" | "done" | "waiting";

type Props = {
  readonly logo: string;
  readonly logoFilter?: string;
  readonly name: string;
  readonly task: string;
  readonly status: Status;
  readonly style?: React.CSSProperties;
};

const statusCopy: Record<Status, { label: string; fg: string; bg: string }> = {
  running: { label: "进行中", fg: color.accent, bg: "rgba(75,111,172,0.10)" },
  done: { label: "已完成", fg: color.success, bg: "rgba(95,141,61,0.12)" },
  waiting: { label: "等你确认", fg: "#8d6c15", bg: "rgba(141,108,21,0.12)" },
};

const StatusGlyph: React.FC<{ readonly status: Status; readonly fg: string }> = ({ status, fg }) => {
  if (status === "done") {
    return (
      <svg width={18} height={18} viewBox="0 0 18 18">
        <path d="M4 9.5 L7.5 13 L14 5.5" stroke={fg} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "waiting") {
    return <div style={{ width: 9, height: 9, borderRadius: 5, background: fg }} />;
  }
  return (
    <svg width={18} height={18} viewBox="0 0 18 18">
      <circle cx={9} cy={9} r={6.5} stroke={`${fg}33`} strokeWidth={2.4} fill="none" />
      <path d="M9 2.5 A6.5 6.5 0 0 1 15.5 9" stroke={fg} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </svg>
  );
};

/** An external agent working as a Varin teammate. */
export const AgentCard: React.FC<Props> = ({ logo, logoFilter, name, task, status, style }) => {
  const s = statusCopy[status];
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        gap: 18,
        width: 500,
        height: 96,
        padding: "0 20px",
        boxSizing: "border-box",
        borderRadius: 18,
        background: color.surface,
        border: `1px solid ${color.line}`,
        boxShadow: "0 18px 40px rgba(32,39,42,0.10), 0 2px 6px rgba(32,39,42,0.06)",
        ...style,
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 14,
          background: "#f1f1ec",
          border: `1px solid ${color.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Img src={staticFile(logo)} style={{ width: 34, height: 34, filter: logoFilter }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: font.sans, fontSize: 27, fontWeight: 650, color: color.ink, letterSpacing: -0.3 }}>
          {name}
        </div>
        <div style={{ fontFamily: font.sans, fontSize: 22, color: color.muted, whiteSpace: "nowrap" }}>{task}</div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 14px",
          borderRadius: 999,
          background: s.bg,
          color: s.fg,
          fontFamily: font.sans,
          fontSize: 21,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        <StatusGlyph status={status} fg={s.fg} />
        {s.label}
      </div>
    </div>
  );
};
