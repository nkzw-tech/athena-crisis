import randomEntry from '@nkzw/core/randomEntry.js';

const FactionNames = [
  'Apollo',
  'Ares',
  'Artemis',
  'Athena',
  'Atlas',
  'Ceres',
  'Dionysus',
  'Eros',
  'Hephaestus',
  'Hera',
  'Hermes',
  'Hyperion',
  'Mars',
  'Nebula',
  'Nemesis',
  'Nero',
  'Orion',
  'Phoenix',
  'Prometheus',
  'Terra',
] as const;

export default FactionNames;

export function generateFactionName() {
  return `${randomEntry(FactionNames)}-${Math.floor(Math.random() * 1000)}`;
}
