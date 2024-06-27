import random from '@deities/hephaestus/random.tsx';
import _hasLeader from '../lib/hasLeader.tsx';
import { PlayerID } from '../map/Player.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { Gender, UnitInfo } from './Unit.tsx';

const names = {
  female: [
    'Ava',
    'Calista',
    'Casandra',
    'Chihiro',
    'Daelia',
    'Eris',
    'Hannah',
    'Jane',
    'Kyra',
    'Laura',
    'Maria',
    'May',
    'Nyra',
    'Phoebe',
    'Rey',
    'Selene',
    'Sophia',
    'Vaela',
    'Wren',
    'Yara',
    'Zoe',
    'Chloe',
  ],
  male: [
    'Alden',
    'Brock',
    'Calder',
    'Darian',
    'Demetrius',
    'Eamon',
    'Felix',
    'Finn',
    'Garrick',
    'Idris',
    'Joe',
    'Liam',
    'Nero',
    'Orion',
    'Paul',
    'Rick',
    'Sebastian',
    'Sylas',
    'Thane',
    'Yusuke',
    'Walter',
    'Emilio',
  ],
  unknown: [
    'Sasha',
    'Avery',
    'Blair',
    'Cameron',
    'Casey',
    'Eden',
    'Ira',
    'Jess',
    'Jordan',
    'Kelly',
    'Riley',
    'Morgan',
    'Quinn',
    'Reese',
    'Skyler',
    'Taylor',
    'Uli',
    'Xan',
    'Yael',
    'Zephyr',
    'Kai',
    'Yan',
  ],
};

const amount = Math.min(
  names.male.length,
  names.female.length,
  names.unknown.length,
);

export default function getUnitName(gender: Gender, name: number) {
  return names[gender][name < 0 ? name * -1 - 1 : name];
}

export function generateUnitName(isLeader = false) {
  const name = random(0, amount - 1);
  return isLeader ? name * -1 - 1 : name;
}

export function getDeterministicUnitName(
  map: MapData,
  vector: Vector,
  player: PlayerID,
  info: UnitInfo,
  offset = 0,
  hasLeader = _hasLeader(map, player, info),
) {
  const units = map.units.filter((unit) => map.matchesPlayer(unit, player));
  const name =
    Math.floor(
      units
        .map((unit) => unit.id * 11 + unit.health * 2 + unit.fuel * 3)
        .reduce((sum, value) => sum + value, 0) +
        vector.x * 5 +
        vector.y * 7 +
        info.id * 13 +
        offset,
    ) % amount;
  return hasLeader || player === 0 ? name : name * -1 - 1;
}
