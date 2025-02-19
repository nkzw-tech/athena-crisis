import { PlayerID } from '@deities/athena/map/Player.tsx';

type BaseNotification = Readonly<{
  body: string;
  timestamp: number;
  title: string;
}>;

export type TurnPushNotification = Readonly<{
  data: Readonly<{
    campaignStateId?: string;
    game: string;
    mapName: string;
    player: PlayerID;
    userId: string;
  }>;
  tag: 'turn';
}>;

export type InvasionPushNotification = Readonly<{
  data: Readonly<{
    campaignStateId: string;
    game: string;
  }>;
  tag: 'invasion';
}>;

export type DeviceInfo = Readonly<{
  browser: string;
  os: {
    name: string;
    version: string;
  };
  type: string;
}>;

export type PushNotification = BaseNotification &
  (TurnPushNotification | InvasionPushNotification);
