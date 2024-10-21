import { Infantry, Medic, Pioneer, RocketLauncher, UnitInfo } from './Unit.tsx';

const VampireMedic = {
  id: 1,
  sprite: 'Units-VampireMedic',
  unit: Medic,
} as const;

const HeliosPioneer = {
  id: 2,
  sprite: 'Units-CustomPioneer-2',
  unit: Pioneer,
} as const;

const ChronosPioneer = {
  id: 3,
  sprite: 'Units-CustomPioneer-3',
  unit: Pioneer,
} as const;

const HorizonPioneer = {
  id: 4,
  sprite: 'Units-CustomPioneer-4',
  unit: Pioneer,
} as const;

const GaiaPioneer = {
  id: 5,
  sprite: 'Units-CustomPioneer-5',
  unit: Pioneer,
} as const;

const AresPioneer = {
  id: 6,
  sprite: 'Units-CustomPioneer-6',
  unit: Pioneer,
} as const;

const IrisPioneer = {
  id: 7,
  sprite: 'Units-CustomPioneer-7',
  unit: Pioneer,
} as const;

const HeliosInfantry = {
  id: 8,
  sprite: 'Units-CustomInfantry-2',
  unit: Infantry,
} as const;

const ChronosInfantry = {
  id: 9,
  sprite: 'Units-CustomInfantry-3',
  unit: Infantry,
} as const;

const HorizonInfantry = {
  id: 10,
  sprite: 'Units-CustomInfantry-4',
  unit: Infantry,
} as const;

const GaiaInfantry = {
  id: 11,
  sprite: 'Units-CustomInfantry-5',
  unit: Infantry,
} as const;

const AresInfantry = {
  id: 12,
  sprite: 'Units-CustomInfantry-6',
  unit: Infantry,
} as const;

const IrisInfantry = {
  id: 13,
  sprite: 'Units-CustomInfantry-7',
  unit: Infantry,
} as const;

const HeliosRocketLauncher = {
  id: 14,
  sprite: 'Units-CustomRocketLauncher-2',
  unit: RocketLauncher,
} as const;

const ChronosRocketLauncher = {
  id: 15,
  sprite: 'Units-CustomRocketLauncher-3',
  unit: RocketLauncher,
} as const;

const HorizonRocketLauncher = {
  id: 16,
  sprite: 'Units-CustomRocketLauncher-4',
  unit: RocketLauncher,
} as const;

const GaiaRocketLauncher = {
  id: 17,
  sprite: 'Units-CustomRocketLauncher-5',
  unit: RocketLauncher,
} as const;

const AresRocketLauncher = {
  id: 18,
  sprite: 'Units-CustomRocketLauncher-6',
  unit: RocketLauncher,
} as const;

const IrisRocketLauncher = {
  id: 19,
  sprite: 'Units-CustomRocketLauncher-7',
  unit: RocketLauncher,
} as const;

const UnitCustomizations = {
  AresInfantry,
  AresPioneer,
  AresRocketLauncher,
  ChronosInfantry,
  ChronosPioneer,
  ChronosRocketLauncher,
  GaiaInfantry,
  GaiaPioneer,
  GaiaRocketLauncher,
  HeliosInfantry,
  HeliosPioneer,
  HeliosRocketLauncher,
  HorizonInfantry,
  HorizonPioneer,
  HorizonRocketLauncher,
  IrisInfantry,
  IrisPioneer,
  IrisRocketLauncher,
  VampireMedic,
} as const;

export type UnitCustomization = {
  id: number;
  sprite: UnitCustomizationTypes;
  unit: UnitInfo;
};

type AllCustomizations = typeof UnitCustomizations;
export type UnitCustomizationTypes =
  AllCustomizations[keyof AllCustomizations]['sprite'];

export const UnitCustomizationById = new Map<number, UnitCustomization>(
  Object.entries(UnitCustomizations).map(([, value]) => [value.id, value]),
);

export default UnitCustomizations;
