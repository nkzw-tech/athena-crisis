import { CharacterMessageEffectAction } from '@deities/apollo/Action.tsx';
import CharacterMessage from '@deities/apollo/CharacterMessage.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import {
  Alien,
  APU,
  BazookaBear,
  Brute,
  Commander,
  FighterJet,
  Flamethrower,
  Infantry,
  Jetpack,
  Medic,
  Octopus,
  Pioneer,
  Saboteur,
  SmallTank,
  Sniper,
  XFighter,
} from '@deities/athena/info/Unit.tsx';

export default new Map<
  -1 | Skill,
  ReadonlyArray<[CharacterMessageEffectAction, number]>
>([
  [
    -1,
    [
      [CharacterMessage(Pioneer, 'Together we can beat them!', 'self', 2), 0.3],
      [
        CharacterMessage(Pioneer, 'Time to engineer a victory!', 'self', 2),
        0.3,
      ],
      [
        CharacterMessage(
          Pioneer,
          `Let's build our path to success.`,
          'self',
          2,
        ),
        0.3,
      ],
      [
        CharacterMessage(
          Pioneer,
          `Pioneering our way through. Engage!`,
          'self',
          2,
        ),
        0.3,
      ],
      [CharacterMessage(Infantry, 'Time to shine!', 'self', 2), 0.3],
      [
        CharacterMessage(
          Infantry,
          'Discipline and strength. Moving out!',
          'self',
          2,
        ),
        0.3,
      ],
      [CharacterMessage(Infantry, 'BAZOOKS!', 'self', 2), 0.3],
      [
        CharacterMessage(Flamethrower, `Let's turn up the heat!`, 'self', 2),
        0.3,
      ],
      [
        CharacterMessage(
          Flamethrower,
          `Flames ready. Let's ignite!`,
          'self',
          2,
        ),
        0.3,
      ],
      [CharacterMessage(Flamethrower, 'FIRE!', 'self', 2), 0.3],
      [
        CharacterMessage(SmallTank, "You'll see our full power!", 'self', 2),
        0.3,
      ],
      [CharacterMessage(APU, 'This is fun!', 'self', 1), 0.3],
      [CharacterMessage(APU, 'Advanced systems online!', 'self', 1), 0.3],
      [CharacterMessage(Saboteur, `It's time for sabotage!`, 'self', 0), 0.3],
      [CharacterMessage(Saboteur, `It's sabotagin' time!`, 'self', 0), 0.1],
      [CharacterMessage(Saboteur, `Here comes trouble!`, 'self', 0), 0.3],
      [
        CharacterMessage(Jetpack, `Sky's the limit. Let's move!`, 'self', 1),
        0.3,
      ],
      [
        CharacterMessage(Jetpack, `Jetpack engaged, let's soar!`, 'self', 1),
        0.3,
      ],
      [
        CharacterMessage(
          Medic,
          `This cut? It'll heal by the time you get married.`,
          'self',
          1,
        ),
        0.1,
      ],
      [
        CharacterMessage(
          Medic,
          `We need to move forward, not back.`,
          'self',
          1,
        ),
        0.1,
      ],
      [CharacterMessage(Medic, `Not on my watch!`, 'self', 1), 0.3],
      [CharacterMessage(XFighter, `No time to lose!`, 'self', 2), 0.3],
      [
        CharacterMessage(
          XFighter,
          `My X-Fighter is ready for action!`,
          'self',
          2,
        ),
        0.3,
      ],
      [CharacterMessage(FighterJet, `Time to engage!`, 'self', 2), 0.3],
      [CharacterMessage(FighterJet, `Ready to roll!`, 'self', 2), 0.3],
    ],
  ],
  [
    Skill.BuyUnitBazookaBear,
    [
      [CharacterMessage(BazookaBear, 'I need backup!', 'self', 1), 0.3],
      [
        CharacterMessage(
          BazookaBear,
          `I'm done fighting on my own!`,
          'self',
          2,
        ),
        0.1,
      ],
      [
        CharacterMessage(
          BazookaBear,
          'My buddies are going to join the battle for vengeance!',
          'self',
          1,
        ),
        0.2,
      ],
    ],
  ],
  [
    Skill.UnitAbilitySniperImmediateAction,
    [
      [
        CharacterMessage(
          Sniper,
          `Precision is key. Let's take them down.`,
          'self',
          1,
        ),
        0.3,
      ],
      [
        CharacterMessage(
          Sniper,
          `Target acquired. Ready to engage.`,
          'self',
          1,
        ),
        0.3,
      ],
      [
        CharacterMessage(
          Sniper,
          `Steady hands, clear mind. Let's do this.`,
          'self',
          1,
        ),
        0.3,
      ],
      [
        CharacterMessage(
          Sniper,
          `Moving into position. Ready to strike!`,
          'self',
          1,
        ),
        0.3,
      ],
      [
        CharacterMessage(
          Sniper,
          `Calm and collected. Let's take the shot.`,
          'self',
          1,
        ),
        0.3,
      ],
    ],
  ],
  [
    Skill.BuyUnitAlien,
    [
      [CharacterMessage(Alien, 'I need more support!', 'self', 2), 0.3],
      [CharacterMessage(Alien, 'More, more more!!!', 'self', 2), 0.1],
    ],
  ],
  [
    Skill.BuyUnitOctopus,
    [
      [
        CharacterMessage(Octopus, 'How dare you disturb our peace?', 'self', 2),
        0.3,
      ],
      [CharacterMessage(Octopus, 'You must leave. Be gone!', 'self', 2), 0.3],
      [CharacterMessage(Octopus, 'This is our wrath!', 'self', 2), 0.1],
    ],
  ],
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
          'Your moves were predictable. Ours are unstoppable.',
          'self',
          2,
        ),
        0.4,
      ],
    ],
  ],
  [
    Skill.SpawnUnitInfernoJetpack,
    [
      [
        CharacterMessage(
          BazookaBear,
          '{opponents}, leave this world now!',
          'self',
          0,
        ),
        0.3,
      ],
      [
        CharacterMessage(
          BazookaBear,
          '{opponents}, you are not welcome here.',
          'self',
          1,
        ),
        0.1,
      ],
    ],
  ],
]);
