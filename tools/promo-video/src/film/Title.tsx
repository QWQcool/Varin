import React from "react";
import { interpolate } from "remotion";
import { font } from "../theme";
import { clamp, rise, slam } from "./motion";

type Corner = "bl" | "tl" | "tr";

type Props = {
  readonly f: number;
  /** Panel opens here; lines land on the next beats. */
  readonly at: number;
  /** Panel folds into its chip here. */
  readonly out: number;
  /** Chip leaves here (defaults to never). */
  readonly gone?: number;
  readonly index: string;
  readonly title: string;
  readonly lines: readonly React.ReactNode[];
  readonly sub?: string;
  readonly corner?: Corner;
  readonly size?: number;
};

/** Highlighted word inside a title line. */
export const Hi: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => <span style={{ color: "#9db6e3" }}>{children}</span>;

const place = (corner: Corner): React.CSSProperties =>
  corner === "bl" ? { left: 72, bottom: 72 } : corner === "tl" ? { left: 72, top: 64 } : { right: 72, top: 64 };

/**
 * Chapter title as a dark card that slams in over the live picture, holds for a couple of bars,
 * then folds into a small chip so the product stays in view. Same position in every chapter.
 */
export const Title: React.FC<Props> = ({ f, at, out, gone = 1e9, index, title, lines, sub, corner = "bl", size = 66 }) => {
  if (f < at - 1 || f > gone + 10) return null;
  const open = rise(f, at, 8);
  const fold = rise(f, out, 10);
  const chipEnd = Math.max(gone, out + 13);
  const chipOn = gone <= out + 4 ? 0 : interpolate(f, [out + 4, out + 12, chipEnd, chipEnd + 8], [0, 1, 1, 0], clamp);
  const origin = corner === "tr" ? "right" : "left";
  return (
    <>
      <div
        style={{
          position: "absolute",
          ...place(corner),
          padding: "22px 34px 26px",
          borderRadius: 22,
          background: "rgba(24,29,32,0.94)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
          fontFamily: font.sans,
          color: "#eeeee8",
          opacity: 1 - fold,
          clipPath: `inset(0 ${origin === "left" ? (1 - open) * 100 : 0}% 0 ${origin === "right" ? (1 - open) * 100 : 0}% round 22px)`,
          translate: `0px ${fold * 18}px`,
          textAlign: corner === "tr" ? "right" : "left",
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 650, letterSpacing: 1, color: "#9db6e3", marginBottom: 8, opacity: rise(f, at + 2, 6) }}>
          <span style={{ fontFamily: "Inter", fontWeight: 700 }}>{index}</span>
          <span style={{ margin: "0 12px", opacity: 0.6 }}>·</span>
          {title}
        </div>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: size,
              fontWeight: 750,
              lineHeight: 1.18,
              letterSpacing: -1,
              whiteSpace: "nowrap",
              transformOrigin: `${origin} center`,
              ...slam(f, at + 5 + i * 8),
            }}
          >
            {line}
          </div>
        ))}
        {sub ? (
          <div style={{ marginTop: 12, fontSize: 30, fontWeight: 450, color: "#b9c2bf", whiteSpace: "nowrap", opacity: rise(f, at + 22, 10), translate: `0px ${(1 - rise(f, at + 22, 12)) * 10}px` }}>
            {sub}
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          ...place(corner),
          padding: "10px 20px",
          borderRadius: 999,
          background: "rgba(24,29,32,0.88)",
          color: "#d7dcd9",
          fontFamily: font.sans,
          fontSize: 26,
          fontWeight: 650,
          letterSpacing: 1,
          opacity: chipOn,
        }}
      >
        <span style={{ fontFamily: "Inter", fontWeight: 700, color: "#9db6e3" }}>{index}</span>
        <span style={{ margin: "0 10px", opacity: 0.5 }}>·</span>
        {title}
      </div>
    </>
  );
};
