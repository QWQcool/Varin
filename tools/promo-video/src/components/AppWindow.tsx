import React from "react";
import { Img, staticFile } from "remotion";
import { color } from "../theme";

type Props = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly style?: React.CSSProperties;
};

/**
 * Frames a real product screenshot. The capture already contains the app chrome,
 * so the frame only adds the window edge and a soft lift from the paper.
 */
export const AppWindow: React.FC<Props> = ({ src, width, height, style }) => {
  return (
    <div
      style={{
        position: "absolute",
        width,
        height,
        borderRadius: 16,
        overflow: "hidden",
        background: color.surface,
        border: `1px solid ${color.line}`,
        boxShadow: "0 40px 90px rgba(32,39,42,0.16), 0 6px 18px rgba(32,39,42,0.08)",
        ...style,
      }}
    >
      <Img src={staticFile(src)} style={{ width, height, display: "block" }} />
    </div>
  );
};
