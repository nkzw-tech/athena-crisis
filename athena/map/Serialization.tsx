import ImmutableMap from '@nkzw/immutable-map';
import { Decorator } from '../info/Decorator.tsx';
import getDecoratorIndex from '../lib/getDecoratorIndex.tsx';
import MapData, { DecoratorMap, SizeVector } from '../MapData.tsx';
import Building, { PlainBuilding } from './Building.tsx';
import { DecoratorsPerSide } from './Configuration.tsx';
import Entity from './Entity.tsx';
import { PlainEntitiesList } from './PlainMap.tsx';
import Player, {
  Bot,
  HumanPlayer,
  PlaceholderPlayer,
  PlainPlayer,
  PlayerID,
  toPlayerID,
} from './Player.tsx';
import { decodePlayerStatistics } from './PlayerStatistics.tsx';
import SpriteVector from './SpriteVector.tsx';
import Team, { PlainTeam, Teams } from './Team.tsx';
import Unit, { PlainUnit } from './Unit.tsx';
import vec from './vec.tsx';
import Vector from './Vector.tsx';

export function decodeDecorators(
  size: SizeVector,
  decorators: PlainEntitiesList<Decorator> | undefined,
): DecoratorMap {
  const decoratorMap: Array<Decorator> = Array(
    size.width * size.height * DecoratorsPerSide * DecoratorsPerSide,
  ).fill(0);
  const decoratorSize = size.toDecoratorSizeVector();
  decorators?.forEach(([x, y, decorator]) => {
    decoratorMap[getDecoratorIndex(new SpriteVector(x, y), decoratorSize)] =
      decorator;
  });
  return decoratorMap;
}

export function decodePlayers(
  players: ReadonlyArray<PlainPlayer>,
  teamId: PlayerID,
): ImmutableMap<PlayerID, Player> {
  return ImmutableMap<PlayerID, Player>().withMutations((playerMap) =>
    players.forEach((player) => {
      const playerID = toPlayerID(player.id);
      const skills = new Set(player.skills);
      const activeSkills = new Set(player.activeSkills);
      return playerMap.set(
        playerID,
        'userId' in player
          ? new HumanPlayer(
              playerID,
              player.userId,
              teamId,
              player.funds,
              player.ai,
              skills,
              activeSkills,
              player.charge || 0,
              decodePlayerStatistics(player.stats),
              player.misses || 0,
            )
          : 'name' in player
            ? new Bot(
                playerID,
                player.name,
                teamId,
                player.funds,
                player.ai,
                skills,
                activeSkills,
                player.charge || 0,
                decodePlayerStatistics(player.stats),
                player.misses || 0,
              )
            : new PlaceholderPlayer(
                playerID,
                teamId,
                player.funds,
                player.ai,
                skills,
              ),
      );
    }),
  );
}

export function decodeTeams(teams: ReadonlyArray<PlainTeam>): Teams {
  return ImmutableMap<PlayerID, Team>().withMutations((map) =>
    teams.forEach(({ id, name, players }) =>
      map.set(id, new Team(id, name, decodePlayers(players, id))),
    ),
  );
}

export function decodeEntities<
  T extends Entity,
  S extends PlainBuilding | PlainUnit,
>(
  list: PlainEntitiesList<S>,
  entityCreator: (entity: S) => T,
): ImmutableMap<Vector, T> {
  return ImmutableMap<Vector, T>().withMutations((map) =>
    list.forEach(([x, y, entity]) => map.set(vec(x, y), entityCreator(entity))),
  );
}

export function decodeBuildings(
  buildings: PlainEntitiesList<PlainBuilding>,
): ImmutableMap<Vector, Building> {
  return decodeEntities(buildings, Building.fromJSON);
}

export function decodeUnits(
  units: PlainEntitiesList<PlainUnit>,
): ImmutableMap<Vector, Unit> {
  return decodeEntities(units, Unit.fromJSON);
}

export function encodeTeams(teams: Teams): ReadonlyArray<PlainTeam> {
  return [...teams].map(([, team]) => team.toJSON());
}

export const formatTeams = encodeTeams;

export function encodeDecorators(map: MapData): PlainEntitiesList<Decorator> {
  return map.reduceEachDecorator(
    (list, decorator, vector) => [...list, [vector.x, vector.y, decorator.id]],
    [] as PlainEntitiesList<Decorator>,
  );
}

export function encodeEntities<
  T extends Unit | Building,
  S extends T extends Unit ? PlainUnit : PlainBuilding,
>(entities: ImmutableMap<Vector, T>): PlainEntitiesList<S> {
  return entities
    .map((entity, { x, y }) => [x, y, entity.toJSON()])
    .toSetSeq()
    .toJS() as PlainEntitiesList<S>;
}
