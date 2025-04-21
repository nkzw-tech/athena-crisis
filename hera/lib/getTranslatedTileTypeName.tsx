import { TileType, TileTypes } from '@deities/athena/info/Tile.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { fbt } from 'fbtee';

export default function getTranslatedTileTypeName(tileType: TileType) {
  switch (tileType) {
    case TileTypes.Plain:
      return fbt('Plain', 'Tile type name');
    case TileTypes.Forest:
    case TileTypes.ForestVariant2:
    case TileTypes.ForestVariant3:
    case TileTypes.ForestVariant4:
      return fbt('Forest', 'Tile type name');
    case TileTypes.Mountain:
      return fbt('Mountain', 'Tile type name');
    case TileTypes.Street:
      return fbt('Street', 'Tile type name');
    case TileTypes.Trench:
      return fbt('Trench', 'Tile type name');
    case TileTypes.River:
      return fbt('River', 'Tile type name');
    case TileTypes.ConstructionSite:
      return fbt('Construction Site', 'Tile type name');
    case TileTypes.Pier:
      return fbt('Pier', 'Tile type name');
    case TileTypes.Airfield:
      return fbt('Airfield', 'Tile type name');
    case TileTypes.Sea:
      return fbt('Sea', 'Tile type name');
    case TileTypes.DeepSea:
      return fbt('Deep Sea', 'Tile type name');
    case TileTypes.Bridge:
      return fbt('Bridge', 'Tile type name');
    case TileTypes.RailTrack:
      return fbt('Rail Track', 'Tile type name');
    case TileTypes.Campsite:
      return fbt('Campsite', 'Tile type name');
    case TileTypes.StormCloud:
      return fbt('Storm Cloud', 'Tile type name');
    case TileTypes.Pipe:
      return fbt('Pipe', 'Tile type name');
    case TileTypes.Teleporter:
      return fbt('Teleporter', 'Tile type name');
    case TileTypes.Inaccessible:
      return fbt('Inaccessible', 'Tile type name');
    case TileTypes.Ruins:
      return fbt('Ruins', 'Tile type name');
    case TileTypes.AreaDecorator:
    case TileTypes.AreaMatchesAll:
    case TileTypes.Joinable:
    case TileTypes.Area:
    case TileTypes.ConnectWithEdge:
      return fbt('Unknown', 'Tile type name');
    default: {
      tileType satisfies never;
      throw new UnknownTypeError('getTranslatedTileTypeName', tileType);
    }
  }
}
