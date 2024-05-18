import { AIBehavior } from '@deities/athena/map/AIBehavior.tsx';
import type Entity from '@deities/athena/map/Entity.tsx';
import { isBuilding, isUnit } from '@deities/athena/map/Entity.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import { css } from '@emotion/css';
import type { State } from '../../Types.tsx';
import type { EntityUndoKey } from '../Types.tsx';

const getAIBehaviorText = (behavior: AIBehavior) => {
  switch (behavior) {
    case AIBehavior.Attack:
      return <fbt desc="Label for attack AI behavior">ATK</fbt>;
    case AIBehavior.Defense:
      return <fbt desc="Label for defensive AI behavior">DEF</fbt>;
    case AIBehavior.Stay:
      return <fbt desc="Label for stay AI behavior">STY</fbt>;
    case AIBehavior.Adaptive:
      return <fbt desc="Label for adaptive AI behavior">ADPTV</fbt>;
    case AIBehavior.Passive:
      return <fbt desc="Label for passive AI behavior">PSV</fbt>;
    default: {
      behavior satisfies never;
      throw new UnknownTypeError('AIBehaviorLink', behavior);
    }
  }
};

export default function AIBehaviorLink({
  behavior,
  entity,
  updateEntity,
}: {
  behavior: AIBehavior;
  entity: Entity;
  updateEntity: (
    undoKey: EntityUndoKey,
    entity: Entity,
  ) => Promise<State | void>;
}) {
  if (isUnit(entity)) {
    return (
      <InlineLink
        className={buttonStyle}
        onClick={() =>
          updateEntity(`behavior-${behavior}`, entity.setAIBehavior(behavior))
        }
        selectedText={entity.matchesBehavior(behavior)}
      >
        {getAIBehaviorText(behavior)}
      </InlineLink>
    );
  }

  if (isBuilding(entity)) {
    return (
      <InlineLink
        className={buttonStyle}
        onClick={() =>
          updateEntity(
            `behavior-${behavior}`,
            entity.matchesBehavior(behavior)
              ? entity.removeAIBehavior(behavior)
              : entity.addAIBehavior(behavior),
          )
        }
        selected={entity.matchesBehavior(behavior)}
      >
        {getAIBehaviorText(behavior)}
      </InlineLink>
    );
  }

  return null;
}

const buttonStyle = css`
  padding: 4px 4px 2px;
`;
