import {
  Crystal,
  CrystalAttackEffect,
  MaxChaosStars,
} from '@deities/athena/invasions/Crystal.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { fbt } from 'fbt';

export default function getCrystalDescription(crystal: Crystal) {
  switch (crystal) {
    case Crystal.Power:
      return String(
        fbt(
          `A shiny crystal that increases your attack power by ${fbt.param(
            'attack',
            CrystalAttackEffect * 100,
          )}% and allows a friend to join you in your current game. However, using it also opens your world to invasion by another player who may challenge you.`,
          'Crystal description',
        ),
      );
    case Crystal.Help:
      return String(
        fbt(
          "This radiant crystal lets you assist a friend in their game, lending them your strength when they need it most. Using it will rebalance the battlefield and increase your opponent's strength.",
          'Crystal description',
        ),
      );
    case Crystal.Phantom:
      return String(
        fbt(
          `A chaotic-looking crystal that allows you to wreak havoc in another player's world. When you use it, your goal becomes disrupting other players in any way you can. If you succeed, you can earn up to ${fbt.param('chaosStars', MaxChaosStars[Crystal.Phantom])} Chaos Stars.`,
          'Crystal description',
        ),
      );
    case Crystal.Command:
      return String(
        fbt(
          `Emitting an aura of malevolence, this crystal lets you take over whoever your foe is battling directly. Winning can earn you up to ${fbt.param('chaosStars', MaxChaosStars[Crystal.Command])} Chaos Stars.`,
          'Crystal description',
        ),
      );
    case Crystal.Super:
      return String(
        fbt(
          'A brilliantly shining crystal rarer than any other, it grants a greater benefit than the Power Crystal, but it can also make your battle harder. Very few have ever been discovered.',
          'Crystal description',
        ),
      );
    case Crystal.Memory:
      return String(
        fbt(
          'Unlike the others, this crystal has a darker glow and projects mysterious images. It reveals memories of events that happened in other worlds. Only a handful have ever been found.',
          'Crystal description',
        ),
      );
    default: {
      crystal satisfies never;
      throw new UnknownTypeError('getCrystalDescription', crystal);
    }
  }
}
