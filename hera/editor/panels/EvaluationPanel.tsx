import { GameEndActionResponse } from '@deities/apollo/Objective.tsx';
import createBotWithName from '@deities/athena/lib/createBotWithName.tsx';
import dropInactivePlayers from '@deities/athena/lib/dropInactivePlayers.tsx';
import startGame from '@deities/athena/lib/startGame.tsx';
import updateActivePlayers from '@deities/athena/lib/updateActivePlayers.tsx';
import validateMap from '@deities/athena/lib/validateMap.tsx';
import { toTeamArray } from '@deities/athena/map/Team.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import { ClientGame } from '@deities/hermes/game/toClientGame.tsx';
import Box from '@deities/ui/Box.tsx';
import ErrorText from '@deities/ui/ErrorText.tsx';
import Spinner from '@deities/ui/Spinner.tsx';
import { css } from '@emotion/css';
import groupBy from '@nkzw/core/groupBy.js';
import sortBy from '@nkzw/core/sortBy.js';
import Stack, { VStack } from '@nkzw/stack';
import { List } from 'fbtee';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import useClientGameAction from '../../hooks/useClientGameAction.tsx';
import getTranslatedFactionName from '../../lib/getTranslatedFactionName.tsx';
import { StateWithActions } from '../../Types.tsx';
import MiniPlayerIcon from '../../ui/MiniPlayerIcon.tsx';
import { EditorState } from '../Types.tsx';

type Result = Readonly<{
  actionResponse: GameEndActionResponse;
  turns: number;
}>;

const RUNS = 10;

const Rounds = ({ results }: { results: ReadonlyArray<Result> }) => (
  <>
    <fbt desc="Label for rounds">Rounds:</fbt> {results.map(({ turns }) => turns).join(', ')}
  </>
);

export default function EvaluationPanel({
  editor,
  state,
}: StateWithActions & {
  editor: EditorState;
}) {
  const [game, setGame] = useState<ClientGame | null>(null);
  const [runs, setRuns] = useState(0);
  const [results, setResults] = useState<ReadonlyArray<Result>>([]);

  const currentMap = useMemo(() => {
    const [currentMap] = validateMap(
      state.map,
      AIRegistry,
      toTeamArray(dropInactivePlayers(state.map).teams),
    );

    return currentMap ? startGame(updateActivePlayers(currentMap, createBotWithName)) : null;
  }, [state.map]);

  const onAction = useClientGameAction(game, setGame);
  const continueEvaluation = useCallback(
    async (runs: number) => {
      if (runs <= 0 || !currentMap) {
        setRuns(0);
        setGame(null);
        return;
      }

      setGame({
        effects: editor.effects,
        ended: false,
        lastAction: null,
        state: currentMap,
        turnState: null,
      });
      setRuns(runs);
    },
    [currentMap, editor.effects],
  );
  const startEvaluation = useCallback(() => {
    setResults([]);
    continueEvaluation(RUNS);
  }, [continueEvaluation]);

  useEffect(() => {
    if (game && !game.lastAction && runs > 0) {
      onAction({ type: 'Start' })
        .then((gameActionResponse) => {
          const actions = gameActionResponse.others;
          const actionResponse = actions?.at(-1)?.actionResponse;
          if (actions && actionResponse?.type === 'GameEnd') {
            const maybeEndTurnResponse = actions.findLast(
              ({ actionResponse }) => actionResponse.type === 'EndTurn',
            )?.actionResponse;

            setResults((results) => [
              ...results,
              {
                actionResponse,
                turns: maybeEndTurnResponse?.type === 'EndTurn' ? maybeEndTurnResponse.round : 0,
              },
            ]);
          }
          continueEvaluation(runs - 1);
        })
        .catch((error: unknown) => {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error(error);
          }
          continueEvaluation(runs - 1);
        });
    }
  }, [game, onAction, runs, continueEvaluation]);

  const resultsByPlayer = results?.length
    ? sortBy([...groupBy(results, ({ actionResponse: { toPlayer } }) => toPlayer)], ([player]) =>
        player ? player : Number.POSITIVE_INFINITY,
      )
    : null;
  const isEvaluating = !!currentMap && runs > 0;

  return (
    <Stack alignStart between wrap>
      <VStack between gap={24} stretch verticalPadding wrap>
        {resultsByPlayer?.length && currentMap ? (
          <Box flex1 gap={16} vertical wrap>
            <h2>
              <fbt desc="Headline for evaluation a map">Results</fbt>
            </h2>
            <div className={gridStyle}>
              {resultsByPlayer.map(([player, results]) => {
                if (!player) {
                  return (
                    <Fragment key={0}>
                      <Stack between className={playerIconStyle} wrap>
                        <MiniPlayerIcon id={0} />
                      </Stack>
                      <VStack between gap wrap>
                        <Stack gap wrap>
                          <fbt desc="Label for games that ended in a draw">Draw</fbt>:{' '}
                          <fbt desc="Number of draws">
                            <fbt:param name="draws">{results.length}</fbt:param>{' '}
                            <fbt:plural count={results.length} many="draws" name="number of draws">
                              draw
                            </fbt:plural>
                          </fbt>
                        </Stack>
                        <Rounds results={results} />
                      </VStack>
                    </Fragment>
                  );
                }

                const winners = [
                  ...currentMap
                    .getTeam(player)
                    .players.map(({ id }) => id)
                    .values(),
                ];

                return (
                  <Fragment key={player}>
                    <Stack className={playerIconStyle} gap wrap>
                      {winners.map((player) => (
                        <MiniPlayerIcon id={player} key={player} />
                      ))}
                    </Stack>
                    <VStack between gap wrap>
                      <Stack gap wrap>
                        <List
                          items={winners.map(
                            getTranslatedFactionName.bind(null, state.playerDetails),
                          )}
                        />
                        :{' '}
                        <fbt desc="Number of wins">
                          <fbt:param name="wins">{results.length}</fbt:param>{' '}
                          <fbt:plural count={results.length} many="wins" name="number of wins">
                            win
                          </fbt:plural>
                        </fbt>
                      </Stack>
                      <Rounds results={results} />
                    </VStack>
                  </Fragment>
                );
              })}
            </div>
          </Box>
        ) : null}
        <Box flex1 gap vertical wrap>
          <h2>
            <fbt desc="Headline for evaluation a map">Evaluate this Map</fbt>
          </h2>
          <Stack gap={16} wrap>
            <button disabled={isEvaluating} onClick={startEvaluation}>
              <fbt desc="Button to start an evaluation">Start evaluation</fbt>
            </button>
            {isEvaluating && <Spinner />}
          </Stack>
          {currentMap ? (
            <p>
              <fbt desc="Explanation for map evaluation">
                When you start an evaluation, bots will play this map{' '}
                <fbt:param name="N">{RUNS}</fbt:param> times to determine a winner. Keep in mind
                that small changes to a map can make a big difference. Running an evaluation might
                take a while.
              </fbt>
            </p>
          ) : (
            <ErrorText>
              <fbt desc="Error text for invalid map">
                This map is invalid. Please fix the map before starting an evaluation.
              </fbt>
            </ErrorText>
          )}
        </Box>
      </VStack>
    </Stack>
  );
}

const gridStyle = css`
  column-gap: 8px;
  display: grid;
  grid-template-columns: auto auto;
  row-gap: 16px;
  width: fit-content;
`;

const playerIconStyle = css`
  margin-top: 2px;
`;
