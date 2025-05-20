export type ConfirmActionStyle = 'Always' | 'Never' | 'Touch';

export default function useConfirmActionStyle(
  confirmActionStyle: ConfirmActionStyle | null | undefined,
) {
  return confirmActionStyle === 'Always'
    ? 'always'
    : confirmActionStyle === 'Never'
      ? 'never'
      : 'touch';
}
