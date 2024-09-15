import Breakpoints from '@deities/ui/Breakpoints.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';

export default function GamepadOverview() {
  return (
    <Stack adaptive alignCenter center>
      <Stack gap={16} vertical>
        <div>
          L2:{' '}
          <fbt desc="Label for player card & skills button">
            Player Card & Skills
          </fbt>
        </div>
        <div>
          L1: <fbt desc="Label for previous button">Previous</fbt>
        </div>
        <div>
          L3: <fbt desc="Label for undo button">Undo Turn</fbt>
        </div>
        <div>
          <fbt desc="Label for the gamepad's left stick & d-pad">
            Left Stick & D-Pad:
          </fbt>{' '}
          <fbt desc="Label for navigating with the gamepad">Navigate</fbt>
        </div>
      </Stack>
      <img className={gamepadStyle} src={Sprites.Gamepad} />
      <Stack gap={24} vertical>
        <Stack gap={16} vertical>
          <div>
            R2: <fbt desc="Label for game info button">Game Info</fbt>
          </div>
          <div>
            R1: <fbt desc="Label for next button">Next</fbt>
          </div>
          <div>
            R3: <fbt desc="Label for zoom button">Zoom</fbt>
          </div>
          <div>
            <fbt desc="Label for the gamepad's right stick">Right Stick:</fbt>{' '}
            <fbt desc="Label for panning with the gamepad">Pan</fbt>
          </div>
        </Stack>
        <Stack gap={16} vertical>
          <div>
            A: <fbt desc="Label for accept button">Accept</fbt>
          </div>
          <div>
            B: <fbt desc="Label for cancel button">Cancel</fbt>
          </div>
          <div>
            X: <fbt desc="Label for end turn button">End Turn</fbt>
          </div>
          <div>
            Y:{' '}
            <fbt desc="Label for opponent attack radius button">
              Opponent Attack Radius
            </fbt>
          </div>
        </Stack>
      </Stack>
    </Stack>
  );
}

const gamepadStyle = css`
  padding: 24px;
  image-rendering: pixelated;
  user-select: none;

  zoom: 2;
  ${Breakpoints.sm} {
    zoom: 3;
  }
`;
