import { Effects, Scenario } from '@deities/apollo/Effects.tsx';
import { Objectives } from '@deities/athena/Objectives.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Select from '@deities/ui/Select.tsx';
import EffectTitle from '../lib/EffectTitle.tsx';

export default function EffectSelector({
  effects,
  objectives,
  scenario: { effect: currentEffect, trigger: currentTrigger },
  setScenario,
}: {
  effects: Effects;
  objectives: Objectives | undefined;
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;
}) {
  return (
    <Select
      selectedItem={
        <EffectTitle
          effect={currentEffect}
          effects={effects}
          objectives={objectives}
          trigger={currentTrigger}
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
              objectives={objectives}
              trigger={trigger}
            />
          </InlineLink>
        )),
      )}
    </Select>
  );
}
