import { encodeEffects } from '@deities/apollo/Effects.tsx';
import { Sniper } from '@deities/athena/info/Unit.tsx';
import MapEditor from '@deities/hera/editor/MapEditor.tsx';
import {
  MapCreateVariables,
  MapObject,
  MapUpdateVariables,
} from '@deities/hera/editor/Types.tsx';
import useLocation from '@deities/ui/hooks/useLocation.tsx';
import { useEffect, useState } from 'react';

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
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [mapObject, setMapObject] = useState<MapObject | null>(
    // Load map object from url if present
    JSON.parse(params.get('map') ?? ''),
  );

  const handleMapUpdate = (
    variables: MapCreateVariables | MapUpdateVariables,
  ) => {
    const mapObject = {
      campaigns: {
        edges: [],
      },
      creator: {
        displayName: viewer.displayName,
        id: viewer.id,
        username: viewer.username,
      },
      effects: JSON.stringify(encodeEffects(variables.effects)),
      // TODO: Generate id?
      id: 'id' in variables ? variables.id : '',
      name: variables.mapName,
      // TODO: Generate slug
      slug: '',
      state: JSON.stringify(variables.map.toJSON()),
      tags: variables.tags,
    };
    setMapObject(mapObject);
  };

  useEffect(() => {
    // Sync map object to url
    const params = new URLSearchParams(window.location.search);
    params.sort();
    const search = params.toString();

    const newParams = new URLSearchParams();
    if (mapObject) {
      newParams.set('map', JSON.stringify(mapObject));
    }
    newParams.sort();
    const newSearch = newParams.toString();

    if (newSearch !== search) {
      window.history.pushState(
        {},
        '',
        window.location.pathname + `${newSearch ? `?${newSearch}` : ``}`,
      );
    }
  }, [mapObject]);

  return (
    <div style={{ width: '150%' }}>
      <MapEditor
        animationSpeed={null}
        confirmActionStyle="touch"
        createMap={handleMapUpdate}
        fogStyle="soft"
        mapObject={mapObject}
        setHasChanges={() => {}}
        tiltStyle="on"
        updateMap={handleMapUpdate}
        user={viewer}
      />
    </div>
  );
}
