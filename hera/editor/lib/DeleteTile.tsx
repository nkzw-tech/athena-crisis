import vec from '@deities/athena/map/vec.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import { Sprites } from 'athena-crisis:images';
import Cursor from '../../Cursor.tsx';

export default function DeleteTile({
  active,
  onClick,
  scale,
  tall,
  tileSize,
}: {
  active?: boolean;
  onClick: () => void;
  scale: number;
  tall?: boolean;
  tileSize: number;
}) {
  return (
    <InlineLink
      onClick={onClick}
      style={{
        height: (tileSize - 2) * scale,
        margin: `${tall ? tileSize * 1.5 - 2 : 2}px 2px 2px`,
        position: 'relative',
        width: (tileSize - 2) * scale,
      }}
    >
      <div
        style={{
          backgroundImage: `url('${Sprites.Delete}')`,
          backgroundSize: '100% 100%',
          filter: 'drop-shadow(rgb(0, 0, 0, 0.4) 0 0 1px)',
          height: tileSize,
          imageRendering: 'pixelated',
          left: -1,
          position: 'absolute',
          top: -1,
          width: tileSize,
          zoom: scale,
        }}
      >
        {active && (
          <Cursor color="red" position={vec(1, 1)} size={tileSize} zIndex={1} />
        )}
      </div>
    </InlineLink>
  );
}
