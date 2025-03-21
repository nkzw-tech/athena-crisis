import { Effect, Scenario } from '@deities/apollo/Effects.tsx';
import { ResizeOrigin } from '@deities/apollo/lib/resizeMap.tsx';
import MapData, { SizeVector } from '@deities/athena/MapData.tsx';
import Box from '@deities/ui/Box.tsx';
import Breakpoints, { lg, sm, xl } from '@deities/ui/Breakpoints.tsx';
import Button from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Dropdown from '@deities/ui/Dropdown.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import useMedia from '@deities/ui/hooks/useMedia.tsx';
import usePress, { UsePressProps } from '@deities/ui/hooks/usePress.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InlineLink, { KeyboardShortcut } from '@deities/ui/InlineLink.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import Bottom from '@iconify-icons/pixelarticons/layout-footer.js';
import Left from '@iconify-icons/pixelarticons/layout-sidebar-left.js';
import More from '@iconify-icons/pixelarticons/more-vertical.js';
import isPresent from '@nkzw/core/isPresent.js';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { fbt } from 'fbtee';
import { RefObject, useCallback, useRef } from 'react';
import Drawer, { DrawerPosition } from '../../drawer/Drawer.tsx';
import { UserWithUnlocks } from '../../hooks/useUserMap.tsx';
import { StateWithActions } from '../../Types.tsx';
import replaceEffect from '../lib/replaceEffect.tsx';
import { BaseMapEditorProps } from '../MapEditor.tsx';
import {
  EditorHistory,
  EditorState,
  MapObject,
  MapPerformanceMetricsEstimationFunction,
  PreviousMapEditorState,
  SaveMapFunction,
  SetEditorStateFunction,
  SetMapFunction,
} from '../Types.tsx';
import DecoratorPanel from './DecoratorPanel.tsx';
import DesignPanel from './DesignPanel.tsx';
import EffectsPanel from './EffectsPanel.tsx';
import EntityPanel from './EntityPanel.tsx';
import EvaluationPanel from './EvaluationPanel.tsx';
import MapEditorSettingsPanel from './MapEditorSettingsPanel.tsx';
import ObjectivePanel from './ObjectivePanel.tsx';
import RestrictionsPanel from './RestrictionsPanel.tsx';
import SetupPanel from './SetupPanel.tsx';

