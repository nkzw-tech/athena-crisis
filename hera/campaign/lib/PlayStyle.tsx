import { fbt } from 'fbt';

export type PlayStyleType =
  | 'Beginner'
  | 'Hard'
  | 'Intermediate'
  | '%future added value';

type ActualPlayStyle = Exclude<PlayStyleType, '%future added value'>;

/* eslint-disable sort-keys-fix/sort-keys-fix */
const PlayStyle: Record<ActualPlayStyle, ActualPlayStyle> = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Hard: 'Hard',
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

export default PlayStyle;

export function getTranslatedPlayStyleName(playStyle: PlayStyleType) {
  switch (playStyle) {
    case PlayStyle.Beginner:
      return fbt('Easy', 'PlayStyle name');
    case PlayStyle.Intermediate:
      return fbt('Intermediate', 'PlayStyle name');
    case PlayStyle.Hard:
      return fbt('Hard', 'PlayStyle name');
  }
}
