import { EndTurnAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Action, execute, MoveAction } from '@deities/apollo/Action.tsx';
import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Effects } from '@deities/apollo/Effects.tsx';
import applyConditions from '@deities/apollo/lib/applyConditions.tsx';
import gameHasEnded from '@deities/apollo/lib/gameHasEnded.tsx';
import { GameState } from '@deities/apollo/Types.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import getActivatePowerMessage from '@deities/hermes/messages/getActivatePowerMessage.tsx';

class AIInterruptException {
  public readonly name = 'AIInterruptException';
}

const isAIInterruptException = (
  exception: unknown,
): exception is AIInterruptException => {
  const error = exception as { name?: string };
  return 'name' in error && error.name === 'AIInterruptException';
};

const hasSwap = (gameState: GameState, startIndex: number) => {
  if (startIndex >= 0 && startIndex < gameState.length) {
    for (let i = startIndex; i < gameState.length; i++) {
      const [actionResponse] = gameState[i];
      if (actionResponse.type === 'Swap') {
        return true;
      }
    }
  }

  return false;
};

export default abstract class BaseAI {
  // Cache flag to avoid expensive attack calculations after most attacks are exhausted.
  private attacksDone = false;
  private gameState: GameState = [];

  protected vision: VisionT | null = null;

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

  private appendActionResponse(
    actionResponse: ActionResponse,
    previousMap: MapData,
    currentMap: MapData,
  ): void {
    if (actionResponse.type === 'ActivatePower') {
      const response = getActivatePowerMessage(
        previousMap,
        currentMap,
        this.getVision(currentMap),
        actionResponse.skill,
      );
      if (response) {
        this.gameState = this.gameState.concat([response]);
        currentMap = response[1];
      }
    }

    this.gameState = this.gameState.concat([[actionResponse, currentMap]]);

    const [gameState, effects] = applyConditions(
      previousMap,
      this.effects,
      actionResponse,
    );
    this.effects = effects;
    if (gameState?.length) {
      if (
        gameState.some(([actionResponse]) => actionResponse.type === 'Swap')
      ) {
        this.tryAttacking();
      }

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
    const gameStateStartIndex = this.gameState.length + 1;
    const currentMap = this.execute(map, action);
    const state = this.gameState.at(-1);

    if (currentMap && state) {
      const [actionResponse, activeMap] = state;
      if (
        action.type === 'Move' &&
        ((actionResponse.type === 'Move' &&
          !action.to.equals(actionResponse.to)) ||
          hasSwap(this.gameState, gameStateStartIndex))
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

  protected shouldAttack() {
    return !this.attacksDone;
  }

  protected tryAttacking() {
    // Unset the `attacksDone` state to attempt an attack in the next loop.
    this.attacksDone = false;
  }

  protected finishAttacking() {
    this.attacksDone = true;
  }

  protected abstract action(map: MapData): MapData | null;
}
