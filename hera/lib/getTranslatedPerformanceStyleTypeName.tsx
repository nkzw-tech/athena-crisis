import { PerformanceStyleType } from '@deities/athena/map/PlayerPerformance.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';

export default function getTranslatedPerformanceStyleTypeName(
  performanceType: PerformanceStyleType,
) {
  switch (performanceType) {
    case PerformanceStyleType.LostUnits:
      return (
        <fbt desc="Label for lost units performance style type">Lost Units</fbt>
      );
    case PerformanceStyleType.CapturedBuildings:
      return (
        <fbt desc="Label for captured buildings performance style type">
          Captures
        </fbt>
      );
    case PerformanceStyleType.OneShots:
      return (
        <fbt desc="Label for one shots performance style type">One Shots</fbt>
      );
    default: {
      performanceType satisfies never;
      throw new UnknownTypeError(
        'getTranslatedPerformanceStyleTypeName',
        performanceType,
      );
    }
  }
}
