import {
  Box,
  Box2,
  Computer,
  Forest3,
  getTileInfo,
  Iceberg,
  Island,
  Lightning,
  Plain,
  Reef,
  River,
  Sea,
  StormCloud,
  TileInfo,
  TileLayer,
  TileTypes,
  Trench,
  Wall,
  Weeds,
  Window,
} from '../info/Tile.tsx';
import Vector from '../map/Vector.tsx';
import MapData, { ModifierMap } from '../MapData.tsx';
import { Modifier } from './Modifier.tsx';

type AnyTileInfo = TileInfo | null | undefined;

const matchesSame = (t: TileInfo) => (x: AnyTileInfo) => x && t.id === x.id;
const matchesAll = (t: TileInfo) => (x: AnyTileInfo) => x && t.group & x.type;
const matchesAny = (t: TileInfo) => (x: AnyTileInfo) => !x || t.group & x.type;

const makeTFn =
  (map: MapData, info: TileInfo, layer: TileLayer) =>
  (vector: Vector, _layer = info.style.isolated ? layer : undefined) => {
    const tile = map.getTile(vector, _layer);
    const tileInfo = tile ? getTileInfo(tile) : null;
    // Tiles that are not isolated will verify that the tile group matches, otherwise
    // attempt to fall through to layer 0.
    return tileInfo &&
      _layer === undefined &&
      !info.style.isolated &&
      tileInfo.group !== info.group
      ? map.getTileInfo(vector, 0)
      : tileInfo;
  };

const byGroup = (map: MapData, group: number, vector: Vector) => {
  if (!map.contains(vector)) {
    return null;
  }
  const layer1Tile = map.getTile(vector, 1);
  const tile = layer1Tile && getTileInfo(layer1Tile);
  return tile && group & tile.type ? tile : map.getTileInfo(vector, 0);
};

export const getWaterfallModifier = (
  map: MapData,
  vector: Vector,
  info: TileInfo,
  layer: TileLayer,
) => {
  if (info !== Sea) {
    return null;
  }

  const t = makeTFn(map, info, layer);
  const [, up, rp, dp, lp, lup, rup, ldp, rdp] = vector.expandWithDiagonals();
  const ru = t(rup);
  const lu = t(lup);
  const rd = t(rdp);
  const ld = t(ldp);
  const u = t(up);
  const r = t(rp);
  const d = t(dp);
  const l = t(lp);

  const matchAny = matchesAny(info);

  if (
    u &&
    u.type & TileTypes.River &&
    [l, r, d, ld, rd].every(matchAny) &&
    ![lu, ru].some(matchesAll(u)) &&
    vector.x !== 1 &&
    vector.x !== map.size.width &&
    matchesSame(u)(t(up.up()))
  ) {
    return Modifier.RiverFlowsFromTop;
  } else if (
    d &&
    d.type & TileTypes.River &&
    [l, r, u, lu, ru].every(matchAny) &&
    ![ld, rd].some(matchesAll(d)) &&
    vector.x !== 1 &&
    vector.x !== map.size.width &&
    matchesSame(d)(t(dp.down()))
  ) {
    return Modifier.RiverFlowsFromBottom;
  } else if (
    r &&
    r.type & TileTypes.River &&
    [l, u, d, lu, ld].every(matchAny) &&
    ![ru, rd].some(matchesAll(r)) &&
    vector.y !== 1 &&
    vector.y !== map.size.height &&
    matchesSame(r)(t(rp.right()))
  ) {
    return Modifier.RiverFlowsFromRight;
  } else if (
    l &&
    l.type & TileTypes.River &&
    [u, r, d, ru, rd].every(matchAny) &&
    ![lu, ld].some(matchesAll(l)) &&
    vector.y !== 1 &&
    vector.y !== map.size.height &&
    matchesSame(l)(t(lp.left()))
  ) {
    return Modifier.RiverFlowsFromLeft;
  }

  return null;
};

