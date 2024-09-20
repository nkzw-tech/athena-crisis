import {
  CommandCrystal,
  Crystal,
  HelpCrystal,
  PhantomCrystal,
} from '@deities/athena/invasions/Crystal.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import { fbt } from 'fbt';
import { Animations } from '../MapAnimations.tsx';
import { PlayerDetails } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';
import getTranslatedFactionName from './getTranslatedFactionName.tsx';

export default function getInvasionNoticeAnimation(
  animations: Animations,
  playerDetails: PlayerDetails,
  player: PlayerID,
  name: string,
  crystal: Crystal | null,
) {
  return animations.set(new AnimationKey(), {
    color: player,
    text: String(
      crystal === CommandCrystal
        ? fbt(
            `${fbt.param('name', name)} is invading and taking over as ${fbt.param('factionName', getTranslatedFactionName(playerDetails, player))}!`,
            'Notice for when a player is invading the game',
          )
        : crystal === HelpCrystal
          ? fbt(
              `${fbt.param('name', name)} is invading to help the player!`,
              'Notice for a user or bot is invading the game',
            )
          : crystal === PhantomCrystal
            ? fbt(
                `${fbt.param('name', name)} is invading to hinder the player!`,
                'Notice for a user or bot is invading the game',
              )
            : fbt(
                `${fbt.param('name', name)} is invading!`,
                'Notice for a user or bot is invading the game',
              ),
    ),
    type: 'notice',
  });
}
