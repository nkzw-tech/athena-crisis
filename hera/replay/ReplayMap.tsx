import MapData from '@deities/athena/MapData.tsx';
import useScale from '@deities/ui/hooks/useScale.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { useMemo } from 'react';
import InfoBehavior from '../behavior/InfoBehavior.tsx';
import useZoom from '../editor/hooks/useZoom.tsx';
import ZoomButton from '../editor/lib/ZoomButton.tsx';
import GameMap from '../GameMap.tsx';
import useAnimationSpeed, {
  AnimationSpeed,
} from '../hooks/useAnimationSpeed.tsx';
import useConfirmActionStyle, {
  ConfirmActionStyle,
} from '../hooks/useConfirmActionStyle.tsx';
import useHide from '../hooks/useHide.tsx';
import { UserLikeWithID } from '../hooks/useUserMap.tsx';
import { PlayerDetail } from '../Types.tsx';
import CurrentGameCard from '../ui/CurrentGameCard.tsx';
import MapInfo from '../ui/MapInfo.tsx';
import useReplayPlayerDetails from './hooks/useReplayPlayerDetails.tsx';

export default function ReplayMap({
  animationSpeed: initialAnimationSpeed,
  autoPanning,
  confirmActionStyle: initialConfirmActionStyle,
  currentViewer,
  fogStyle,
  map,
  mapName,
  tiltStyle,
  users,
}: {
  animationSpeed: AnimationSpeed | null | undefined;
  autoPanning: boolean;
  confirmActionStyle: ConfirmActionStyle | null | undefined;
  currentViewer: string;
  fogStyle: 'soft' | 'hard';
  map: MapData;
  mapName: string;
  tiltStyle?: 'on' | 'off';
  users: ReadonlyMap<string, PlayerDetail & UserLikeWithID>;
}) {
  const hidden = useHide();
  const maxZoom = useScale() + 1;
  const [zoom, setZoom] = useZoom(maxZoom, 'replay', true);
  const animationSpeed = useAnimationSpeed(initialAnimationSpeed);
  const confirmActionStyle = useConfirmActionStyle(initialConfirmActionStyle);
  const eventTarget = useMemo(() => new EventTarget(), []);
  const playerDetails = useReplayPlayerDetails(map, users);

  return (
    <GameMap
      animationSpeed={animationSpeed}
      autoPanning={autoPanning}
      behavior={InfoBehavior}
      confirmActionStyle={confirmActionStyle}
      currentUserId={currentViewer}
      dangerouslyApplyExternalState
      events={eventTarget}
      fogStyle={fogStyle}
      key={`replay`}
      map={map}
      mapName={mapName}
      pan
      playerDetails={playerDetails}
      scale={zoom}
      scroll={false}
      showCursor={!hidden}
      style="floating"
      tilted={tiltStyle === 'on'}
    >
      {(props, actions) => {
        const hide = hidden || props.lastActionResponse?.type === 'GameEnd';
        return (
          <>
            <MapInfo hide={hide} leftOffset {...props} />
            <CurrentGameCard
              actions={actions}
              animations={props.animations}
              currentViewer={props.currentViewer}
              gameInfoState={props.gameInfoState}
              inlineUI={props.inlineUI}
              map={props.map}
              users={users}
              vision={props.vision}
              zIndex={props.zIndex}
            />
            <Portal>
              <ZoomButton
                hide={hide}
                max={maxZoom}
                position="bottom"
                setZoom={setZoom}
                zoom={zoom}
              />
            </Portal>
          </>
        );
      }}
    </GameMap>
  );
}
