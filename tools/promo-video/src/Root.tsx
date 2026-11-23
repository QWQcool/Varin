import "./theme";
import { Folder, Still } from "remotion";
import { KF1Thread } from "./keyframes/KF1Thread";
import { KF2Teammates } from "./keyframes/KF2Teammates";
import { KF3Finale } from "./keyframes/KF3Finale";

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="Keyframes">
      <Still id="KF1-Hook" component={KF1Thread} width={1920} height={1080} />
      <Still id="KF2-Teammates" component={KF2Teammates} width={1920} height={1080} />
      <Still id="KF3-Finale" component={KF3Finale} width={1920} height={1080} />
    </Folder>
  );
};
