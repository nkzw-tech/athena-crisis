import { Ability } from '@deities/athena/info/Unit.tsx';
import getAvailableUnitActions from '@deities/athena/lib/getAvailableUnitActions.tsx';
import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import Player, { PlayerID } from '@deities/athena/map/Player.tsx';
import Vector, { sortVectors } from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { attackable, RadiusItem } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import { UndoType } from '@deities/hermes/game/undo.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { NativeTimeout } from '@deities/ui/controls/throttle.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar, CSSVariables, insetStyle } from '@deities/ui/cssVar.tsx';
import useScale from '@deities/ui/hooks/useScale.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Info from '@deities/ui/icons/Info.tsx';
import Undo from '@deities/ui/icons/Undo.tsx';
import MenuButton from '@deities/ui/MenuButton.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { RainbowPulseStyle } from '@deities/ui/PulseStyle.tsx';
import { css, cx } from '@emotion/css';
import Attack from '@iconify-icons/pixelarticons/bullseye-arrow.js';
import Close from '@iconify-icons/pixelarticons/close.js';
import Download from '@iconify-icons/pixelarticons/download.js';
import Forward from '@iconify-icons/pixelarticons/forward.js';
import EndTurn from '@iconify-icons/pixelarticons/reply-all.js';
import Next from '@iconify-icons/pixelarticons/reply.js';
import {
  MouseEvent,
  ReactNode,
  RefObject,
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
import NullBehavior from '../behavior/NullBehavior.tsx';
import { SetZoomFn } from '../editor/hooks/useZoom.tsx';
import ZoomButton from '../editor/lib/ZoomButton.tsx';
import toTransformOrigin from '../lib/toTransformOrigin.tsx';
import { RadiusType } from '../Radius.tsx';
import { StateWithActions } from '../Types.tsx';
import maybeFade from './lib/maybeFade.tsx';
import ReplayBar from './ReplayBar.tsx';

const InfoButton = ({
  actions: { showGameInfo },
  bottom,
  fade,
  state: { gameInfoState },
}: StateWithActions & Readonly<{ bottom?: true; fade?: boolean }>) => {
  useInput('detail', () => {
    if (!gameInfoState) {
      showGameInfo({
        origin: 'center center',
        type: 'game-info',
      });
    }
  });

  return (
    <MenuButton
      className={cx(actionButtonStyle, !bottom && infoButtonStyle)}
      fade={fade}
    >
      <Icon
        button
        className={cx(iconStyle)}
        icon={Info}
        onClick={(event) => {
          AudioPlayer.playSound('UI/Accept');
          showGameInfo({
            origin: toTransformOrigin(event),
            type: 'game-info',
          });
        }}
      />
    </MenuButton>
  );
};

const AttackRadiusButton = ({
  actions: { update },
  fade,
  playerCanEndTurn,
  state: { behavior, currentViewer, map },
}: StateWithActions & { fade?: boolean; playerCanEndTurn: boolean | null }) => {
  const fields = useMemo(
    () =>
      currentViewer
        ? new Map(
            map.units
              .filter(
                (unit) =>
                  map.isNonNeutralOpponent(currentViewer, unit) &&
                  unit.info.hasAttack() &&
                  (!unit.info.hasAbility(Ability.Unfold) || unit.isUnfolded()),
              )
              .flatMap((unit, vector) => attackable(map, unit, vector, 'cost')),
          )
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

  useInput('gamepad:tertiary', show);
  useInput('keyboard:tertiary', show);

  return (
    <MenuButton
      className={cx(actionButtonStyle, attackRadiusButtonStyle)}
      fade={fade}
    >
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

const useExpandable = (
  ref: RefObject<HTMLElement | null>,
  canExpand: boolean,
) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (isExpanded && !canExpand) {
    setIsExpanded(false);
  }

  useEffect(() => {
    if (isExpanded) {
      const listener = (event: Event) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setIsExpanded(false);
        }
      };

      document.addEventListener('click', listener);
      return () => {
        document.removeEventListener('click', listener);
      };
    }
  }, [ref, isExpanded]);
  useInput('cancel', () => setIsExpanded(false));

  return [isExpanded, setIsExpanded] as const;
};

const NextButton = ({
  actions,
  fade,
  playerCanEndTurn,
  state,
}: StateWithActions & { fade?: boolean; playerCanEndTurn: boolean | null }) => {
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
        scrollIntoView([vector], true);
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
    <MenuButton className={cx(actionButtonStyle, nextButtonStyle)} fade={fade}>
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

const ReplayDownloadButton = ({
  fade,
  onClick,
}: {
  fade?: boolean;
  onClick: () => void;
}) => (
  <MenuButton className={cx(actionButtonStyle, nextButtonStyle)} fade={fade}>
    <Icon
      button
      className={cx(iconStyle)}
      horizontalFlip
      icon={Download}
      onClick={onClick}
    />
  </MenuButton>
);

const EndTurnButton = ({
  actions,
  canEndTurn,
  fade,
  state,
  subscribe,
}: StateWithActions & {
  canEndTurn: boolean;
  fade?: boolean;
  subscribe?: (map: MapData) => Promise<void>;
}) => {
  const { scrollIntoView, update } = actions;
  const { currentViewer, lastActionResponse, map, vision } = state;
  const ref = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useExpandable(ref, canEndTurn);
  const [cooldown, setCooldown] = useState(false);
  const timerRef = useRef<NativeTimeout>(null);
  const highlightTimerRef = useRef<NativeTimeout>(null);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (cooldown) {
      const timer = setTimeout(() => setCooldown(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const availableUnits = getAvailableUnits(map, currentViewer, vision);
  const fastEndTurn =
    canEndTurn &&
    lastActionResponse &&
    lastActionResponse.type !== 'Start' &&
    lastActionResponse.type !== 'EndTurn' &&
    !availableUnits.length;

  const endTurn = useCallback(
    async (event: MouseEvent<SVGElement> | CustomEvent<number>) => {
      if (!canEndTurn) {
        return;
      }

      AudioPlayer.playSound('UI/Accept');
      if (highlightTimerRef.current != null) {
        clearTimeout(highlightTimerRef.current);
      }
      if (!cooldown && (isExpanded || fastEndTurn || event.detail >= 2)) {
        setIsExpanded(false);
        setCooldown(true);
        if (timerRef.current != null) {
          clearTimeout(timerRef.current);
        }
        await endTurnAction(actions, state);
        subscribe?.(state.map);
      } else {
        timerRef.current = setTimeout(() => {
          setIsExpanded(true);
          update({ position: null });
          highlightTimerRef.current = setTimeout(() => {
            const { attackable, behavior, radius, selectedPosition } = state;
            const fields = new Map(
              availableUnits.map((vector) => [vector, RadiusItem(vector)]),
            );

            scrollIntoView(availableUnits, true);
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
      cooldown,
      isExpanded,
      fastEndTurn,
      setIsExpanded,
      actions,
      state,
      subscribe,
      update,
      availableUnits,
      scrollIntoView,
    ],
  );

  useInput(
    'secondary',
    useCallback(() => {
      endTurn(new CustomEvent('click', { detail: 1 }));
    }, [endTurn]),
  );

  return (
    <MenuButton
      className={cx(
        actionButtonStyle,
        endTurnButtonStyle,
        isExpanded && expandStyle,
      )}
      fade={fade}
      ref={ref}
    >
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
        onClick={() => setIsExpanded(false)}
      />
      <Icon
        button
        className={cx(
          iconStyle,
          !canEndTurn && disabledButtonStyle,
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
      />
    </MenuButton>
  );
};

export type UndoOptions = Readonly<{
  onCancel?: () => void;
}>;

const UndoButton = ({
  canUndo,
  canUndoAction,
  fade,
  undo,
}: {
  canUndo: boolean;
  canUndoAction: boolean;
  fade?: boolean;
  undo: (type: UndoType, options?: UndoOptions) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useExpandable(ref, canUndo);

  const toggle = useCallback(() => {
    if (!canUndoAction) {
      undo('Turn');
    } else if (isExpanded) {
      undo('Action');
    } else {
      setIsExpanded(true);
    }
  }, [canUndoAction, isExpanded, undo, setIsExpanded]);

  useInput('undo', toggle);

  useEffect(() => {
    const keydownListener = (event: KeyboardEvent) => {
      if (!canUndo || !canUndoAction) {
        return;
      }

      const metaKey = event.metaKey || event.ctrlKey;
      // Use `event.key` to ensure consistency on qwertz keyboards.
      if (metaKey && event.key === 'z') {
        event.preventDefault();
        undo('Action');
      }
    };

    document.addEventListener('keydown', keydownListener);
    return () => {
      document.removeEventListener('keydown', keydownListener);
    };
  }, [canUndo, canUndoAction, undo]);

  return (
    <MenuButton
      className={cx(
        actionButtonStyle,
        endTurnButtonStyle,
        undoButtonStyle,
        isExpanded && undoExpandStyle,
      )}
      fade={fade}
      ref={ref}
    >
      {canUndoAction && (
        <>
          <Icon button icon={Close} onClick={() => setIsExpanded(false)} />
          <Icon
            button
            horizontalFlip
            icon={Undo}
            onClick={() => undo('Turn')}
          />
        </>
      )}
      <Icon
        button
        className={cx(iconStyle, !canUndo && disabledButtonStyle)}
        horizontalFlip
        icon={canUndoAction ? Forward : Undo}
        onClick={toggle}
      />
    </MenuButton>
  );
};

const preventUndoTypes = new Set(['BeginGame', 'EndTurn', 'Start']);

export default function GameActions({
  actions,
  canUndoAction = true,
  children,
  fade,
  hide,
  inset = 0,
  onDownloadReplay,
  setZoom,
  state,
  subscribe,
  undo,
  zoom,
}: StateWithActions & {
  canUndoAction: boolean;
  children?: ReactNode;
  fade?: boolean;
  hide?: boolean;
  inset?: number;
  onDownloadReplay?: () => void;
  setZoom?: SetZoomFn;
  subscribe?: (map: MapData) => Promise<void>;
  undo?: (type: UndoType, options?: UndoOptions) => void | Promise<void>;
  zoom: number;
}) {
  const { update } = actions;
  const {
    currentViewer,
    inlineUI,
    lastActionResponse,
    map,
    paused,
    preventRemoteActions,
    replayState,
    timeout,
    timer,
    zIndex,
  } = state;

  const hasEnded = lastActionResponse?.type === 'GameEnd';
  const maxZoom = useScale() + 1;
  const playerCanEndTurn =
    !preventRemoteActions && !paused && canEndTurn(state);
  const viewerPlayer =
    currentViewer != null ? map.maybeGetPlayer(currentViewer) : null;
  const canUndo = !!(
    undo &&
    !hasEnded &&
    viewerPlayer?.isHumanPlayer() &&
    viewerPlayer.crystal == null &&
    playerCanEndTurn &&
    lastActionResponse &&
    !preventUndoTypes.has(lastActionResponse.type)
  );

  const onUndo = useCallback(
    (type: UndoType, options?: UndoOptions) => {
      if (canUndo && undo) {
        AudioPlayer.playSound('UI/Accept');
        update(resetBehavior(NullBehavior));
        undo(type, {
          ...options,
          onCancel: () => update(resetBehavior()),
        });
      }
    },
    [canUndo, undo, update],
  );

  const replayBar = !hasEnded && (
    <ReplayBar
      actions={actions}
      currentPlayer={map.getCurrentPlayer()}
      currentViewer={currentViewer}
      inlineUI={inlineUI}
      replayState={replayState}
      timeout={timeout}
      timer={timer}
    />
  );

  const content = (
    <>
      <div
        className={cx(maybeFade(hide), containerStyle)}
        style={!inlineUI ? insetStyle(inset) : undefined}
      >
        {setZoom && (
          <ZoomButton
            className={cx(
              actionButtonStyle,
              undo ? zoomButtonStyle : undoButtonStyle,
            )}
            fade={fade}
            hide={false}
            max={maxZoom}
            position="auto"
            setZoom={setZoom}
            zoom={zoom}
          />
        )}
        {undo && (
          <UndoButton
            canUndo={canUndo}
            canUndoAction={canUndoAction}
            fade={fade}
            undo={onUndo}
          />
        )}
        <InfoButton actions={actions} fade={fade} state={state} />
        <AttackRadiusButton
          actions={actions}
          fade={fade}
          playerCanEndTurn={playerCanEndTurn}
          state={state}
        />
        <NextButton
          actions={actions}
          fade={fade}
          playerCanEndTurn={playerCanEndTurn}
          state={state}
        />
        <EndTurnButton
          actions={actions}
          canEndTurn={playerCanEndTurn}
          fade={fade}
          state={state}
          subscribe={subscribe}
        />
        {children}
      </div>
      {hide && hasEnded && (
        <div
          className={containerStyle}
          style={!inlineUI ? insetStyle(inset) : undefined}
        >
          {onDownloadReplay && (
            <ReplayDownloadButton fade={fade} onClick={onDownloadReplay} />
          )}
          <InfoButton actions={actions} bottom fade={fade} state={state} />
        </div>
      )}
    </>
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
const vars = new CSSVariables<'multiplier' | 'bottom-offset'>('ga');

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

const actionButtonStyle = css`
  ${vars.set('bottom-offset', 0)}

  pointer-events: auto;
  right: calc(${applyVar('inset')} + env(safe-area-inset-right));
  z-index: calc(${applyVar('inset-z')} + 2);

  bottom: calc(
    ${applyVar('safe-area-bottom')} +
      (${vars.apply('bottom-offset')} * ${size - 6}px) + ${applyVar('inset')}
  );
  ${Breakpoints.height.xs} {
    bottom: calc(
      ${applyVar('safe-area-bottom')} +
        (${vars.apply('bottom-offset')} * ${size - 4}px) + ${applyVar('inset')}
    );
  }
`;

const endTurnButtonStyle = css`
  color: transparent;
  overflow: hidden;
  pointer-events: auto;
  transition:
    width 300ms ease,
    color 75ms ease 0ms;
`;

const nextButtonStyle = css`
  ${vars.set('bottom-offset', 1.5)}
`;

const infoButtonStyle = css`
  ${vars.set('bottom-offset', 3)}
`;

const attackRadiusButtonStyle = css`
  ${vars.set('bottom-offset', 4.5)}
`;

const undoButtonStyle = css`
  ${vars.set('bottom-offset', 6)}
`;

const zoomButtonStyle = css`
  ${vars.set('bottom-offset', 7.5)}
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

const undoExpandStyle = css`
  color: ${applyVar('text-color')};
  transition:
    width 300ms ease,
    color 150ms ease 150ms;
  width: 148px;
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