export default function getModifier(
  map: MapData,
  vector: Vector,
  info: TileInfo,
  layer: TileLayer,
): number {
  let modifier: Modifier | null = null;

  const t = makeTFn(map, info, layer);
  const [, up, rp, dp, lp, lup, rup, ldp, rdp] = vector.expandWithDiagonals();
  const ru = t(rup);
  const lu = t(lup);
  const rd = t(rdp);
  const ld = t(ldp);
  let u = t(up);
  let r = t(rp);
  let d = t(dp);
  let l = t(lp);

  const matchSame = matchesSame(info);
  const matchAll = matchesAll(info);
  const matchAny = matchesAny(info);
  const isAreaDecorator = info.type & TileTypes.AreaDecorator;

  if (info === Computer || info === Iceberg) {
    const modulo = (vector.x + vector.y) % 2;
    modifier = modulo === 1 ? Modifier.Variant2 : Modifier.None;
  } else if (info === Lightning) {
    if ([u, d].every(matchesSame(StormCloud))) {
      modifier = Modifier.Vertical;
    }
  } else if (info === Plain || info === Window || info === Island) {
    const modulo = (vector.x + vector.y) % 3;
    modifier =
      modulo === 1
        ? Modifier.Variant2
        : modulo === 2
          ? Modifier.Variant3
          : Modifier.None;
  } else if (info === Wall || info === Forest3) {
    const modulo = (vector.x + vector.y) % 7;
    modifier =
      modulo === 1
        ? Modifier.Variant2
        : modulo === 2
          ? Modifier.Variant3
          : modulo === 3
            ? Modifier.Variant4
            : modulo === 4
              ? Modifier.Variant5
              : modulo === 5
                ? Modifier.Variant6
                : modulo === 6
                  ? Modifier.Variant7
                  : Modifier.None;
  } else if (
    info === Reef ||
    info === Weeds ||
    info.type & TileTypes.ConstructionSite
  ) {
    const modulo = (vector.x + vector.y) % 4;
    modifier =
      modulo === 1
        ? Modifier.Variant2
        : modulo === 2
          ? Modifier.Variant3
          : modulo === 3
            ? Modifier.Variant4
            : Modifier.None;
  } else if (info === Box || info === Box2) {
    const modulo = (vector.x + vector.y) % 6;
    modifier =
      modulo === 1
        ? Modifier.Variant2
        : modulo === 2
          ? Modifier.Variant3
          : modulo === 3
            ? Modifier.Variant4
            : modulo === 4
              ? Modifier.Variant5
              : modulo === 5
                ? Modifier.Variant6
                : Modifier.None;
  }

  if (info.type & TileTypes.Joinable) {
    // If the nearest tile can cross with the current one (bridge), advance the vector one item further for the check.
    if (
      u?.style.crossesWith &&
      u.style.crossesWith & info.type &&
      [
        byGroup(map, u.group, up.left()),
        byGroup(map, u.group, up.right()),
      ].every(matchesAny(u))
    ) {
      u = t(up.up());
    }
    if (
      r?.style.crossesWith &&
      r.style.crossesWith & info.type &&
      [byGroup(map, r.group, rp.up()), byGroup(map, r.group, rp.down())].every(
        matchesAny(r),
      )
    ) {
      r = t(rp.right());
    }
    if (
      d?.style.crossesWith &&
      d.style.crossesWith & info.type &&
      [
        byGroup(map, d.group, dp.left()),
        byGroup(map, d.group, dp.right()),
      ].every(matchesAny(d))
    ) {
      d = t(dp.down());
    }
    if (
      l?.style.crossesWith &&
      l.style.crossesWith & info.type &&
      [byGroup(map, l.group, lp.up()), byGroup(map, l.group, lp.down())].every(
        matchesAny(l),
      )
    ) {
      l = t(lp.left());
    }
  }

  if (info.type & TileTypes.Area) {
    const match = info.type & TileTypes.AreaMatchesAll ? matchAll : matchAny;
    if ([u, r, d, l, ru, lu, rd, ld].every(match)) {
      modifier = Modifier.Center;
      // Concatenation 1 vertex.
    } else if ([u, r, d, l, ru, lu, ld].every(match)) {
      modifier = Modifier.BottomRightEdge;
    } else if ([u, r, d, l, lu, rd, ld].every(match)) {
      modifier = Modifier.TopRightEdge;
    } else if ([u, r, d, l, ru, lu, rd].every(match)) {
      modifier = Modifier.BottomLeftEdge;
    } else if ([u, r, d, l, ru, rd, ld].every(match)) {
      modifier = Modifier.TopLeftEdge;
      // Concatenation 2 opposite vertices.
    } else if ([u, r, d, l, lu, rd].every(match)) {
      modifier = Modifier.TopRightBottomLeftEdge;
    } else if ([u, r, d, l, ru, ld].every(match)) {
      modifier = Modifier.TopLeftBottomRightEdge;
      // Concatenation 2 vertices.
    } else if ([u, r, d, l, ru, lu].every(match)) {
      modifier = Modifier.BottomLeftAndRightEdge;
    } else if ([u, r, d, l, rd, ld].every(match)) {
      modifier = Modifier.TopLeftAndRightEdge;
    } else if ([u, r, d, l, lu, ld].every(match)) {
      modifier = Modifier.TopRightBottomRightEdge;
    } else if ([u, r, d, l, ru, rd].every(match)) {
      modifier = Modifier.TopLeftBottomLeftEdge;
      // Concatenation 3 vertices.
    } else if ([u, r, d, l, ru].every(match)) {
      modifier = Modifier.TopRightIsArea;
    } else if ([u, r, d, l, lu].every(match)) {
      modifier = Modifier.TopLeftIsArea;
    } else if ([u, r, d, l, rd].every(match)) {
      modifier = Modifier.BottomRightIsArea;
    } else if ([u, r, d, l, ld].every(match)) {
      modifier = Modifier.BottomLeftIsArea;
      // Edges.
    } else if ([u, r, d, ru, rd].every(match)) {
      if (!isAreaDecorator || [u, d].every(matchSame)) {
        modifier = Modifier.LeftWall;
      } else if (isAreaDecorator && matchSame(u)) {
        modifier = Modifier.LeftWallTopAreaDecorator;
      } else if (isAreaDecorator && matchSame(d)) {
        modifier = Modifier.LeftWallBottomAreaDecorator;
      } else {
        modifier = Modifier.LeftWallAreaDecorator;
      }
    } else if ([r, d, l, rd, ld].every(match)) {
      if (!isAreaDecorator || [l, r].every(matchSame)) {
        modifier = Modifier.TopWall;
      } else if (isAreaDecorator && matchSame(l)) {
        modifier = Modifier.TopWallLeftAreaDecorator;
      } else if (isAreaDecorator && matchSame(r)) {
        modifier = Modifier.TopWallRightAreaDecorator;
      } else {
        modifier = Modifier.TopWallAreaDecorator;
      }
    } else if ([u, r, l, ru, lu].every(match)) {
      if (!isAreaDecorator || [l, r].every(matchSame)) {
        modifier = Modifier.BottomWall;
      } else if (isAreaDecorator && matchSame(l)) {
        modifier = Modifier.BottomWallLeftAreaDecorator;
      } else if (isAreaDecorator && matchSame(r)) {
        modifier = Modifier.BottomWallRightAreaDecorator;
      } else {
        modifier = Modifier.BottomWallAreaDecorator;
      }
    } else if ([u, d, l, lu, ld].every(match)) {
      if (!isAreaDecorator || [u, d].every(matchSame)) {
        modifier = Modifier.RightWall;
      } else if (isAreaDecorator && matchSame(u)) {
        modifier = Modifier.RightWallTopAreaDecorator;
      } else if (isAreaDecorator && matchSame(d)) {
        modifier = Modifier.RightWallBottomAreaDecorator;
      } else {
        modifier = Modifier.RightWallAreaDecorator;
      }
      // Concatenation edge + 1 vertex.
    } else if ([r, d, l, rd].every(match)) {
      modifier = Modifier.TopWallBottomLeftEdge;
    } else if ([u, r, l, ru].every(match)) {
      modifier = Modifier.BottomWallLeftTopEdge;
    } else if ([u, r, d, rd].every(match)) {
      modifier = Modifier.LeftWallTopRightEdge;
    } else if ([u, d, l, ld].every(match)) {
      modifier = Modifier.RightWallTopLeftEdge;
    } else if ([r, d, l, ld].every(match)) {
      modifier = Modifier.TopWallRightBottomEdge;
    } else if ([u, r, l, lu].every(match)) {
      modifier = Modifier.BottomWallRightTopEdge;
    } else if ([u, r, d, ru].every(match)) {
      modifier = Modifier.LeftWallBottomRightEdge;
    } else if ([u, d, l, lu].every(match)) {
      modifier = Modifier.RightWallBottomLeftEdge;
      // Corners.
    } else if ([r, d, rd].every(match)) {
      if (!isAreaDecorator || [r, d].every(matchSame)) {
        modifier = Modifier.TopLeftAreaCorner;
      } else if (isAreaDecorator && matchSame(r)) {
        modifier = Modifier.TopLeftRightAreaDecorator;
      } else if (isAreaDecorator && matchSame(d)) {
        modifier = Modifier.TopLeftBottomAreaDecorator;
      } else {
        modifier = Modifier.TopLeftAreaDecorator;
      }
    } else if ([r, u, ru].every(match)) {
      if (!isAreaDecorator || [r, u].every(matchSame)) {
        modifier = Modifier.BottomLeftAreaCorner;
      } else if (isAreaDecorator && matchSame(r)) {
        modifier = Modifier.BottomLeftRightAreaDecorator;
      } else if (isAreaDecorator && matchSame(u)) {
        modifier = Modifier.BottomLeftTopAreaDecorator;
      } else {
        modifier = Modifier.BottomLeftAreaDecorator;
      }
    } else if ([d, l, ld].every(match)) {
      if (!isAreaDecorator || [d, l].every(matchSame)) {
        modifier = Modifier.TopRightAreaCorner;
      } else if (isAreaDecorator && matchSame(d)) {
        modifier = Modifier.TopRightBottomAreaDecorator;
      } else if (isAreaDecorator && matchSame(l)) {
        modifier = Modifier.TopRightLeftAreaDecorator;
      } else {
        modifier = Modifier.TopRightAreaDecorator;
      }
    } else if ([u, l, lu].every(match)) {
      if (!isAreaDecorator || [u, l].every(matchSame)) {
        modifier = Modifier.BottomRightAreaCorner;
      } else if (isAreaDecorator && matchSame(u)) {
        modifier = Modifier.BottomRightTopAreaDecorator;
      } else if (isAreaDecorator && matchSame(l)) {
        modifier = Modifier.BottomRightLeftAreaDecorator;
      } else {
        modifier = Modifier.BottomRightAreaDecorator;
      }
    }

    const waterfallModifier = getWaterfallModifier(map, vector, info, layer);
    if (waterfallModifier != null) {
      modifier = waterfallModifier;
    }
  }

  if (info.type & TileTypes.Joinable && modifier == null) {
    // This is order dependent.
    if ([u, r, d, l].every(matchAll)) {
      modifier = Modifier.JoinableCenter;
    } else if ([u, d, l].every(matchAll)) {
      modifier = Modifier.TLeft;
    } else if ([u, r, l].every(matchAll)) {
      modifier = Modifier.TTop;
    } else if ([r, d, l].every(matchAll)) {
      modifier = Modifier.TBottom;
    } else if ([u, r, d].every(matchAll)) {
      modifier = Modifier.TRight;
      // First, check real adjacent tiles.
    } else if ([r, d].every(matchAll)) {
      modifier = Modifier.TopLeftCorner;
    } else if ([u, r].every(matchAll)) {
      modifier = Modifier.BottomLeftCorner;
    } else if ([d, l].every(matchAll)) {
      modifier = Modifier.TopRightCorner;
    } else if ([u, l].every(matchAll)) {
      modifier = Modifier.BottomRightCorner;
    } else if (
      (info.type & TileTypes.ConnectWithEdge && [r, l].every(matchAny)) ||
      [r, l].every(matchAll)
    ) {
      if (info.type & TileTypes.Bridge) {
        const layer0Tile = map.getTileInfo(vector, 0);
        modifier =
          r !== info && l !== info
            ? layer0Tile === River
              ? Modifier.HorizontalCrossing
              : layer0Tile === Trench
                ? Modifier.Variant2
                : Modifier.Single
            : r !== info
              ? Modifier.ConnectingTailRight
              : l !== info
                ? Modifier.ConnectingTailLeft
                : Modifier.Horizontal;
      } else {
        modifier = Modifier.Horizontal;
      }
    } else if (
      (info.type & TileTypes.ConnectWithEdge && [u, d].every(matchAny)) ||
      [u, d].every(matchAll)
    ) {
      if (info.type & TileTypes.Bridge) {
        const layer0Tile = map.getTileInfo(vector, 0);
        modifier =
          u !== info && d !== info
            ? layer0Tile === River || layer0Tile === Trench
              ? Modifier.VerticalCrossing
              : Modifier.VerticalSingle
            : u !== info
              ? Modifier.ConnectingTailUp
              : d !== info
                ? Modifier.ConnectingTailDown
                : Modifier.Vertical;
      } else {
        modifier = Modifier.Vertical;
      }
      // Check if we need to use one of the tails.
    } else if (matchAll(d)) {
      modifier =
        (info.group === TileTypes.Pier &&
          !((t(up, 0)?.type || -1) & TileTypes.Sea)) ||
        (info === River && u && getWaterfallModifier(map, up, u, 0))
          ? Modifier.ConnectingTailUp
          : info.type & TileTypes.Bridge && d !== info
            ? Modifier.VerticalSingle
            : Modifier.TailUp;
    } else if (matchAll(u)) {
      modifier =
        (info.group === TileTypes.Pier &&
          !((t(dp, 0)?.type || -1) & TileTypes.Sea)) ||
        (info === River && d && getWaterfallModifier(map, dp, d, 0))
          ? Modifier.ConnectingTailDown
          : info.type & TileTypes.Bridge && u !== info
            ? Modifier.VerticalSingle
            : Modifier.TailDown;
    } else if (matchAll(r)) {
      modifier =
        (info.group === TileTypes.Pier &&
          !((t(lp, 0)?.type || -1) & TileTypes.Sea)) ||
        (info === River && l && getWaterfallModifier(map, lp, l, 0))
          ? Modifier.ConnectingTailLeft
          : info.type & TileTypes.Bridge && r !== info
            ? Modifier.Single
            : Modifier.TailLeft;
    } else if (matchAll(l)) {
      modifier =
        (info.group === TileTypes.Pier &&
          !((t(rp, 0)?.type || -1) & TileTypes.Sea)) ||
        (info === River && r && getWaterfallModifier(map, rp, r, 0))
          ? Modifier.ConnectingTailRight
          : info.type & TileTypes.Bridge && l !== info
            ? Modifier.Single
            : Modifier.TailRight;
      // Up/Down.
    } else if ([u, d].some(matchAll)) {
      modifier = Modifier.Vertical;
      // Lonely tile.
    } else {
      if (info.group === TileTypes.Pier) {
        if (!((t(dp, 0)?.type || -1) & TileTypes.Sea)) {
          modifier = Modifier.SingleConnectingTailDown;
        } else if (!((t(up, 0)?.type || -1) & TileTypes.Sea)) {
          modifier = Modifier.SingleConnectingTailUp;
        } else if (!((t(rp, 0)?.type || -1) & TileTypes.Sea)) {
          modifier = Modifier.SingleConnectingTailRight;
        } else if (!((t(lp, 0)?.type || -1) & TileTypes.Sea)) {
          modifier = Modifier.SingleConnectingTailLeft;
        }
      }

      if (modifier == null) {
        modifier = Modifier.Single;
      }
    }
  }

  if (
    modifier == null &&
    info.style.connectsWith &&
    info.type & TileTypes.Bridge
  ) {
    if (
      [t(up, 0), t(dp, 0)].every(matchesAll(info.style.connectsWith)) ||
      [u, d].some(matchesAll(info.style.connectsWith))
    ) {
      modifier = Modifier.Vertical;
    } else if (
      [t(rp, 0), t(lp, 0)].every(matchesAll(info.style.connectsWith))
    ) {
      modifier = Modifier.Horizontal;
    }
  }

  if (info.style.crossesWith) {
    const dg = byGroup(map, info.style.crossesWith, dp);
    const lg = byGroup(map, info.style.crossesWith, lp);
    const rg = byGroup(map, info.style.crossesWith, rp);
    const ug = byGroup(map, info.style.crossesWith, up);

    if (
      [r, l].every(matchAny) &&
      ug &&
      info.style.crossesWith & ug.type &&
      matchesAll(ug)(dg)
    ) {
      modifier = Modifier.HorizontalCrossing;
    } else if (
      [u, d].every(matchAny) &&
      rg &&
      info.style.crossesWith & rg.type &&
      matchesAll(rg)(lg)
    ) {
      modifier = Modifier.VerticalCrossing;
    }
  }

  return modifier != null && info.sprite.modifiers.has(modifier)
    ? modifier
    : Modifier.None;
}

export function getAllModifiers(map: MapData): ModifierMap {
  const modifiers = Array(map.map.length);
  map.forEachTile((vector, tile, layer) => {
    const index = map.getTileIndex(vector);
    const modifier = getModifier(map, vector, tile, layer);
    modifiers[index] = layer === 1 ? [modifiers[index], modifier] : modifier;
  });
  return modifiers;
}
