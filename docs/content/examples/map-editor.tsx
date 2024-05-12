import { Sniper } from '@deities/athena/info/Unit.tsx';
import MapEditor from '@deities/hera/editor/MapEditor.tsx';

const viewer = {
  access: 'User',
  character: {
    unitId: Sniper.id,
    variant: 0,
  },
  displayName: 'Maxima',
  factionName: 'Atlas',
  id: 'Demo-User-12',
  skills: [],
  username: 'demo-maxima',
} as const;

export default function MapEditorExample() {
  return (
    <div style={{ width: '150%' }}>
      <MapEditor
        animationSpeed={null}
        confirmActionStyle="touch"
        createMap={() => {}}
        fogStyle="soft"
        setHasChanges={() => {}}
        tiltStyle="on"
        updateMap={() => {}}
        user={viewer}
      />
    </div>
  );
}
