import {
  generateBuildings,
  generateRandomMap,
  generateSea,
} from '@deities/athena/generator/MapGenerator.tsx';
import validateMap from '@deities/athena/lib/validateMap.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import random from '@nkzw/core/random.js';
import { expect, test } from 'vitest';
import { printGameState } from '../printGameState.tsx';
import { captureOne } from '../screenshot.tsx';

test('creates valid maps', async () => {
  for (let i = 0; i < 50; i++) {
    const map = withModifiers(
      generateSea(
        generateBuildings(
          generateRandomMap(new SizeVector(random(10, 30), random(10, 30))),
        ),
      ),
    );
    const validatedMap = validateMap(map, AIRegistry);
    if (!validatedMap) {
      printGameState(
        `Invalid Map`,
        await captureOne(map, HumanPlayer.from(map.getPlayer(1), '1').userId),
      );
      console.log(JSON.stringify(map.toJSON(), null, 2));
    }
    expect(validateMap(map, AIRegistry)).not.toBeFalsy();
  }
});
