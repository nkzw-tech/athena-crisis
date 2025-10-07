import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import lineClamp from '@deities/ui/lineClamp.tsx';
import { cx } from '@emotion/css';
import Stack, { VStack } from '@nkzw/stack';
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
    <Stack alignCenter between gap={16}>
      <div>
        <CrystalSprite animate crystal={crystal} portal={active} />
      </div>
      <VStack gap wrap>
        <div style={{ color: crystalToColor(crystal) }}>
          {getTranslatedCrystalName(crystal)}
        </div>
        <VStack between gap={4} wrap>
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
        </VStack>
        {children}
      </VStack>
    </Stack>
  );
}
