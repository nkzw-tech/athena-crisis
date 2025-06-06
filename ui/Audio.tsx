import { isIOS, isSafari } from './Browser.tsx';
import EmptyAAC from './Empty.aac';
import EmptyOGG from './Empty.ogg';

const useOGG =
  !isIOS &&
  !isSafari &&
  document.createElement('audio').canPlayType('audio/ogg') === 'probably';

export const Sounds = useOGG
  ? new Map([
      ['Attack/AirToAirMissile', EmptyOGG],
      ['Attack/AntiAirGun', EmptyOGG],
      ['Attack/Artillery', EmptyOGG],
      ['Attack/ArtilleryBattery', EmptyOGG],
      ['Attack/Bite', EmptyOGG],
      ['Attack/Bomb', EmptyOGG],
      ['Attack/Cannon', EmptyOGG],
      ['Attack/Club', EmptyOGG],
      ['Attack/Flamethrower', EmptyOGG],
      ['Attack/HeavyArtillery', EmptyOGG],
      ['Attack/HeavyGun', EmptyOGG],
      ['Attack/LightGun', EmptyOGG],
      ['Attack/MG', EmptyOGG],
      ['Attack/MGFast', EmptyOGG],
      ['Attack/MiniGun', EmptyOGG],
      ['Attack/Pistol', EmptyOGG],
      ['Attack/Pow', EmptyOGG],
      ['Attack/Railgun', EmptyOGG],
      ['Attack/RailgunImpact', EmptyOGG],
      ['Attack/Rocket', EmptyOGG],
      ['Attack/RocketLauncher', EmptyOGG],
      ['Attack/Rockets', EmptyOGG],
      ['Attack/SAM', EmptyOGG],
      ['Attack/SAMImpact', EmptyOGG],
      ['Attack/Shotgun', EmptyOGG],
      ['Attack/SniperRifle', EmptyOGG],
      ['Attack/TentacleWhip', EmptyOGG],
      ['Attack/Torpedo', EmptyOGG],
      ['Attack/TorpedoImpact', EmptyOGG],
      ['Attack/ZombieBite', EmptyOGG],
      ['Crystal/Command', EmptyOGG],
      ['Crystal/Help', EmptyOGG],
      ['Crystal/Memory', EmptyOGG],
      ['Crystal/Phantom', EmptyOGG],
      ['Crystal/Power', EmptyOGG],
      ['Crystal/Super', EmptyOGG],
      ['Explosion/Air', EmptyOGG],
      ['Explosion/Building', EmptyOGG],
      ['Explosion/Ground', EmptyOGG],
      ['Explosion/Infantry', EmptyOGG],
      ['Explosion/Naval', EmptyOGG],
      ['ExplosionImpact', EmptyOGG],
      ['Fireworks', EmptyOGG],
      ['Movement/Air', EmptyOGG],
      ['Movement/AirEnd', EmptyOGG],
      ['Movement/AirInfantry', EmptyOGG],
      ['Movement/AirInfantryEnd', EmptyOGG],
      ['Movement/Amphibious', EmptyOGG],
      ['Movement/HeavySoldier', EmptyOGG],
      ['Movement/HeavySoldierEnd', EmptyOGG],
      ['Movement/LowAltitude', EmptyOGG],
      ['Movement/Rail', EmptyOGG],
      ['Movement/RailEnd', EmptyOGG],
      ['Movement/Ship', EmptyOGG],
      ['Movement/Soldier', EmptyOGG],
      ['Movement/SoldierEnd', EmptyOGG],
      ['Movement/Tires', EmptyOGG],
      ['Movement/TiresEnd', EmptyOGG],
      ['Movement/Tread', EmptyOGG],
      ['Movement/TreadEnd', EmptyOGG],
      ['Talking/High', EmptyOGG],
      ['Talking/Low', EmptyOGG],
      ['Talking/Mid', EmptyOGG],
      ['UI/Accept', EmptyOGG],
      ['UI/Cancel', EmptyOGG],
      ['UI/LongPress', EmptyOGG],
      ['UI/Next', EmptyOGG],
      ['UI/Previous', EmptyOGG],
      ['UI/Put', EmptyOGG],
      ['UI/Skip', EmptyOGG],
      ['UI/Start', EmptyOGG],
      ['Unit/ArtilleryFold', EmptyOGG],
      ['Unit/ArtilleryUnfold', EmptyOGG],
      ['Unit/CannonFold', EmptyOGG],
      ['Unit/CannonUnfold', EmptyOGG],
      ['Unit/Capture', EmptyOGG],
      ['Unit/CreateBuilding', EmptyOGG],
      ['Unit/Drop', EmptyOGG],
      ['Unit/Heal', EmptyOGG],
      ['Unit/Load', EmptyOGG],
      ['Unit/Sabotage', EmptyOGG],
      ['Unit/SniperFold', EmptyOGG],
      ['Unit/SniperUnfold', EmptyOGG],
      ['Unit/Spawn', EmptyOGG],
      ['Unit/Supply', EmptyOGG],
    ] as const)
  : new Map([
      ['Attack/AirToAirMissile', EmptyAAC],
      ['Attack/AntiAirGun', EmptyAAC],
      ['Attack/Artillery', EmptyAAC],
      ['Attack/ArtilleryBattery', EmptyAAC],
      ['Attack/Bite', EmptyAAC],
      ['Attack/Bomb', EmptyAAC],
      ['Attack/Cannon', EmptyAAC],
      ['Attack/Club', EmptyAAC],
      ['Attack/Flamethrower', EmptyAAC],
      ['Attack/HeavyArtillery', EmptyAAC],
      ['Attack/HeavyGun', EmptyAAC],
      ['Attack/LightGun', EmptyAAC],
      ['Attack/MG', EmptyAAC],
      ['Attack/MGFast', EmptyAAC],
      ['Attack/MiniGun', EmptyAAC],
      ['Attack/Pistol', EmptyAAC],
      ['Attack/Pow', EmptyAAC],
      ['Attack/Railgun', EmptyAAC],
      ['Attack/RailgunImpact', EmptyAAC],
      ['Attack/Rocket', EmptyAAC],
      ['Attack/RocketLauncher', EmptyAAC],
      ['Attack/Rockets', EmptyAAC],
      ['Attack/SAM', EmptyAAC],
      ['Attack/SAMImpact', EmptyAAC],
      ['Attack/Shotgun', EmptyAAC],
      ['Attack/SniperRifle', EmptyAAC],
      ['Attack/TentacleWhip', EmptyAAC],
      ['Attack/Torpedo', EmptyAAC],
      ['Attack/TorpedoImpact', EmptyAAC],
      ['Attack/ZombieBite', EmptyAAC],
      ['Crystal/Command', EmptyAAC],
      ['Crystal/Help', EmptyAAC],
      ['Crystal/Memory', EmptyAAC],
      ['Crystal/Phantom', EmptyAAC],
      ['Crystal/Power', EmptyAAC],
      ['Crystal/Super', EmptyAAC],
      ['Explosion/Air', EmptyAAC],
      ['Explosion/Building', EmptyAAC],
      ['Explosion/Ground', EmptyAAC],
      ['Explosion/Infantry', EmptyAAC],
      ['Explosion/Naval', EmptyAAC],
      ['ExplosionImpact', EmptyAAC],
      ['Fireworks', EmptyOGG],
      ['Movement/Air', EmptyAAC],
      ['Movement/AirEnd', EmptyAAC],
      ['Movement/AirInfantry', EmptyAAC],
      ['Movement/AirInfantryEnd', EmptyAAC],
      ['Movement/Amphibious', EmptyAAC],
      ['Movement/HeavySoldier', EmptyAAC],
      ['Movement/HeavySoldierEnd', EmptyAAC],
      ['Movement/LowAltitude', EmptyAAC],
      ['Movement/Rail', EmptyAAC],
      ['Movement/RailEnd', EmptyAAC],
      ['Movement/Ship', EmptyAAC],
      ['Movement/Soldier', EmptyAAC],
      ['Movement/SoldierEnd', EmptyAAC],
      ['Movement/Tires', EmptyAAC],
      ['Movement/TiresEnd', EmptyAAC],
      ['Movement/Tread', EmptyAAC],
      ['Movement/TreadEnd', EmptyAAC],
      ['Talking/High', EmptyAAC],
      ['Talking/Low', EmptyAAC],
      ['Talking/Mid', EmptyAAC],
      ['UI/Accept', EmptyAAC],
      ['UI/Cancel', EmptyAAC],
      ['UI/LongPress', EmptyAAC],
      ['UI/Next', EmptyAAC],
      ['UI/Previous', EmptyAAC],
      ['UI/Put', EmptyAAC],
      ['UI/Skip', EmptyAAC],
      ['UI/Start', EmptyAAC],
      ['Unit/ArtilleryFold', EmptyAAC],
      ['Unit/ArtilleryUnfold', EmptyAAC],
      ['Unit/CannonFold', EmptyAAC],
      ['Unit/CannonUnfold', EmptyAAC],
      ['Unit/Capture', EmptyAAC],
      ['Unit/CreateBuilding', EmptyAAC],
      ['Unit/Drop', EmptyAAC],
      ['Unit/Heal', EmptyAAC],
      ['Unit/Load', EmptyAAC],
      ['Unit/Sabotage', EmptyAAC],
      ['Unit/SniperFold', EmptyAAC],
      ['Unit/SniperUnfold', EmptyAAC],
      ['Unit/Spawn', EmptyAAC],
      ['Unit/Supply', EmptyAAC],
    ] as const);

