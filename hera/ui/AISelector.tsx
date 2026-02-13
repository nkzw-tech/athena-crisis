import { AIRegistryT } from '@deities/apollo/actions/executeGameAction.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Select from '@deities/ui/Select.tsx';
import Stack from '@nkzw/stack';

export default function AISelector({
  currentAI,
  registry,
  setAI,
}: {
  currentAI: number | undefined;
  registry: AIRegistryT;
  setAI: (id: number) => void;
}) {
  const currentEntry = (currentAI != null ? registry.get(currentAI) : registry.get(0))!;
  return (
    <Stack alignCenter between gap={16} wrap>
      <fbt desc="Label to pick an AI">AI:</fbt>
      <Select selectedItem={currentEntry.name}>
        {[...registry].map(([id, { name }]) => (
          <InlineLink key={id} onClick={() => setAI(id)} selectedText={id === currentAI}>
            {name}
          </InlineLink>
        ))}
      </Select>
    </Stack>
  );
}
