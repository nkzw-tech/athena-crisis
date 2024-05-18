import { EndTurnAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import type { Action, MoveAction } from '@deities/apollo/Action.tsx';
import { execute } from '@deities/apollo/Action.tsx';
import type { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import type { Effects } from '@deities/apollo/Effects.tsx';
import applyConditions from '@deities/apollo/lib/applyConditions.tsx';
import gameHasEnded from '@deities/apollo/lib/gameHasEnded.tsx';
import type { GameState } from '@deities/apollo/Types.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { VisionT } from '@deities/athena/Vision.tsx';

class AIInterruptException {
  public readonly name = 'AIInterruptException';
}

function isAIInterruptException(
  exception: unknown,
): exception is AIInterruptException {
  const error = exception as { name?: string };
  return 'name' in error && error.name === 'AIInterruptException';
}

export default abstract class BaseAI {
  protected vision: VisionT | null = null;
  private gameState: GameState = [];

  public constructor(private effects: Effects) {}

  protected getVision(map: MapData) {
    return (
      this.vision || (this.vision = map.createVisionObject(map.currentPlayer))
    );
  }

  protected applyVision(map: MapData): MapData {
    return this.getVision(map).apply(map);
  }

  protected execute(map: MapData, action: Action): MapData | null {
    const response = execute(map, this.getVision(map), action);
    if (response) {
      this.appendActionResponse(response[0], map, response[1]);
      return this.gameState.at(-1)?.[1] || null;
    }
    return null;
  }

  protected appendActionResponse(
    actionResponse: ActionResponse,
    previousMap: MapData,
    currentMap: MapData,
  ): void {
    this.gameState = this.gameState.concat([[actionResponse, currentMap]]);

    const [gameState, effects] = applyConditions(
      previousMap,
      currentMap,
      this.effects,
      actionResponse,
    );
    this.effects = effects;
    if (gameState?.length) {
      this.gameState = this.gameState.concat(gameState);
      if (
        gameHasEnded(gameState) ||
        gameState.some(([actionResponse]) => actionResponse.type === 'EndTurn')
      ) {
        throw new AIInterruptException();
      }
    }
  }

  protected executeMove(
    map: MapData,
    action: MoveAction,
  ): [map: MapData | null, blocked: boolean] {
    const currentMap = this.execute(map, action);
    const state = this.gameState.at(-1);

    if (currentMap && state) {
      const [actionResponse, activeMap] = state;
      if (
        action.type === 'Move' &&
        actionResponse.type === 'Move' &&
        !action.to.equals(actionResponse.to)
      ) {
        return [activeMap, true];
      }
    }

    return [currentMap, false];
  }

  public retrieveGameState(): GameState {
    const gameState = this.gameState;
    this.gameState = [];
    return gameState;
  }

  public retrieveEffects(): Effects {
    return this.effects;
  }

  public act(map: MapData): MapData | null {
    try {
      return this.action(map);
    } catch (error) {
      if (isAIInterruptException(error)) {
        return null;
      }
      throw error;
    }
  }

  protected endTurn(map: MapData): MapData | null {
    const currentMap = this.execute(map, EndTurnAction());
    if (!currentMap) {
      throw new Error('Error executing end turn action.');
    }
    // Return `null` to indicate that the turn ended.
    return null;
  }

  protected abstract action(map: MapData): MapData | null;
}
