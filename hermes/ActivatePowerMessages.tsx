import { CharacterMessageEffectAction } from '@deities/apollo/Action.tsx';
import CharacterMessage from '@deities/apollo/CharacterMessage.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Brute, Commander } from '@deities/athena/info/Unit.tsx';

export default new Map<
  Skill,
  ReadonlyArray<[CharacterMessageEffectAction, number]>
>([
  [
    Skill.BuyUnitBrute,
    [
      [
        CharacterMessage(Brute, "We'll crush them under our boots!", 'self', 2),
        0.3,
      ],
      [CharacterMessage(Brute, 'Unlimited POWAAH!', 'self', 1), 0.1],
      [
        CharacterMessage(
          Brute,
          'Show them the strength of brute force!',
          'self',
          2,
        ),
        0.1,
      ],
      [
        CharacterMessage(Brute, "Hit 'em hard and don't look back!", 'self', 0),
        0.2,
      ],
      [
        CharacterMessage(
          Brute,
          "Let's show 'em what we're made of!",
          'self',
          1,
        ),
        0.2,
      ],
      [
        CharacterMessage(
          Brute,
          "You'll regret facing our brute strength!",
          'self',
          1,
        ),
        0.2,
      ],
      [
        CharacterMessage(
          Brute,
          "Smash 'em to pieces! We'll show no mercy!",
          'self',
          2,
        ),
        0.2,
      ],
    ],
  ],
  [
    Skill.BuyUnitCommander,
    [
      [
        CharacterMessage(
          Commander,
          'Witness the brilliance of inevitability.',
          'self',
          2,
        ),
        0.2,
      ],
      [
        CharacterMessage(
          Commander,
          'You’ve danced right into our trap.',
          'self',
          0,
        ),
        0.2,
      ],
      [
        CharacterMessage(Commander, 'The final gambit begins now.', 'self', 0),
        0.2,
      ],
      [
        CharacterMessage(
          Commander,
          'Your defeat was scripted long ago.',
          'self',
          2,
        ),
        0.2,
      ],
      [
        CharacterMessage(Commander, 'Embrace the chaos I control.', 'self', 2),
        0.3,
      ],
      [
        CharacterMessage(
          Commander,
          'Our true victory is not far off.',
          'self',
          0,
        ),
        0.3,
      ],
      [
        CharacterMessage(
          Commander,
          'Your moves were predictable. Mine are unstoppable.',
          'self',
          2,
        ),
        0.4,
      ],
    ],
  ],
]);
