import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { ClientGame } from './toClientGame.tsx';

export type UndoType = 'Action' | 'Turn';

export default function undo(game: ClientGame, type: UndoType): ClientGame {
  if (!game.turnState || !game.state.getCurrentPlayer().isHumanPlayer()) {
    return game;
  }

  const [state, lastAction, effects, actions] = game.turnState;
  let newGame: ClientGame;
  if (type === 'Action' && actions?.length && actions.length > 1) {
    let recentActions = [...actions];
    while (recentActions.at(-1)?.[0][0].type === 'CompleteUnit') {
      recentActions = recentActions.slice(0, recentActions.length - 1);
    }
    recentActions = recentActions.slice(0, recentActions.length - 1);
    let newState = state;
    let newLastAction = lastAction;
    let newEffects = effects;
    const vision = state.createVisionObject(state.currentPlayer);
    for (const [actionResponses, effects] of recentActions) {
      for (const actionResponse of actionResponses) {
        newState = applyActionResponse(newState, vision, actionResponse);
        newLastAction = actionResponse;
      }
      newEffects = effects;
    }
    newGame = {
      ...game,
      effects: newEffects,
      lastAction: newLastAction,
      state: newState,
      turnState: [state, lastAction, effects, recentActions],
    };
  } else {
    newGame = {
      ...game,
      effects,
      lastAction,
      state,
      turnState: [state, lastAction, effects, []],
    };
  }
  return newGame;
}
