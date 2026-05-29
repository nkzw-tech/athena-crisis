export type PlayStyle = 'Beginner' | 'Hard' | 'Intermediate' | 'SuperHard';

/* eslint-disable perfectionist/sort-objects */
export const PlayStyle: Record<PlayStyle, PlayStyle> = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Hard: 'Hard',
  SuperHard: 'SuperHard',
};
/* eslint-enable perfectionist/sort-objects */
