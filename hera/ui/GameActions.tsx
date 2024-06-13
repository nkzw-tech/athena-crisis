import { Ability } from '@deities/athena/info/Unit.tsx';
import getAvailableUnitActions from '@deities/athena/lib/getAvailableUnitActions.tsx';
import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import Player, { PlayerID } from '@deities/athena/map/Player.tsx';
import Vector, { sortVectors } from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { attackable, RadiusItem } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar, CSSVariables, insetStyle } from '@deities/ui/cssVar.tsx';
import useScale from '@deities/ui/hooks/useScale.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Info from '@deities/ui/icons/Info.tsx';
import MenuButton from '@deities/ui/MenuButton.tsx';
import Portal from '@deities/ui/Portal.tsx';
import RainbowPulseStyle from '@deities/ui/RainbowPulseStyle.tsx';
import { css, cx } from '@emotion/css';
import Attack from '@iconify-icons/pixelarticons/bullseye-arrow.js';
import Close from '@iconify-icons/pixelarticons/close.js';
import Forward from '@iconify-icons/pixelarticons/forward.js';
import EndTurn from '@iconify-icons/pixelarticons/reply-all.js';
import Next from '@iconify-icons/pixelarticons/reply.js';
import React, {
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AttackRadius from '../behavior/AttackRadius.tsx';
import Base from '../behavior/Base.tsx';
import { resetBehavior } from '../behavior/Behavior.tsx';
import canEndTurn from '../behavior/endTurn/canEndTurn.tsx';
import endTurnAction from '../behavior/endTurn/endTurnAction.tsx';
import { SetZoomFn } from '../editor/hooks/useZoom.tsx';
import ZoomButton from '../editor/lib/ZoomButton.tsx';
import toTransformOrigin from '../lib/toTransformOrigin.tsx';
import { RadiusType } from '../Radius.tsx';
import { StateWithActions } from '../Types.tsx';
import maybeFade from './lib/maybeFade.tsx';
import ReplayBar from './ReplayBar.tsx';

type TimerID = ReturnType<typeof setTimeout>;

const InfoButton = ({
  actions: { showGameInfo },
  state: { gameInfoState, preventRemoteActions },
}: StateWithActions) => {
  useInput('detail', () => {
    if (!preventRemoteActions && !gameInfoState) {
      showGameInfo({
        origin: 'center center',
        type: 'game-info',
      });
    }
  });
  return (
    <MenuButton className={cx(actionButtonStyle, infoButtonStyle)}>
      <Icon
        button
        className={cx(iconStyle, preventRemoteActions && disabledButtonStyle)}
        icon={Info}
        onClick={(event) => {
          if (!preventRemoteActions) {
            AudioPlayer.playSound('UI/Accept');
            showGameInfo({
              origin: toTransformOrigin(event),
              type: 'game-info',
            });
          }
        }}
      />
    </MenuButton>
  );
};

const AttackRadiusButton = ({
  actions: { update },
  playerCanEndTurn,
  state: { behavior, currentViewer, map },
}: StateWithActions & { playerCanEndTurn: boolean | null }) => {
  const fields = useMemo(
    () =>
      currentViewer
        ? map.units
            .filter(
              (unit) =>
                map.isOpponent(unit, currentViewer) &&
                unit.info.hasAttack() &&
                (!unit.info.hasAbility(Ability.Unfold) || unit.isUnfolded()),
            )
            .flatMap((unit, vector) => attackable(map, unit, vector, 'cost'))
        : null,
    [currentViewer, map],
  );

  const show = useCallback(() => {
    if (playerCanEndTurn && fields?.size) {
      const isShowingAttackRadius = behavior?.type === 'attackRadius';
      AudioPlayer.playSound(isShowingAttackRadius ? 'UI/Cancel' : 'UI/Accept');
      update(
        isShowingAttackRadius
          ? resetBehavior()
          : {
              behavior: new AttackRadius(fields),
            },
      );
    }
  }, [behavior?.type, fields, playerCanEndTurn, update]);

  useInput('quaternary', show);

  return (
    <MenuButton className={cx(actionButtonStyle, attackRadiusButtonStyle)}>
      <Icon
        button
        className={cx(
          iconStyle,
          (!playerCanEndTurn || !fields?.size) && disabledButtonStyle,
        )}
        icon={Attack}
        onClick={show}
      />
    </MenuButton>
  );
};

const getAvailableUnits = (
  map: MapData,
  currentViewer: Player | PlayerID | null,
  vision: VisionT,
) =>
  (currentViewer &&
    map.isCurrentPlayer(currentViewer) &&
    map.units
      .filter(
        (unit, vector) =>
          !unit.isCompleted() &&
          map.matchesPlayer(currentViewer, unit) &&
          getAvailableUnitActions(map, vector, unit, vision, null)?.size,
      )
      .keySeq()
      .toArray()) ||
  [];

const rotatePositions = (
  positions: ReadonlyArray<Vector>,
  direction: 'next' | 'previous',
) => {
  const newPositions = [...positions];
  if (direction === 'next') {
    newPositions.push(newPositions.shift()!);
  } else {
    newPositions.unshift(newPositions.pop()!);
  }
  return newPositions;
};

const NextButton = ({
  actions,
  playerCanEndTurn,
  state,
}: StateWithActions & { playerCanEndTurn: boolean | null }) => {
  const { scrollIntoView, update } = actions;
  const { behavior, currentViewer, map, selectedPosition, vision } = state;
  const [positions, setPositions] = useState<ReadonlyArray<Vector>>([]);
  const attackable =
    behavior?.type === 'attack' && state.attackable?.size
      ? state.attackable
      : null;

  useEffect(() => {
    setPositions(
      sortVectors(
        attackable
          ? [...attackable.keys()]
          : getAvailableUnits(map, currentViewer, vision),
      ),
    );
  }, [attackable, currentViewer, map, vision]);

  const hasAnimations = positions.some((vector) =>
    state.animations.has(vector),
  );

  const select = useCallback(
    async (direction: 'next' | 'previous') => {
      if (hasAnimations || !playerCanEndTurn || !positions.length) {
        return;
      }

      let newPositions = rotatePositions(positions, direction);
      let vector = newPositions[0];
      if (vector?.equals(selectedPosition)) {
        newPositions = rotatePositions(newPositions, direction);
        vector = newPositions[0];
      }

      if (vector && !vector.equals(selectedPosition)) {
        setPositions(newPositions);
        AudioPlayer.playSound(direction === 'next' ? 'UI/Next' : 'UI/Previous');
        if (attackable) {
          update({
            position: vector,
          });
        } else {
          const newState = {
            ...(await update(null)),
            ...resetBehavior(),
            selectedPosition: vector,
          };
          update({
            ...newState,
            ...new Base().select(vector, newState, actions),
          });
        }
        scrollIntoView([vector]);
      }
    },
    [
      hasAnimations,
      playerCanEndTurn,
      positions,
      selectedPosition,
      attackable,
      scrollIntoView,
      update,
      actions,
    ],
  );

  useInput(
    'next',
    useCallback(() => {
      if (!hasAnimations) {
        select('next');
      }
    }, [hasAnimations, select]),
  );

  useInput(
    'previous',
    useCallback(() => {
      if (!hasAnimations) {
        select('previous');
      }
    }, [hasAnimations, select]),
  );

  return (
    <MenuButton className={actionButtonStyle}>
      <Icon
        button
        className={cx(
          iconStyle,
          (!positions.length || hasAnimations || !playerCanEndTurn) &&
            disabledButtonStyle,
        )}
        horizontalFlip
        icon={Next}
        onClick={() => select('next')}
      />
    </MenuButton>
  );
};

const EndTurnButton = ({
  actions,
  canEndTurn,
  state,
  subscribe,
}: StateWithActions & {
  canEndTurn: boolean;
  subscribe?: (map: MapData) => Promise<void>;
}) => {
  const { fastForward, scrollIntoView, update } = actions;
  const { currentViewer, lastActionResponse, map, vision } = state;
  const [endTurnIsExpanded, setEndTurnIsExpanded] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState(false);
  const timerRef = useRef<TimerID>();
  const highlightTimerRef = useRef<TimerID>();
  const fastForwardTimer = useRef<TimerID>();
  const [releaseFastForward, setReleaseFastForward] = useState<
    (() => void) | undefined
  >(undefined);

  useEffect(() => {
    if (cooldown) {
      const timer = setTimeout(() => setCooldown(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const ref = useRef<HTMLDivElement>(null);

  if (endTurnIsExpanded && !canEndTurn) {
    setEndTurnIsExpanded(false);
  }

  const availableUnits = getAvailableUnits(map, currentViewer, vision);
  const fastEndTurn =
    canEndTurn &&
    lastActionResponse &&
    lastActionResponse.type !== 'Start' &&
    lastActionResponse.type !== 'EndTurn' &&
    !availableUnits.length;

  const endTurn = useCallback(
    async (event: MouseEvent<SVGElement> | CustomEvent<number>) => {
      if (!canEndTurn || releaseFastForward) {
        return;
      }

      AudioPlayer.playSound('UI/Accept');
      clearTimeout(highlightTimerRef.current);
      if (
        !cooldown &&
        (endTurnIsExpanded || fastEndTurn || event.detail >= 2)
      ) {
        setEndTurnIsExpanded(false);
        setCooldown(true);
        clearTimeout(timerRef.current);
        await endTurnAction(actions, state);
        subscribe?.(state.map);
      } else {
        timerRef.current = setTimeout(() => {
          setEndTurnIsExpanded(true);
          update({ position: null });
          highlightTimerRef.current = setTimeout(() => {
            const { attackable, behavior, radius, selectedPosition } = state;
            const fields = new Map(
              availableUnits.map((vector) => [vector, RadiusItem(vector)]),
            );

            scrollIntoView(availableUnits);
            update({
              attackable: null,
              radius: {
                fields,
                focus: 'unit',
                path: null,
                type: RadiusType.Highlight,
              },
              selectedPosition: null,
            });

            setTimeout(
              () =>
                update((state) =>
                  state.behavior === behavior
                    ? { attackable, radius, selectedPosition }
                    : null,
                ),
              600,
            );
          }, 300);
        }, 150);
      }
    },
    [
      canEndTurn,
      releaseFastForward,
      cooldown,
      endTurnIsExpanded,
      fastEndTurn,
      actions,
      state,
      subscribe,
      update,
      availableUnits,
      scrollIntoView,
    ],
  );

  const onPointerDown = useCallback(() => {
    clearTimeout(fastForwardTimer.current);
    fastForwardTimer.current = setTimeout(() => {
      if (!canEndTurn && !releaseFastForward) {
        setReleaseFastForward(fastForward);
      }
    }, 200);
  }, [canEndTurn, fastForward, releaseFastForward]);

  const onReleaseFastForward = useCallback(() => {
    clearTimeout(fastForwardTimer.current);
    if (releaseFastForward) {
      releaseFastForward();
      // Wait until after the click event fires.
      setTimeout(() => setReleaseFastForward(undefined), 100);
    }
  }, [releaseFastForward]);

  useEffect(() => {
    document.addEventListener('pointerup', onReleaseFastForward);
    return () =>
      document.removeEventListener('pointerup', onReleaseFastForward);
  }, [onReleaseFastForward]);

  useEffect(() => {
    if (endTurnIsExpanded) {
      const listener = (event: Event) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setEndTurnIsExpanded(false);
        }
      };
      document.addEventListener('click', listener);
      return () => {
        clearTimeout(highlightTimerRef.current);
        document.removeEventListener('click', listener);
      };
    }
  }, [endTurnIsExpanded]);

  useInput(
    'secondary',
    useCallback(() => {
      endTurn(new CustomEvent('click', { detail: 1 }));
    }, [endTurn]),
  );
  useInput('cancel', () => setEndTurnIsExpanded(false));

  return (
    <MenuButton
      className={cx(
        actionButtonStyle,
        endTurnButtonStyle,
        endTurnIsExpanded && expandStyle,
      )}
      ref={ref}
    >
      <>
        <div className={textStyle}>
          {lastActionResponse?.type !== 'EndTurn' && availableUnits.length ? (
            <fbt desc="end turn confirmation">
              Skip
              <fbt:plural
                count={availableUnits.length}
                many="available units"
                name="number of units"
                showCount="ifMany"
              >
                one available unit
              </fbt:plural>
              and end turn?
            </fbt>
          ) : (
            <fbt desc="Confirmation to skip the turn">
              Do you want to skip this turn?
            </fbt>
          )}
        </div>
        <Icon
          button
          className={closeIconStyle}
          icon={Close}
          onClick={() => setEndTurnIsExpanded(false)}
        />
      </>
      <Icon
        button
        className={cx(
          iconStyle,
          (!canEndTurn || releaseFastForward) && disabledButtonStyle,
          !!(
            map.round === 1 &&
            fastEndTurn &&
            currentViewer &&
            map.units.some((unit) => map.matchesPlayer(currentViewer, unit))
          ) && RainbowPulseStyle,
        )}
        horizontalFlip
        icon={EndTurn}
        onClick={endTurn}
        onPointerDown={onPointerDown}
      />
    </MenuButton>
  );
};

const preventUndoTypes = new Set(['BeginGame', 'EndTurn', 'Start']);

export default function GameActions({
  actions,
  children,
  hide,
  inset = 0,
  setZoom,
  state,
  subscribe,
  undoTurn,
  zoom,
}: StateWithActions & {
  children?: ReactNode;
  hide?: boolean;
  inset?: number;
  setZoom?: SetZoomFn;
  subscribe?: (map: MapData) => Promise<void>;
  undoTurn?: () => void | Promise<void>;
  zoom: number;
}) {
  const {
    inlineUI,
    lastActionResponse,
    map,
    paused,
    preventRemoteActions,
    zIndex,
  } = state;
  const maxZoom = useScale() + 1;
  const playerCanEndTurn =
    !preventRemoteActions && !paused && canEndTurn(state);
  const canUndo =
    undoTurn &&
    playerCanEndTurn &&
    lastActionResponse &&
    !preventUndoTypes.has(lastActionResponse.type);

  const undo = useCallback(() => {
    if (canUndo && undoTurn) {
      AudioPlayer.playSound('UI/Accept');
      undoTurn();
    }
  }, [canUndo, undoTurn]);
  useInput('undo', undo);

  const replayBar = (
    <ReplayBar
      actions={actions}
      currentPlayer={map.getCurrentPlayer()}
      currentViewer={state.currentViewer}
      replayState={state.replayState}
      timeout={state.timeout}
    />
  );

  const content = (
    <div
      className={cx(maybeFade(hide), containerStyle)}
      style={!inlineUI ? insetStyle(inset) : undefined}
    >
      {undoTurn && (
        <MenuButton className={cx(actionButtonStyle, undoButtonStyle)}>
          <Icon
            button
            className={cx(iconStyle, !canUndo && disabledButtonStyle)}
            horizontalFlip
            icon={Forward}
            onClick={undo}
          />
        </MenuButton>
      )}
      {setZoom && (
        <ZoomButton
          className={cx(
            inlineUI && (undoTurn ? inlineZoomButtonStyle : undoButtonStyle),
          )}
          hide={false}
          max={maxZoom}
          setZoom={setZoom}
          zoom={zoom}
        />
      )}
      <InfoButton actions={actions} state={state} />
      <EndTurnButton
        actions={actions}
        canEndTurn={playerCanEndTurn}
        state={state}
        subscribe={subscribe}
      />
      <AttackRadiusButton
        actions={actions}
        playerCanEndTurn={playerCanEndTurn}
        state={state}
      />
      <NextButton
        actions={actions}
        playerCanEndTurn={playerCanEndTurn}
        state={state}
      />
      {children}
    </div>
  );

  return inlineUI ? (
    <>
      <div className={inlineContainerStyle} style={{ zIndex: zIndex - 1 }}>
        {content}
      </div>
      <div
        className={cx(inlineContainerStyle, replayBarStyle)}
        style={{ zIndex: zIndex - 1 }}
      >
        {replayBar}
      </div>
    </>
  ) : (
    <Portal>
      {content}
      {replayBar}
    </Portal>
  );
}

const size = DoubleSize;
const vars = new CSSVariables<'multiplier'>('ga');

const inlineContainerStyle = css`
  inset: 0;
  pointer-events: none;
  position: absolute;
  transform: translate3d(76px, 0, 0);
  zoom: 0.333334;
`;

const replayBarStyle = css`
  transform: translate3d(0, -76px, 0);
`;

const containerStyle = css`
  ${vars.set('multiplier', 0.9)}

  ${Breakpoints.height.sm} {
    ${vars.set('multiplier', 1)}
  }
`;

const endTurnButtonStyle = css`
  bottom: calc(${applyVar('inset')});
  color: transparent;
  overflow: hidden;
  pointer-events: auto;
  right: calc(${applyVar('inset')} + env(safe-area-inset-right));
  transition:
    width 300ms ease,
    color 75ms ease 0ms;
  z-index: calc(${applyVar('inset-z')} + 2);
`;

const actionButtonStyle = css`
  bottom: calc(
    (${size * 1.5}px * ${vars.apply('multiplier')}) + ${applyVar('inset')}
  );
  pointer-events: auto;
  right: calc(${applyVar('inset')} + env(safe-area-inset-right));
  z-index: calc(${applyVar('inset-z')} + 2);
`;

const attackRadiusButtonStyle = css`
  bottom: calc(
    (${size * 3}px * ${vars.apply('multiplier')}) + ${applyVar('inset')}
  );
`;

const infoButtonStyle = css`
  bottom: calc(
    (${size * 4.5}px * ${vars.apply('multiplier')}) + ${applyVar('inset')}
  );
`;

const undoButtonStyle = css`
  bottom: calc(
    (${size * 6}px * ${vars.apply('multiplier')}) + ${applyVar('inset')}
  );
  pointer-events: auto;
  top: auto;
`;

const inlineZoomButtonStyle = css`
  bottom: calc(
    (${size * 7.5}px * ${vars.apply('multiplier')}) + ${applyVar('inset')}
  );
  pointer-events: auto;
  top: auto;
`;

const expandStyle = css`
  color: ${applyVar('text-color')};
  transition:
    width 300ms ease,
    color 150ms ease 150ms;
  width: 100%;

  ${Breakpoints.xs} {
    width: 320px;
  }
`;

const iconStyle = css`
  box-sizing: content-box;
  color: ${applyVar('text-color')};
  height: ${size}px;
  position: absolute;
  right: 0;
  top: 0;
`;

const closeIconStyle = css`
  box-sizing: content-box;
  height: ${size}px;
  padding: 0;
  position: absolute;
  right: ${size}px;
`;

const disabledButtonStyle = css`
  opacity: 0.5;

  &:hover {
    color: ${applyVar('text-color')};
    transform: scaleX(1) scaleY(1);
  }

  &:active {
    transform: scaleX(1) scaleY(1);
  }
`;

const textStyle = css`
  position: absolute;
  font-size: 0.3em;
  top: 3px;
  left: 40px;
  line-height: 1.4em;
  margin-right: 95px;

  ${Breakpoints.xs} {
    left: 4px;
  }
`;
