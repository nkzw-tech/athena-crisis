import { Effects } from './Effects.tsx';

export type MapMetadata = Readonly<{
  effects?: Effects;
  name: string;
  rating?: number;
  tags?: ReadonlyArray<string>;
  teamPlay: boolean;
  totalRatings?: number;
}>;
