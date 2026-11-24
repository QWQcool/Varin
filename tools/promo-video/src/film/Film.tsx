import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BracketWipe } from "../components/BracketWipe";
import { clamp } from "./motion";
import { AgentsScene } from "./scenes/Agents";
import { BotsScene } from "./scenes/Bots";
import { DevicesScene } from "./scenes/Devices";
import { FinaleScene } from "./scenes/Finale";
import { ModelsScene } from "./scenes/Models";
import { OpenScene } from "./scenes/Open";
import { RecoverScene } from "./scenes/Recover";
import { SteerScene } from "./scenes/Steer";
import { ViewsScene } from "./scenes/Views";
import { BEAT, S } from "./timeline";

export type FilmProps = {
  readonly music: boolean;
};

/** Bracket wipe: closes over the last beat of a scene, parts over the first beat of the next. */
const Wipe: React.FC<{ readonly at: number; readonly fill?: string }> = ({ at, fill }) => {
  const f = useCurrentFrame();
  const open = interpolate(f, [at - BEAT, at, at + 1, at + BEAT], [1, 0, 0, 1], clamp);
  return <BracketWipe open={open} fill={fill} />;
};

export const Film: React.FC<FilmProps> = ({ music }) => {
  return (
    <AbsoluteFill style={{ background: "#121618" }}>
      <Sequence name="00 Open" durationInFrames={S.open.to - S.open.from}>
        <OpenScene />
      </Sequence>
      <Sequence name="01 Agents" from={S.agents.from} durationInFrames={S.agents.to - S.agents.from}>
        <AgentsScene />
      </Sequence>
      <Sequence name="02 Steer" from={S.steer.from} durationInFrames={S.steer.to - S.steer.from}>
        <SteerScene />
      </Sequence>
      <Sequence name="03 Models" from={S.models.from} durationInFrames={S.models.to - S.models.from}>
        <ModelsScene />
      </Sequence>
      <Sequence name="04 Recover" from={S.recover.from} durationInFrames={S.recover.to - S.recover.from}>
        <RecoverScene />
      </Sequence>
      <Sequence name="05 Views" from={S.views.from} durationInFrames={S.views.to - S.views.from}>
        <ViewsScene />
      </Sequence>
      <Sequence name="06 Devices" from={S.devices.from} durationInFrames={S.devices.to - S.devices.from}>
        <DevicesScene />
      </Sequence>
      <Sequence name="07 Bots" from={S.bots.from} durationInFrames={S.bots.to - S.bots.from}>
        <BotsScene />
      </Sequence>
      <Sequence name="08 Finale" from={S.finale.from} durationInFrames={S.finale.to - S.finale.from}>
        <FinaleScene />
      </Sequence>

      <Wipe at={S.steer.from} />
      <Wipe at={S.models.from} />
      <Wipe at={S.recover.from} fill="#0d1012" />
      <Wipe at={S.views.from} fill="#0d1012" />
      <Wipe at={S.devices.from} />
      <Wipe at={S.bots.from} />

      <Audio name="Score" src={staticFile(music ? "audio/film.wav" : "audio/film-sfx.wav")} />
    </AbsoluteFill>
  );
};
