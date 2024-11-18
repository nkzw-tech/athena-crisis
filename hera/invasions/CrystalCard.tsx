import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import lineClamp from '@deities/ui/lineClamp.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { cx } from '@emotion/css';
import { ReactNode, useState } from 'react';
import CrystalSprite from './CrystalSprite.tsx';
import crystalToColor from './crystalToColor.tsx';
import getCrystalDescription from './getCrystalDescription.tsx';
import getTranslatedCrystalName from './getTranslatedCrystalName.tsx';

export default function CrystalCard({
  active,
  children,
  collapse,
  crystal,
  pageSize,
}: {
  active?: boolean;
  children?: ReactNode;
  collapse?: boolean;
  crystal: Crystal;
  pageSize?: 'small' | 'large';
}) {
  const [initialPageSize] = useState(pageSize);
  const [showMore, setShowMore] = useState(
    collapse ? pageSize === 'large' : false,
  );

  return (
    <Stack alignCenter gap={16} nowrap>
      <div>
        <CrystalSprite animate crystal={crystal} portal={active} />
      </div>
      <Stack gap start vertical>
        <div style={{ color: crystalToColor(crystal) }}>
          {getTranslatedCrystalName(crystal)}
        </div>
        <Stack gap={4} vertical>
          <p className={cx(!showMore && collapse && lineClamp)}>
            {getCrystalDescription(crystal)}
          </p>
          {collapse && initialPageSize === 'small' && (
            <div>
              <InlineLink onClick={() => setShowMore((showMore) => !showMore)}>
                {showMore ? (
                  <fbt desc="Button to show less">Show less</fbt>
                ) : (
                  <fbt desc="Button to show more">Show more</fbt>
                )}
              </InlineLink>
            </div>
          )}
        </Stack>
        {children}
      </Stack>
    </Stack>
  );
}
