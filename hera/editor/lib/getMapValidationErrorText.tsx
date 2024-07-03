import { ErrorReason } from '@deities/athena/lib/validateMap.tsx';
import { fbt } from 'fbt';

export default function getValidationErrorText(error?: ErrorReason) {
  const errors = {
    'inactive-players': fbt(
      'There is a problem with this map. The wrong number of players was provided.',
      'Map validation error',
    ),
    'invalid-configuration': fbt(
      'There is a problem with this map. The map configuration is not valid.',
      'Map validation error',
    ),
    'invalid-decorators': fbt(
      'There is a problem with this map. Some of the decorations are not valid.',
      'Map validation error',
    ),
    'invalid-entities': fbt(
      'There is a problem with this map. Some of the buildings or units are not valid.',
      'Map validation error',
    ),
    'invalid-funds': fbt(
      'There is a problem with this map. There are not enough starting funds or income generating buildings to make this map playable.',
      'Map validation error',
    ),
    'invalid-map': fbt(
      'There is a problem with this map.',
      'Map validation error',
    ),
    'invalid-objectives': fbt(
      'There is a problem with this map. The objectives are not valid.',
      'Map validation error',
    ),
    'invalid-size': fbt(
      'There is a problem with this map. The size of the map is not valid',
      'Map validation error',
    ),
    'invalid-teams': fbt(
      'There is a problem with this map. The teams are not valid.',
      'Map validation error',
    ),
    'invalid-tiles': fbt(
      'There is a problem with this map. The tiles are not valid.',
      'Map validation error',
    ),
    players: fbt(
      'There is a problem with this map. A map needs units or buildings of at least two colors to be playable.',
      'Map validation error',
    ),
  };

  return String(
    (error && errors[error]
      ? errors[error]
      : fbt(`There is a problem with this map.`, 'Map validation error')) +
      (error && process.env.NODE_ENV === 'development' ? ` [${error}]` : ''),
  );
}
