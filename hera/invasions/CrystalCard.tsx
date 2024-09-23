import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { ReactNode } from 'react';
import CrystalSprite from './CrystalSprite.tsx';
import crystalToColor from './crystalToColor.tsx';
import getCrystalDescription from './getCrystalDescription.tsx';
import getTranslatedCrystalName from './getTranslatedCrystalName.tsx';

export default function CrystalCard({
  active,
  children,
  crystal,
}: {
  active?: boolean;
  children?: ReactNode;
  crystal: Crystal;
}) {
  return (
    <Stack alignCenter gap={16} nowrap>
      <div>
        <CrystalSprite animate crystal={crystal} portal={active} />
      </div>
      <Stack gap start vertical>
        <div style={{ color: crystalToColor(crystal) }}>
          {getTranslatedCrystalName(crystal)}
        </div>
        <p>{getCrystalDescription(crystal)}</p>
        {children}
      </Stack>
    </Stack>
  );
}
