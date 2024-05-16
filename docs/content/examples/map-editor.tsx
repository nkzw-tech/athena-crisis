import { encodeEffects } from '@deities/apollo/Effects.tsx';
import { Sniper } from '@deities/athena/info/Unit.tsx';
import toSlug from '@deities/hephaestus/toSlug.tsx';
import MapEditor from '@deities/hera/editor/MapEditor.tsx';
import {
  MapCreateVariables,
  MapObject,
  MapUpdateVariables,
} from '@deities/hera/editor/Types.tsx';
import useLocation from '@deities/ui/hooks/useLocation.tsx';
import { useCallback, useEffect, useState } from 'react';

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

const toMapObject = (data: string | null): MapObject | null => {
  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export default function MapEditorExample() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [mapObject, setMapObject] = useState<MapObject | null>(() =>
    toMapObject(params.get('map')),
  );

  const handleMapUpdate = useCallback(
    (variables: MapCreateVariables | MapUpdateVariables) => {
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
        id: 'id' in variables ? variables.id : '',
        name: variables.mapName,
        slug: toSlug(variables.mapName),
        state: JSON.stringify(variables.map.toJSON()),
        tags: variables.tags,
      };
      setMapObject(mapObject);
    },
    [],
  );

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
