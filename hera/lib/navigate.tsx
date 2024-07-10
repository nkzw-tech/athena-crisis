import { Direction } from '../hooks/useGridNavigation.tsx';

export default function navigate(
  direction: Direction,
  columns: number,
  index: number | null,
  list: ReadonlyArray<unknown>,
  [select, selectLast, selectPrevious, selectNext]: [
    select: (index: number) => void,
    selectLast?: () => void,
    selectPrevious?: (index: number, columns: number) => void,
    selectNext?: (index: number) => void,
  ],
) {
  const offset =
    direction === 'up'
      ? -columns
      : direction === 'down'
        ? columns
        : direction === 'left'
          ? -1
          : 1;

  if (index != null && index > -1) {
    const nextIndex = index + offset;
    if (list[nextIndex]) {
      select(nextIndex);
    } else if (nextIndex === list.length) {
      selectLast?.();
    } else if (nextIndex > list.length) {
      selectNext?.(nextIndex % columns);
    } else if (nextIndex < 0) {
      selectPrevious?.(nextIndex % columns, columns);
    }
  }
}
