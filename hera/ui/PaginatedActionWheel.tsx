import { NavigationDirection } from '@deities/ui/controls/Input.tsx';
import Icon from '@deities/ui/Icon.tsx';
import More from '@deities/ui/icons/MoreHorizontal.tsx';
import { fbt } from 'fbtee';
import { ComponentProps, ReactNode, useState } from 'react';
import ActionWheel, { ActionWheelFunds, LargeActionButton } from './ActionWheel.tsx';

const MaxItems = 8;
const PageSize = MaxItems - 1;

export default function PaginatedActionWheel<T>({
  children,
  funds,
  items,
  navigationDirection,
  ...props
}: Omit<ComponentProps<typeof ActionWheel>, 'children' | 'entityCount'> & {
  children: (item: T, position: number, entityCount: number) => ReactNode;
  funds: number;
  items: ReadonlyArray<T>;
  navigationDirection: NavigationDirection | null;
}) {
  const [cursor, setCursor] = useState(0);
  const paginated = items.length > MaxItems;
  const offset = paginated && cursor < items.length ? cursor : 0;
  const visibleItems = paginated ? items.slice(offset, offset + PageSize) : items;
  const entityCount = visibleItems.length + (paginated ? 1 : 0);
  const nextCursor = offset + PageSize < items.length ? offset + PageSize : 0;

  return (
    <ActionWheel {...props} entityCount={entityCount}>
      <ActionWheelFunds funds={funds} />
      {visibleItems.map((item, position) => children(item, position, entityCount))}
      {paginated && (
        <LargeActionButton
          detail={
            nextCursor
              ? fbt('More', 'Button to show more menu items')
              : fbt('Back', 'Button to show previous menu items')
          }
          entityCount={entityCount}
          icon={(highlight, props) => <Icon icon={More} {...props} />}
          label={null}
          navigationDirection={navigationDirection}
          onClick={() => setCursor(nextCursor)}
          position={visibleItems.length}
        />
      )}
    </ActionWheel>
  );
}
