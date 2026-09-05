import { Skill } from '../info/Skill.tsx';
import { Jeep } from '../info/Unit.tsx';
import Unit from '../map/Unit.tsx';
import MapData from '../MapData.tsx';

// Call after the transport is destroyed, including when its building is destroyed.
export default function getSurvivingPassenger(map: MapData, unit: Unit | undefined) {
  return unit?.info === Jeep && map.getPlayer(unit).skills.has(Skill.Jeep)
    ? unit.transports?.[0]?.deploy()
    : undefined;
}
