import React, { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";

/**
 * Scenes start rendering a few frames before their boundary when a transition overlaps them.
 * `useSceneFrame()` returns the frame relative to the boundary, so it is negative during the lead-in.
 */
const Lead = createContext(0);

export const SceneLead: React.FC<{ readonly pre: number; readonly children: React.ReactNode }> = ({ pre, children }) => (
  <Lead.Provider value={pre}>{children}</Lead.Provider>
);

export const useSceneFrame = () => useCurrentFrame() - useContext(Lead);
