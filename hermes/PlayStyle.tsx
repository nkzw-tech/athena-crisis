export type PlayStyle =
  | 'Beginner'
  | 'Hard'
  | 'Intermediate'
  | '%future added value';

type ActualPlayStyle = Exclude<PlayStyle, '%future added value'>;

/* eslint-disable sort-keys-fix/sort-keys-fix */
export const PlayStyle: Record<ActualPlayStyle, ActualPlayStyle> = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Hard: 'Hard',
};
/* eslint-enable sort-keys-fix/sort-keys-fix */
