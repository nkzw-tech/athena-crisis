import type { AIRegistryT } from '@deities/apollo/actions/executeGameAction.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Select from '@deities/ui/Select.tsx';
import Stack from '@deities/ui/Stack.tsx';

export default function AISelector({
  currentAI,
  registry,
  setAI,
}: {
  currentAI: number | undefined;
  registry: AIRegistryT;
  setAI: (id: number) => void;
}) {
  const currentEntry = (
    currentAI != null ? registry.get(currentAI) : registry.get(0)
  )!;
  return (
    <Stack alignCenter gap={16}>
      <fbt desc="Label to pick an AI">AI:</fbt>
      <Select selectedItem={currentEntry.name}>
        {[...registry].map(([id, { name }]) => (
          <InlineLink
            key={id}
            onClick={() => setAI(id)}
            selectedText={id === currentAI}
          >
            {name}
          </InlineLink>
        ))}
      </Select>
    </Stack>
  );
}
