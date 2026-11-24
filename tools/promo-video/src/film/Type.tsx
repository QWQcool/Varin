import React from "react";
import { color, font } from "../theme";

type Props = {
  readonly index: string;
  readonly title: string;
  readonly reveal: number;
  readonly tone?: "light" | "dark";
  readonly style?: React.CSSProperties;
};

/** "01 · 调度 Agent" chapter eyebrow with a short rule that draws in. */
export const Eyebrow: React.FC<Props> = ({ index, title, reveal, tone = "light", style }) => {
  const fg = tone === "light" ? color.accent : "#9db6e3";
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: font.sans,
        fontSize: 32,
        fontWeight: 650,
        letterSpacing: 1,
        color: fg,
        opacity: reveal,
        translate: `0px ${(1 - reveal) * 16}px`,
        ...style,
      }}
    >
      <span style={{ fontFamily: "Inter", fontWeight: 700 }}>{index}</span>
      <span style={{ width: 44 * reveal, height: 3, borderRadius: 2, background: fg }} />
      <span>{title}</span>
    </div>
  );
};

type HeadlineProps = {
  readonly lines: readonly React.ReactNode[];
  readonly reveal: readonly number[];
  readonly size?: number;
  readonly tone?: "light" | "dark";
  readonly style?: React.CSSProperties;
};

/** Multi-line headline; each line rises on its own reveal value. */
export const Headline: React.FC<HeadlineProps> = ({ lines, reveal, size = 80, tone = "light", style }) => {
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: font.sans,
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.22,
        letterSpacing: -1,
        color: tone === "light" ? color.ink : color.nightText,
        ...style,
      }}
    >
      {lines.map((line, i) => (
        <div key={i} style={{ opacity: reveal[i] ?? 1, translate: `0px ${(1 - (reveal[i] ?? 1)) * 24}px` }}>
          {line}
        </div>
      ))}
    </div>
  );
};

/** Soft marker highlight behind a word, drawn left to right. */
export const Mark: React.FC<{ readonly children: React.ReactNode; readonly draw: number; readonly tone?: "light" | "dark" }> = ({
  children,
  draw,
  tone = "light",
}) => (
  <span style={{ position: "relative", display: "inline-block" }}>
    <span
      style={{
        position: "absolute",
        left: -6,
        right: -6,
        top: "44%",
        bottom: 2,
        borderRadius: 6,
        background: tone === "light" ? "rgba(75,111,172,0.22)" : "rgba(127,162,221,0.30)",
        transformOrigin: "left center",
        scale: `${draw} 1`,
      }}
    />
    <span style={{ position: "relative" }}>{children}</span>
  </span>
);

type SubProps = {
  readonly lines: readonly string[];
  readonly reveal: number;
  readonly tone?: "light" | "dark";
  readonly style?: React.CSSProperties;
};

export const Sub: React.FC<SubProps> = ({ lines, reveal, tone = "light", style }) => (
  <div
    style={{
      position: "absolute",
      fontFamily: font.sans,
      fontSize: 36,
      fontWeight: 450,
      lineHeight: 1.5,
      color: tone === "light" ? color.muted : "#a9b3b0",
      opacity: reveal,
      translate: `0px ${(1 - reveal) * 14}px`,
      ...style,
    }}
  >
    {lines.map((l, i) => (
      <div key={i}>{l}</div>
    ))}
  </div>
);
