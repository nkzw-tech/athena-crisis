import { PerformanceType } from '@deities/athena/map/PlayerPerformance.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';

export default function getTranslatedPerformanceTypeName(
  performanceType: PerformanceType,
) {
  switch (performanceType) {
    case 'pace':
      return <fbt desc="Label for pace performance metric">Pace</fbt>;
    case 'power':
      return <fbt desc="Label for power performance metric">Power</fbt>;
    case 'style':
      return <fbt desc="Label for style performance metric">Style</fbt>;
    case 'bonus':
      return <fbt desc="Label for bonus performance metric">Bonus</fbt>;
    default: {
      performanceType satisfies never;
      throw new UnknownTypeError(
        'getTranslatedPerformanceTypeName',
        performanceType,
      );
    }
  }
}
