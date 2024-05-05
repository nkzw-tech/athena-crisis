import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { fbt } from 'fbt';

export type MapSize =
  | 'Large'
  | 'Medium'
  | 'Micro'
  | 'Small'
  | '%future added value';

export default function getMapSizeName(size: MapSize) {
  switch (size) {
    case 'Large':
      return fbt('Large', 'Label for large maps');
    case 'Medium':
      return fbt('Medium', 'Label for medium maps');
    case 'Micro':
      return fbt('Micro', 'Label for micro maps');
    case 'Small':
      return fbt('Small', 'Label for small maps');
    case '%future added value':
      throw new Error('Invalid map size');
    default: {
      size satisfies never;
      throw new UnknownTypeError('getMapSizeName', size);
    }
  }
}
