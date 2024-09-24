import getUserRoute from '@deities/apollo/routes/getUserRoute.tsx';
import { getUnitInfo } from '@deities/athena/info/Unit.tsx';
import Player, {
  isHumanPlayer,
  PlayerID,
} from '@deities/athena/map/Player.tsx';
import cssVar, { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import useLocation from '@deities/ui/hooks/useLocation.tsx';
import Link from '@deities/ui/Link.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css } from '@emotion/css';
import { UserLike } from '../hooks/useUserMap.tsx';
import Portrait from './Portrait.tsx';

export default function MiniPortrait({
  animate,
  paused,
  player,
  user,
}: {
  animate?: boolean;
  paused?: boolean;
  player: Player | PlayerID;
  user: Omit<UserLike, 'username'> & { username: string | null };
}) {
  const { pathname } = useLocation();
  const unit = getUnitInfo(user.character.unitId);
  if (!unit) {
    return null;
  }

  const isPlayerID = typeof player === 'number';
  const id = isPlayerID ? player : player.id;
  const isHuman = !isPlayerID && isHumanPlayer(player);
  const username = isHuman && user.username?.length ? user.username : null;
  const Component = username ? Link : 'div';
  return (
    <Component
      className={portraitStyle}
      style={{
        [cssVar('border-color')]: getColor(id),
      }}
      to={username ? `${getUserRoute(username)}?back=${pathname}` : '/'}
    >
      <Portrait
        animate={animate}
        clip={false}
        paused={paused}
        player={id}
        scale={0.5}
        unit={unit}
        variant={user.character.variant}
      />
    </Component>
  );
}

const portraitStyle = css`
  ${pixelBorder(applyVar('border-color'), 2)}
  display: block;
  width: fit-content;
`;
