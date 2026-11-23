import React from "react";

type Props = {
  readonly size: number;
  readonly tone: "light" | "dark";
};

/**
 * Varin mark: two interlocking brackets, drawn from packages/web/public/logo-*.svg.
 * "light" = graphite on paper, "dark" = paper on graphite.
 */
export const BracketMark: React.FC<Props> = ({ size, tone }) => {
  const lead = tone === "light" ? "#20272a" : "#eeeee8";
  const trail = tone === "light" ? "#77837f" : "#8e9694";
  return (
    <svg width={size} height={size} viewBox="-64 -64 128 128">
      <path
        d="M-35 -19 L-11 -43 L44 -43 L57 -30 L2 -30 L-21 -7 L-21 26 L-35 12 Z"
        fill={lead}
      />
      <path
        d="M35 19 L11 43 L-44 43 L-57 30 L-2 30 L21 7 L21 -26 L35 -12 Z"
        fill={trail}
      />
    </svg>
  );
};
