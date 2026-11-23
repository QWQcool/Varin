import React from "react";
import { Img, staticFile } from "remotion";
import { color, font } from "../theme";

export type TerminalLine = {
  readonly text: string;
  readonly tone?: "plain" | "done" | "dim" | "warn" | "error" | "prompt";
};

type Props = {
  readonly logo: string;
  readonly logoFilter?: string;
  readonly name: string;
  readonly status: string;
  readonly statusTone: "warn" | "error" | "prompt";
  readonly lines: readonly TerminalLine[];
  readonly width: number;
  readonly style?: React.CSSProperties;
};

const toneColor: Record<NonNullable<TerminalLine["tone"]>, string> = {
  plain: "#d7dcd9",
  done: color.successOnDark,
  dim: "#7c8784",
  warn: color.warning,
  error: color.error,
  prompt: "#9db6e3",
};

/** A stalled external agent session, as the viewer would recognise it from their own terminal. */
export const TerminalWindow: React.FC<Props> = ({
  logo,
  logoFilter,
  name,
  status,
  statusTone,
  lines,
  width,
  style,
}) => {
  const statusColor =
    statusTone === "warn" ? color.warning : statusTone === "error" ? color.error : "#9db6e3";
  return (
    <div
      style={{
        position: "absolute",
        width,
        borderRadius: 18,
        background: color.nightRaised,
        border: `1px solid ${color.nightLine}`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 2px 0 rgba(255,255,255,0.03) inset",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 22px",
          borderBottom: `1px solid ${color.nightLine}`,
          background: "#20272a",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {["#4a5356", "#4a5356", "#4a5356"].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
          ))}
        </div>
        <Img
          src={staticFile(logo)}
          style={{ width: 30, height: 30, marginLeft: 8, filter: logoFilter }}
        />
        <div
          style={{
            fontFamily: font.sans,
            fontSize: 26,
            fontWeight: 600,
            color: color.nightText,
            letterSpacing: -0.3,
          }}
        >
          {name}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${statusColor}55`,
            fontFamily: font.sans,
            fontSize: 21,
            fontWeight: 500,
            color: statusColor,
          }}
        >
          <div style={{ width: 9, height: 9, borderRadius: 5, background: statusColor }} />
          {status}
        </div>
      </div>
      <div style={{ padding: "18px 24px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: font.mono,
              fontSize: 22,
              lineHeight: 1.35,
              color: toneColor[line.tone ?? "plain"],
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
};
