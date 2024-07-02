import { Effects, Scenario } from '@deities/apollo/Effects.tsx';
import { Objectives } from '@deities/athena/Objectives.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Select from '@deities/ui/Select.tsx';
import EffectTitle from '../lib/EffectTitle.tsx';

export default function EffectSelector({
  effects,
  scenario: { effect: currentEffect, trigger: currentTrigger },
  setScenario,
  winConditions,
}: {
  effects: Effects;
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;
  winConditions: Objectives | undefined;
}) {
  return (
    <Select
      selectedItem={
        <EffectTitle
          effect={currentEffect}
          effects={effects}
          trigger={currentTrigger}
          winConditions={winConditions}
        />
      }
    >
      {[...effects].flatMap(([trigger, list]) =>
        [...list].map((effect, key) => (
          <InlineLink
            key={`${trigger}-${key}`}
            onClick={() => setScenario({ effect, trigger })}
            selectedText={
              trigger === currentTrigger && currentEffect === effect
            }
          >
            <EffectTitle
              effect={effect}
              effects={effects}
              trigger={trigger}
              winConditions={winConditions}
            />
          </InlineLink>
        )),
      )}
    </Select>
  );
}
