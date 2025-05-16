import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { fbt } from 'fbtee';

export type MapSize = 'Large' | 'Medium' | 'Micro' | 'Small';

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
    default: {
      size satisfies never;
      throw new UnknownTypeError('getMapSizeName', size);
    }
  }
}
