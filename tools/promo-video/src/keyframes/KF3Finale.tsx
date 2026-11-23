import React from "react";
import { AbsoluteFill, Img, Interactive, staticFile } from "remotion";
import { BracketMark } from "../components/BracketMark";
import { font } from "../theme";

/**
 * Keyframe 3 · 1:50 · Finale
 * Brand lockup over Varin and the 15 built-in Bot characters (official README cast art).
 */
export const KF3Finale: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#141b2b", fontFamily: font.sans }}>
      <Img
        src={staticFile("cast/varin-cast-dark.webp")}
        style={{ position: "absolute", left: 0, top: 444, width: 1920, height: 637 }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #141b2b 0%, #141b2b 44%, rgba(20,27,43,0.55) 56%, rgba(20,27,43,0) 66%, rgba(20,27,43,0) 86%, rgba(12,16,26,0.85) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 820px 360px at 960px 250px, rgba(120,150,210,0.16) 0%, rgba(120,150,210,0) 70%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 108,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <BracketMark size={112} tone="dark" />
        <Interactive.Div
          name="Wordmark"
          style={{
            fontFamily: "Inter",
            fontSize: 112,
            fontWeight: 600,
            letterSpacing: -4,
            color: "#eeeee8",
            lineHeight: 1,
          }}
        >
          Varin
        </Interactive.Div>
      </div>

      <Interactive.Div
        name="Promise"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 266,
          textAlign: "center",
          fontSize: 84,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#eeeee8",
        }}
      >
        通用 Super Agent
      </Interactive.Div>
      <Interactive.Div
        name="Exploration line"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 384,
          textAlign: "center",
          fontSize: 36,
          fontWeight: 450,
          letterSpacing: 1,
          color: "#a3aec4",
        }}
      >
        一次关于「Agent 之上」的探索
      </Interactive.Div>

      <Interactive.Div
        name="Footer facts"
        style={{
          position: "absolute",
          left: 120,
          bottom: 52,
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: 1,
          color: "#d5dae4",
        }}
      >
        开源 · 可自部署 · 模型自选
      </Interactive.Div>
      <Interactive.Div
        name="Footer link"
        style={{
          position: "absolute",
          right: 120,
          bottom: 52,
          fontFamily: "Inter",
          fontSize: 32,
          fontWeight: 500,
          color: "#d5dae4",
        }}
      >
        github.com/Astrmira/Varin
      </Interactive.Div>
    </AbsoluteFill>
  );
};
