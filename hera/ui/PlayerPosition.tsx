import getColor, { Color } from '@deities/ui/getColor.tsx';
import { InlineLinkColor } from '@deities/ui/InlineLink.tsx';

export default function PlayerPosition({
  color,
  confirm,
  hasPlayer,
}: {
  color: Color;
  confirm?: boolean;
  hasPlayer?: boolean;
}) {
  return (
    <span>
      {hasPlayer ? (
        <fbt desc="change position">
          Change to the
          <span
            className={InlineLinkColor}
            style={{
              color: getColor(color),
            }}
          >
            <fbt:enum
              enum-range={[
                'blue position',
                'cyan position',
                'green position',
                'neutral position',
                'orange position',
                'pink position',
                'purple position',
                'red position',
              ]}
              value={color + ' position'}
            />
          </span>
        </fbt>
      ) : confirm ? (
        <fbt desc="pick a position">
          Confirm selecting the
          <span
            className={InlineLinkColor}
            style={{
              color: getColor(color),
            }}
          >
            <fbt:enum
              enum-range={[
                'blue position',
                'cyan position',
                'green position',
                'neutral position',
                'orange position',
                'pink position',
                'purple position',
                'red position',
              ]}
              value={color + ' position'}
            />
          </span>
        </fbt>
      ) : (
        <fbt desc="pick a position">
          Play the
          <span
            className={InlineLinkColor}
            style={{
              color: getColor(color),
            }}
          >
            <fbt:enum
              enum-range={[
                'blue position',
                'cyan position',
                'green position',
                'neutral position',
                'orange position',
                'pink position',
                'purple position',
                'red position',
              ]}
              value={color + ' position'}
            />
          </span>
        </fbt>
      )}
    </span>
  );
}
