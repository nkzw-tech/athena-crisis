import { writeFileSync } from 'node:fs';
import { EndTurnAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import type { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import encodeGameActionResponse from '@deities/apollo/actions/encodeGameActionResponse.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import { encodeActionResponse } from '@deities/apollo/EncodedActions.tsx';
import { computeVisibleEndTurnActionResponse } from '@deities/apollo/lib/computeVisibleActions.tsx';
import decodeGameActionResponse from '@deities/apollo/lib/decodeGameActionResponse.tsx';
import updateVisibleEntities from '@deities/apollo/lib/updateVisibleEntities.tsx';
import type { GameState } from '@deities/apollo/Types.tsx';
import {
  generateBuildings,
  generateRandomMap,
  generateSea,
} from '@deities/athena/generator/MapGenerator.tsx';
import startGame from '@deities/athena/lib/startGame.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome, Biomes } from '@deities/athena/map/Biome.tsx';
import { Bot, HumanPlayer } from '@deities/athena/map/Player.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import chalk from 'chalk';
import { expect, test } from 'vitest';
import { printGameState } from '../printGameState.tsx';
import { captureOne } from '../screenshot.tsx';

const play = async (map: MapData) => {
  map = startGame(
    map.copy({
      config: map.config.copy({
        seedCapital: 2000,
      }),
      teams: updatePlayers(
        map.teams,
        map.getPlayers().map((player) => Bot.from(player, 'AI')),
      ),
    }),
  );
  const player1 = map.getPlayer(1);
  let initialActionResponse: ActionResponse | null = null;
  let gameState: GameState | null = null;
  try {
    [initialActionResponse, , gameState] = executeGameAction(
      map,
      map.createVisionObject(player1),
      new Map(),
      EndTurnAction(),
      AIRegistry,
    );

    if (!gameState?.length) {
      throw new Error('AI did not execute correctly.');
    }

    const [actionResponse, lastMap] = gameState.at(-1)!;
    printGameState(
      `${gameState.length} Actions`,
      await captureOne(
        lastMap.copy({
          config: lastMap.config.copy({ fog: false }),
          teams: updatePlayer(
            lastMap.teams,
            HumanPlayer.from(player1, 'User-1'),
          ),
        }),
        'User-1',
      ),
    );

    if (actionResponse.type !== 'GameEnd') {
      console.log(JSON.stringify(map.toJSON(), null, 2));
    }

    expect(actionResponse.type).toBe('GameEnd');

    const hasOffensiveAction =
      gameState.some(
        ([actionResponse]) => actionResponse.type === 'AttackUnit',
      ) ||
      (lastMap.round <= 5 &&
        gameState.some(
          ([actionResponse]) => actionResponse.type === 'Capture',
        ));

    if (!hasOffensiveAction) {
      console.log(gameState.map(([actionResponse]) => actionResponse));
    }
    expect(hasOffensiveAction).toBe(true);

    if (initialActionResponse && map.config.fog) {
      const vision = map.createVisionObject(player1);
      const encodedGameActionResponse = encodeGameActionResponse(
        map,
        map,
        vision,
        gameState,
        null,
        initialActionResponse.type === 'EndTurn'
          ? computeVisibleEndTurnActionResponse(
              initialActionResponse,
              map,
              map,
              vision,
            )
          : null,
      );
      const { others, self } = decodeGameActionResponse(
        encodedGameActionResponse,
      );

      if (!self || !others) {
        throw new Error('Error executing game actions.');
      }

      let currentMap = vision.apply(map);
      currentMap = applyActionResponse(
        currentMap,
        vision,
        self.actionResponse!,
      );
      for (const { actionResponse, buildings, units } of others) {
        try {
          currentMap = updateVisibleEntities(
            applyActionResponse(currentMap, vision, actionResponse),
            vision,
            {
              buildings,
              units,
            },
          );
        } catch (error) {
          printGameState(
            `Error at`,
            await captureOne(
              currentMap.copy({
                teams: updatePlayer(
                  currentMap.teams,
                  HumanPlayer.from(player1, 'User-1'),
                ),
              }),
              'User-1',
            ),
          );
          throw error;
        }
      }
      const a = vision.apply(lastMap);
      let b = currentMap;
      printGameState(
        `Final Client State (Player 1)`,
        await captureOne(
          b.copy({
            teams: updatePlayer(b.teams, HumanPlayer.from(player1, 'User-1')),
          }),
          'User-1',
        ),
      );

      a.units.forEach((unit, vector) => {
        expect(unit.toJSON()).toEqual(b.units.get(vector)?.toJSON());
        b = b.copy({ units: b.units.delete(vector) });
      });
      expect(b.units.size).toEqual(0);
      a.buildings.forEach((building, vector) => {
        expect(building.toJSON()).toEqual(b.buildings.get(vector)?.toJSON());
        b = b.copy({ buildings: b.buildings.delete(vector) });
      });
      expect(b.buildings.size).toEqual(0);

      // If there are lots of actions, the client replay might take longer
      // than 20 seconds. It's a useful test, so let's leave it in for now.
      /* printGameState(
        'Client State',
        await captureGameActionResponse(
          map.copy({
            teams: updatePlayer(map.teams, HumanPlayer.from(player1, 'User-1')),
          }),
          encodedGameActionResponse,
          'User-1',
        ),
      );*/
    }
  } catch (error) {
    console.log(
      chalk.bold.red(
        `HaltingProblem test failed. Printing game state to 'halting-problem-failure.json'.`,
      ),
    );
    writeFileSync(
      process.cwd() + '/halting-problem-failure.json',
      JSON.stringify(
        {
          encodedActionResponses: gameState?.map(([actionResponse]) =>
            encodeActionResponse(actionResponse),
          ),
          encodedInitialActionResponse: initialActionResponse
            ? encodeActionResponse(initialActionResponse)
            : null,
          map,
        },
        null,
        2,
      ),
    );
    throw error;
  }
};

const randomMap = withModifiers(
  generateSea(
    generateBuildings(
      generateRandomMap(new SizeVector(10, 10)),
      Biomes.filter((biome) => biome !== Biome.Spaceship),
    ),
  ),
);

test(
  'AI plays on a random map and the game terminates',
  () => play(randomMap),
  20_000,
);

// Currently a game in the fog is not guaranteed to terminate because the AI
// might not have enough visiblity.
test(
  'AI plays on a random map in fog and the game terminates',
  () => play(randomMap.copy({ config: randomMap.config.copy({ fog: true }) })),
  20_000,
);
