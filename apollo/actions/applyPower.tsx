import {
  ChargeSkillCharges,
  getHealUnitTypes,
  getSkillPowerDamage,
  Skill,
} from '@deities/athena/info/Skill.tsx';
import {
  Dragon,
  Flamethrower,
  InfernoJetpack,
  Pioneer,
  Saboteur,
  Zombie,
} from '@deities/athena/info/Unit.tsx';
import assignDeterministicUnitNames from '@deities/athena/lib/assignDeterministicUnitNames.tsx';
import getAirUnitsToRecover from '@deities/athena/lib/getAirUnitsToRecover.tsx';
import matchesActiveType from '@deities/athena/lib/matchesActiveType.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import { Charge, HealAmount } from '@deities/athena/map/Configuration.tsx';
import Player from '@deities/athena/map/Player.tsx';
import Unit, { UnitConversion } from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';

const conversions = new Map<Skill, Readonly<UnitConversion>>([
  [Skill.SpawnUnitInfernoJetpack, { from: Flamethrower, to: InfernoJetpack }],
  [Skill.UnlockZombie, { from: Pioneer, to: Zombie }],
  [
    Skill.DragonSaboteur,
    { from: Saboteur, onlyLeader: true, recover: true, to: Dragon },
  ],
]);

const getAllOpponents = (
  map: MapData,
  player: Player,
  vision: VisionT | null,
) =>
  map.units.filter(
    (unit, vector) =>
      (!vision || vision.isVisible(map, vector)) &&
      map.isNonNeutralOpponent(player, unit),
  );

export function getUnitsToDamage(
  map: MapData,
  player: Player,
  skill: Skill,
  vision: VisionT | null,
) {
  if (skill === Skill.BuyUnitOctopus) {
    return getAllOpponents(map, player, vision);
  } else if (skill === Skill.BuyUnitDragon) {
    const vectors = new Set(
      [
        ...map.units
          .filter(
            (unit) =>
              unit.id === Dragon.id &&
              !unit.isCompleted() &&
              map.matchesPlayer(unit, player),
          )
          .keys(),
      ].flatMap((vector) => vector.adjacent()),
    );

    return getAllOpponents(map, player, vision).filter((_, vector) =>
      vectors.has(vector),
    );
  } else if (skill === Skill.VampireHeal) {
    return map.units.filter((unit) => map.matchesPlayer(unit, player));
  }

  return null;
}

export function onPowerUnitUpgrade(skill: Skill, unit: Unit) {
  if (
    skill === Skill.RecoverAirUnits ||
    (skill === Skill.BuyUnitCannon && unit.isUnfolded() && unit.isCompleted())
  ) {
    return unit.recover();
  }

  if (skill === Skill.Shield) {
    return unit.activateShield();
  }

  const conversion = conversions.get(skill);
  if (conversion) {
    return unit.maybeConvert(conversion);
  }

  return null;
}

export function onPowerUnitDamageEffect(
  skill: Skill,
  map: MapData,
  vector: Vector,
  unit: Unit,
) {
  const damage = getSkillPowerDamage(skill);
  if (damage > 0) {
    let newUnit = unit.modifyHealth(-damage);
    let isDead = newUnit.isDead();
    if (isDead && skill === Skill.VampireHeal) {
      newUnit = newUnit.setHealth(1);
      isDead = false;
    }

    const count = isDead ? newUnit.count() : 0;
    return map.copy({
      teams: updatePlayers(map.teams, [
        map.getCurrentPlayer().modifyStatistics({
          damage,
          destroyedUnits: count,
        }),
        map.getPlayer(unit).modifyStatistics({
          lostUnits: count,
        }),
      ]),
      units: isDead ? map.units.delete(vector) : map.units.set(vector, newUnit),
    });
  }

  return null;
}

export default function applyPower(skill: Skill, map: MapData) {
  const healTypes = getHealUnitTypes(skill);
  let player = map.getCurrentPlayer();

  if (skill === Skill.Charge) {
    player = player.setCharge(player.charge + ChargeSkillCharges * Charge);
    map = map.copy({
      teams: updatePlayer(map.teams, player),
    });
  }

  if (healTypes) {
    map = map.copy({
      units: map.units.map((unit) =>
        map.matchesPlayer(player, unit) &&
        matchesActiveType(healTypes, unit, null)
          ? unit.modifyHealth(HealAmount)
          : unit,
      ),
    });
  }

  if (skill === Skill.RecoverAirUnits) {
    map = map.copy({
      units: map.units.merge(
        getAirUnitsToRecover(map, player).map((unit) => unit.recover()),
      ),
    });
  }

  if (skill === Skill.BuyUnitCannon) {
    map = map.copy({
      units: map.units.map((unit) =>
        unit.isUnfolded() &&
        unit.isCompleted() &&
        map.matchesPlayer(player, unit)
          ? unit.recover()
          : unit,
      ),
    });
  }

  if (skill === Skill.Shield) {
    map = map.copy({
      units: map.units.map((unit) =>
        map.matchesPlayer(player, unit) ? unit.activateShield() : unit,
      ),
    });
  }

  const conversion = conversions.get(skill);
  if (conversion) {
    const newUnits = map.units
      .filter((unit) => map.matchesPlayer(player, unit))
      .map((unit) => unit.maybeConvert(conversion));

    map = map.copy({
      units: map.units.merge(
        map.units,
        assignDeterministicUnitNames(map, newUnits),
      ),
    });
  }

  const units = getUnitsToDamage(map, player, skill, null);
  if (units) {
    for (const [vector, unit] of units) {
      map = onPowerUnitDamageEffect(skill, map, vector, unit) || map;
    }
  }

  return map;
}
