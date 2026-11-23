import React from "react";
import { Img, staticFile } from "remotion";
import { color, font } from "../theme";

export type TerminalLine = {
  readonly text: string;
  readonly tone?: "plain" | "done" | "dim" | "warn" | "error" | "prompt";
  /** 0 = not yet printed (takes no space), 1 = fully shown. */
  readonly reveal?: number;
};

type Props = {
  readonly logo: string;
  readonly logoFilter?: string;
  readonly name: string;
  readonly status: string;
  readonly statusTone: "run" | "warn" | "error" | "prompt";
  readonly lines: readonly TerminalLine[];
  readonly width: number;
  /** 0..1 border pulse in the status colour when the session stalls. */
  readonly alert?: number;
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

const statusColorOf = (tone: Props["statusTone"]) =>
  tone === "run" ? color.successOnDark : tone === "warn" ? color.warning : tone === "error" ? color.error : "#9db6e3";

/** An external agent session, as the viewer would recognise it from their own terminal. */
export const TerminalWindow: React.FC<Props> = ({
  logo,
  logoFilter,
  name,
  status,
  statusTone,
  lines,
  width,
  alert = 0,
  style,
}) => {
  const statusColor = statusColorOf(statusTone);
  return (
    <div
      style={{
        position: "absolute",
        width,
        borderRadius: 18,
        background: color.nightRaised,
        border: `1px solid ${color.nightLine}`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 0 ${2 * alert}px ${statusColor}, 0 0 ${48 * alert}px ${statusColor}66`,
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
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: "#4a5356" }} />
          ))}
        </div>
        <Img src={staticFile(logo)} style={{ width: 30, height: 30, marginLeft: 8, filter: logoFilter }} />
        <div style={{ fontFamily: font.sans, fontSize: 26, fontWeight: 600, color: color.nightText, letterSpacing: -0.3 }}>
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
        {lines
          .filter((line) => (line.reveal ?? 1) > 0)
          .map((line, i) => (
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
                opacity: line.reveal ?? 1,
                translate: `0px ${(1 - (line.reveal ?? 1)) * 8}px`,
              }}
            >
              {line.text}
            </div>
          ))}
      </div>
    </div>
  );
};
