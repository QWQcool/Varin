import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { SceneLead } from "./scene";
import { BotsScene } from "./scenes/Bots";
import { DevicesScene } from "./scenes/Devices";
import { DispatchScene } from "./scenes/Dispatch";
import { FinaleScene } from "./scenes/Finale";
import { ModelsScene } from "./scenes/Models";
import { OpenScene } from "./scenes/Open";
import { RecoverScene } from "./scenes/Recover";
import { SteerScene } from "./scenes/Steer";
import { ViewsScene } from "./scenes/Views";
import { PRE, S } from "./timeline";

export type FilmProps = {
  readonly music: boolean;
};

type Key = keyof typeof S;

const Scene: React.FC<{ readonly id: Key; readonly name: string; readonly children: React.ReactNode }> = ({ id, name, children }) => {
  const pre = PRE[id];
  return (
    <Sequence name={name} from={S[id].from - pre} durationInFrames={S[id].to - S[id].from + pre}>
      <SceneLead pre={pre}>{children}</SceneLead>
    </Sequence>
  );
};

/**
 * Stacking follows each carry: the outgoing scene stays on top where it leaves the picture
 * (the lockup fading off the title bar, the paper floor dropping), the incoming one where it opens over it
 * (whip, irises, the dive into the phone).
 */
export const Film: React.FC<FilmProps> = ({ music }) => {
  return (
    <AbsoluteFill style={{ background: "#121618" }}>
      <Scene id="dispatch" name="01 Dispatch">
        <DispatchScene />
      </Scene>
      <Scene id="open" name="00 Open">
        <OpenScene />
      </Scene>
      <Scene id="steer" name="02 Steer">
        <SteerScene />
      </Scene>
      <Scene id="recover" name="04 Recover">
        <RecoverScene />
      </Scene>
      <Scene id="models" name="03 Models">
        <ModelsScene />
      </Scene>
      <Scene id="views" name="05 Views">
        <ViewsScene />
      </Scene>
      <Scene id="devices" name="06 Devices">
        <DevicesScene />
      </Scene>
      <Scene id="bots" name="07 Bots">
        <BotsScene />
      </Scene>
      <Scene id="finale" name="08 Finale">
        <FinaleScene />
      </Scene>

      <Audio name="Score" src={staticFile(music ? "audio/film.wav" : "audio/film-sfx.wav")} />
    </AbsoluteFill>
  );
};
