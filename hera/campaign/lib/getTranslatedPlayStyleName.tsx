import { PlayStyle } from '@deities/hermes/PlayStyle.tsx';
import { fbt } from 'fbt';

export default function getTranslatedPlayStyleName(playStyle: PlayStyle) {
  switch (playStyle) {
    case PlayStyle.Beginner:
      return fbt('Easy', 'PlayStyle name');
    case PlayStyle.Intermediate:
      return fbt('Intermediate', 'PlayStyle name');
    case PlayStyle.Hard:
      return fbt('Hard', 'PlayStyle name');
  }
}