export const Music = useOGG
  ? new Map([
      ['apollos-ascend', EmptyOGG],
      ['apollos-gleam', EmptyOGG],
      ['ares-chaos', EmptyOGG],
      ['ares-skirmish', EmptyOGG],
      ['artemis-glade', EmptyOGG],
      ['artemis-hunt', EmptyOGG],
      ['astraeus-expanse', EmptyOGG],
      ['astraeus-wings', EmptyOGG],
      ['chiones-cloud', EmptyOGG],
      ['chiones-leap', EmptyOGG],
      ['eos-dawn', EmptyOGG],
      ['gaias-rise', EmptyOGG],
      ['hestias-serenade', EmptyOGG],
      ['poseidons-tide', EmptyOGG],
      ['poseidons-wrath', EmptyOGG],
      ['selenes-tranquility', EmptyOGG],
      ['selenes-voyage', EmptyOGG],
    ] as const)
  : new Map([
      ['apollos-ascend', EmptyAAC],
      ['apollos-gleam', EmptyAAC],
      ['ares-chaos', EmptyAAC],
      ['ares-skirmish', EmptyAAC],
      ['artemis-glade', EmptyAAC],
      ['artemis-hunt', EmptyAAC],
      ['astraeus-expanse', EmptyAAC],
      ['astraeus-wings', EmptyAAC],
      ['chiones-cloud', EmptyAAC],
      ['chiones-leap', EmptyAAC],
      ['eos-dawn', EmptyAAC],
      ['gaias-rise', EmptyAAC],
      ['hestias-serenade', EmptyAAC],
      ['poseidons-tide', EmptyAAC],
      ['poseidons-wrath', EmptyAAC],
      ['selenes-tranquility', EmptyAAC],
      ['selenes-voyage', EmptyAAC],
    ] as const);

export type SoundT = typeof Sounds;
export type MusicT = typeof Music;