export default function MapEditorControlPanel({
  actions,
  campaignLock,
  drawerPosition,
  editor,
  editorHistory,
  estimateMapPerformance,
  expand,
  fillMap,
  inset = 0,
  isAdmin,
  mapName,
  mapObject,
  previousState,
  resetMap,
  resize,
  restorePreviousState,
  saveMap,
  setDrawerPosition,
  setEditorState,
  setMap,
  setMapName,
  setTags,
  state,
  tags,
  togglePlaytest,
  user,
  visible,
}: StateWithActions & {
  campaignLock: BaseMapEditorProps['campaignLock'];
  drawerPosition: DrawerPosition;
  editor: EditorState;
  editorHistory: RefObject<EditorHistory>;
  estimateMapPerformance?: MapPerformanceMetricsEstimationFunction;
  expand: boolean;
  fillMap: () => void;
  inset?: number;
  isAdmin?: boolean;
  mapName: string;
  mapObject?: MapObject | null;
  previousState: PreviousMapEditorState | null;
  resetMap: () => void;
  resize: (size: SizeVector, origin: Set<ResizeOrigin>) => void;
  restorePreviousState: () => void;
  saveMap: SaveMapFunction;
  setDrawerPosition: (position: DrawerPosition) => void;
  setEditorState: SetEditorStateFunction;
  setMap: SetMapFunction;
  setMapName: (name: string) => void;
  setTags: (tags: ReadonlyArray<string>) => void;
  tags: ReadonlyArray<string>;
  togglePlaytest: (
    map: MapData,
    _?: boolean,
    actAsEveryPlayer?: boolean,
  ) => void;
  user: UserWithUnlocks;
  visible: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const updateEffect = useCallback(
    (effect: Effect) => {
      const { effect: currentEffect, trigger } = editor.scenario;
      setEditorState({
        action: editor.action
          ? { ...editor.action, action: effect.actions[editor.action.actionId] }
          : undefined,
        effects: replaceEffect(editor.effects, trigger, currentEffect, effect),
        scenario: { effect, trigger },
      });
    },
    [editor.action, editor.effects, editor.scenario, setEditorState],
  );
  const setScenario = useCallback(
    (scenario: Scenario) => setEditorState({ scenario }),
    [setEditorState],
  );
  const canEditPerformance = !!(
    campaignLock || mapObject?.campaigns.edges?.length
  );

  return (
    <Drawer
      expand={expand}
      inset={inset}
      mode={editor.mode}
      position={drawerPosition}
      ref={ref}
      sidebar={
        <Sidebar
          actions={actions}
          editor={editor}
          expand={expand}
          mapObject={mapObject}
          position={drawerPosition}
          previousState={previousState}
          resetMap={resetMap}
          restorePreviousState={restorePreviousState}
          setEditorState={setEditorState}
          setPosition={setDrawerPosition}
          state={state}
          togglePlaytest={togglePlaytest}
        />
      }
      visible={visible}
    >
      {(() => {
        const { mode } = editor;
        switch (mode) {
          case 'design': {
            return (
              <DesignPanel
                actions={actions}
                config={state.map.config}
                currentPlayer={state.map.getCurrentPlayer()}
                drawingMode={editor.drawingMode}
                fillMap={fillMap}
                hasContentRestrictions={!isAdmin}
                selected={editor.selected}
                setEditorState={setEditorState}
                user={user}
              />
            );
          }
          case 'decorators': {
            return (
              <DecoratorPanel
                actions={actions}
                editor={editor}
                setEditorState={setEditorState}
                state={state}
              />
            );
          }
          case 'entity':
            return (
              <EntityPanel
                actions={actions}
                editor={editor}
                editorHistory={editorHistory}
                key={String(state.selectedPosition)}
                state={state}
              />
            );
          case 'effects':
            return (
              <EffectsPanel
                editor={editor}
                hasContentRestrictions={!isAdmin}
                isAdmin={isAdmin}
                map={state.map}
                position={drawerPosition}
                scenario={editor.scenario}
                scrollRef={ref}
                setEditorState={setEditorState}
                setMap={setMap}
                setScenario={setScenario}
                updateEffect={updateEffect}
                user={user}
              />
            );
          case 'objectives':
            return (
              <ObjectivePanel
                actions={actions}
                campaignEdges={mapObject?.campaigns.edges}
                canEditPerformance={canEditPerformance}
                editor={editor}
                hasContentRestrictions={!isAdmin}
                isAdmin={isAdmin}
                mapId={mapObject?.id}
                setEditorState={setEditorState}
                state={state}
                tags={tags}
                user={user}
              />
            );
          case 'restrictions':
            return (
              <RestrictionsPanel
                actions={actions}
                editor={editor}
                hasContentRestrictions={!isAdmin}
                setEditorState={setEditorState}
                state={state}
                user={user}
              />
            );
          case 'evaluation':
            return (
              <EvaluationPanel
                actions={actions}
                editor={editor}
                state={state}
              />
            );
          case 'settings':
            return (
              <MapEditorSettingsPanel
                actions={actions}
                canEditPerformance={canEditPerformance}
                estimateMapPerformance={estimateMapPerformance}
                isAdmin={isAdmin}
                mapName={mapName}
                mapObject={mapObject}
                resize={resize}
                saveMap={saveMap}
                setEditorState={setEditorState}
                setMap={setMap}
                setMapName={setMapName}
                setTags={setTags}
                state={state}
                tags={tags}
                user={user}
              />
            );
          case 'setup':
            return <SetupPanel setMap={setMap} state={state} />;
          default: {
            mode satisfies never;
            throw new UnknownTypeError('MapEditorControlPanel', mode);
          }
        }
      })()}
    </Drawer>
  );
}

const Sidebar = ({
  editor,
  expand,
  mapObject,
  position,
  previousState,
  resetMap,
  restorePreviousState,
  setEditorState,
  setPosition,
  state,
  togglePlaytest,
}: StateWithActions & {
  editor: EditorState;
  expand: boolean;
  mapObject?: MapObject | null;
  position: DrawerPosition;
  previousState: PreviousMapEditorState | null;
  resetMap: () => void;
  restorePreviousState: () => void;
  setEditorState: SetEditorStateFunction;
  setPosition: (position: DrawerPosition) => void;
  togglePlaytest: (
    map: MapData,
    _?: boolean,
    actAsEveryPlayer?: boolean,
  ) => void;
}) => {
  const { alert } = useAlert();
  const isBottom = position === 'bottom';
  const drawerIsLarge = isBottom || expand;
  const isMedium = useMedia(`(min-width: ${sm}px)`);
  const isLarge = useMedia(`(min-width: ${lg}px)`);
  const isXLarge = useMedia(`(min-width: ${xl}px)`);
  const secondaryWidthCheck = isBottom
    ? isMedium
    : drawerIsLarge
      ? isLarge
      : isXLarge;
  const partition = drawerIsLarge && isLarge ? 4 : secondaryWidthCheck ? 3 : 2;

  const buttonProps = usePress({
    onLongPress: useCallback(() => {
      alert({
        onAccept: () => togglePlaytest(state.map, undefined, true),
        text: fbt(
          'Would you like to control every player while playtesting?',
          'Playtest explanation',
        ),
        title: fbt('Player Control', 'Headline for playtest for every player'),
      });
    }, [alert, state.map, togglePlaytest]),
    onPress: () => togglePlaytest(state.map),
  })() as UsePressProps & { onClick: () => void };

  const menu = [
    <InlineLink
      className={linkStyle}
      key="design"
      onClick={() => setEditorState({ mode: 'design' })}
      selectedText={editor.mode === 'design'}
    >
      <KeyboardShortcut shortcut="d" />
      <span className={textStyle}>
        <fbt desc="Button to switch to design mode">Design</fbt>
      </span>
    </InlineLink>,
    <InlineLink
      className={linkStyle}
      key="entity"
      onClick={() => setEditorState({ mode: 'entity' })}
      selectedText={editor.mode === 'entity'}
    >
      <KeyboardShortcut shortcut="e" />
      <span className={textStyle}>
        <fbt desc="Button to switch to entity mode">Entities</fbt>
      </span>
    </InlineLink>,
    <InlineLink
      className={linkStyle}
      key="effects"
      onClick={() => setEditorState({ mode: 'effects' })}
      selectedText={editor.mode === 'effects'}
    >
      <KeyboardShortcut shortcut="f" />
      <span className={textStyle}>
        <fbt desc="Button to change map effects">Effects</fbt>
      </span>
    </InlineLink>,
    <InlineLink
      className={linkStyle}
      key="settings"
      onClick={() => setEditorState({ mode: 'settings' })}
      selectedText={editor.mode === 'settings'}
    >
      <KeyboardShortcut shortcut="s" />
      <span className={textStyle}>
        <fbt desc="Button to change map settings">Settings</fbt>
      </span>
    </InlineLink>,
    <InlineLink
      className={linkStyle}
      key="setup"
      onClick={() => setEditorState({ mode: 'setup' })}
      selectedText={editor.mode === 'setup'}
    >
      <KeyboardShortcut shortcut="t" />
      <span className={textStyle}>
        <fbt desc="Button to change map setup">Setup</fbt>
      </span>
    </InlineLink>,
    <InlineLink
      className={linkStyle}
      key="decorators"
      onClick={() => setEditorState({ mode: 'decorators' })}
      selectedText={editor.mode === 'decorators'}
    >
      <KeyboardShortcut shortcut="c" />
      <span className={textStyle}>
        <fbt desc="Button to change map decorators">Decorations</fbt>
      </span>
    </InlineLink>,
    <InlineLink
      className={linkStyle}
      key="objectives"
      onClick={() => setEditorState({ mode: 'objectives' })}
      selectedText={editor.mode === 'objectives'}
    >
      <KeyboardShortcut shortcut="o" />
      <span className={textStyle}>
        <fbt desc="Button to change map objectives">Objectives</fbt>
      </span>
    </InlineLink>,
    <InlineLink
      className={linkStyle}
      key="restrictions"
      onClick={() => setEditorState({ mode: 'restrictions' })}
      selectedText={editor.mode === 'restrictions'}
    >
      <KeyboardShortcut shortcut="r" />
      <span className={textStyle}>
        <fbt desc="Button to change map restrictions">Restrictions</fbt>
      </span>
    </InlineLink>,
    <InlineLink
      className={linkStyle}
      key="evaluation"
      onClick={() => setEditorState({ mode: 'evaluation' })}
      selectedText={editor.mode === 'evaluation'}
    >
      <KeyboardShortcut shortcut="v" />
      <span className={textStyle}>
        <fbt desc="Button to evaluate a map">Evaluate</fbt>
      </span>
    </InlineLink>,
    <InlineLink
      className={linkStyle}
      key="reset"
      onClick={() =>
        alert({
          onAccept: resetMap,
          text: mapObject
            ? String(
                fbt(
                  'Reset the map to its initial state?',
                  'Confirmation dialog to reset the map in the editor',
                ),
              )
            : String(
                fbt(
                  'Discard this map and create a new one?',
                  'Confirmation dialog to discard the map in the editor',
                ),
              ),
        })
      }
    >
      <span className={textStyle}>
        {mapObject ? (
          <fbt desc="Button to reset the map">Reset Map</fbt>
        ) : (
          <fbt desc="Button to create a new map">New Map</fbt>
        )}
      </span>
    </InlineLink>,
    previousState && previousState.map != state.map ? (
      <InlineLink
        className={linkStyle}
        key="restore"
        onClick={() => restorePreviousState()}
      >
        <span className={textStyle}>
          <fbt desc="Button to restore the map">Restore</fbt>
        </span>
      </InlineLink>
    ) : null,
  ].filter(isPresent);

  const primary = menu.slice(0, partition);
  const secondary = menu.slice(partition);

  // Move a secondary item into the primary menu if it's currently selected.
  const index = secondary.findIndex(({ key }) => key === editor.mode);
  if (index > -1) {
    const last = primary.at(-1)!;
    primary[primary.length - 1] = secondary[index];
    secondary.splice(index, 1);
    secondary.unshift(last);
  }

  if (isMedium) {
    secondary.unshift(
      <Stack gap key="icons" reverse start>
        <InlineLink
          onClick={() => setPosition('left')}
          selected={position === 'left'}
        >
          <Icon icon={Left} />
        </InlineLink>
        <InlineLink
          onClick={() => setPosition('bottom')}
          selected={position === 'bottom'}
        >
          <Icon icon={Bottom} />
        </InlineLink>
      </Stack>,
    );
  }

  return (
    <Stack alignCenter className={topPaddingStyle} flex1 gap={16} nowrap>
      <Stack className={boxShadowStyle} flex1 nowrap>
        <Box alignCenter flex1 gap={16} nowrap>
          {primary}
          {secondary.length && (
            <Dropdown
              className={moreContainerStyle}
              dropdownClassName={moreStyle}
              title={<Icon icon={More} />}
            >
              <Box
                className={cx(moreInnerStyle, 'dropdown-content')}
                gap
                nowrap
                vertical
              >
                {secondary}
              </Box>
            </Dropdown>
          )}
        </Box>
      </Stack>
      <Stack className={boxShadowStyle}>
        <Button className={buttonStyle} {...buttonProps}>
          <KeyboardShortcut button shortcut="p" />
          {partition <= 3 ? (
            <fbt desc="Button to playtest a map">Test</fbt>
          ) : (
            <fbt desc="Button to playtest a map">Playtest</fbt>
          )}
        </Button>
      </Stack>
    </Stack>
  );
};

const boxShadowStyle = css`
  backdrop-filter: blur(4px);
  box-shadow: ${applyVar('border-color-light')} 0 8px 10px;
`;

const topPaddingStyle = css`
  padding-top: 24px;
`;

const linkStyle = css`
  position: relative;

  ${Breakpoints.sm} {
    padding-left: 28px;
  }
`;

const buttonStyle = css`
  min-width: fit-content;
  position: relative;

  ${Breakpoints.sm} {
    padding-left: 40px;
  }
`;

const moreContainerStyle = css`
  display: inline-flex;
`;

const moreStyle = css`
  right: -12px;
  top: 8px;
  z-index: 100;
`;

const moreInnerStyle = css`
  ${pixelBorder(applyVar('background-color'))}
  background: ${applyVar('background-color')};

  overflow-y: auto;
  white-space: nowrap;

  width: 200px;
  max-height: 180px;
`;

const textStyle = css`
  min-height: 24px;
  overflow-x: hidden;
  position: relative;
  text-overflow: ellipsis;
  white-space: nowrap;

  max-width: 20vw;
  .dropdown-content & {
    max-width: 200px;
  }

  ${Breakpoints.xs} {
    .dropdown-content & {
      max-width: 200px;
    }
  }

  ${Breakpoints.xs} {
    max-width: 30vw;
  }

  ${Breakpoints.sm} {
    max-width: auto;
  }
`;
