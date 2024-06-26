import { SongName } from '@deities/athena/info/Music.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import useLocation from '@deities/ui/hooks/useLocation.tsx';
import { createContext, ReactNode, useContext, useEffect } from 'react';

type MusicContext = {
  songByRoute: Map<string, SongName | null>;
  timer?: ReturnType<typeof setTimeout>;
};

const fallbackSong = 'hestias-serenade';
const context: MusicContext = {
  songByRoute: new Map(),
  timer: undefined,
};
const Context = createContext<MusicContext>(context);

export const MusicContext = ({ children }: { children: ReactNode }) => (
  <Context.Provider value={context}>{children}</Context.Provider>
);

export default function useMusic(song: SongName) {
  const location = useLocation();
  const context = useContext(Context);
  useEffect(() => {
    context.songByRoute.set(location.pathname, song);
    return () => {
      context.songByRoute.delete(location.pathname);
    };
  }, [context, song, location.pathname]);
  usePlayMusic();
}

const isPlaying = (video: HTMLVideoElement | null | undefined) =>
  video && !video.paused && !video.ended && video.currentTime > 0;

export function usePlayMusic(dep?: unknown) {
  const { pathname } = useLocation();
  const context = useContext(Context);
  useEffect(() => {
    clearTimeout(context.timer);
    context.timer = setTimeout(
      () => AudioPlayer.play(context.songByRoute.get(pathname) || fallbackSong),
      isPlaying(
        document
          .getElementById('video')
          ?.querySelector<HTMLVideoElement>('video'),
      )
        ? 3000
        : 100,
    );
  }, [context, pathname, dep]);
}

export function biomeToSong(
  biome: Biome,
  tags: ReadonlyArray<string> | undefined,
): SongName {
  if (tags?.includes('eos-dawn')) {
    return 'eos-dawn';
  } else if (tags?.includes('gaias-rise')) {
    return 'gaias-rise';
  }

  if (tags?.includes('b-side')) {
    switch (biome) {
      case Biome.Grassland:
        return 'artemis-glade';
      case Biome.Desert:
        return 'apollos-ascend';
      case Biome.Snow:
        return 'chiones-cloud';
      case Biome.Swamp:
        return 'poseidons-wrath';
      case Biome.Spaceship:
        return 'astraeus-wings';
      case Biome.Volcano:
        return 'ares-skirmish';
      case Biome.Luna:
        return 'selenes-voyage';
      default: {
        biome satisfies never;
        throw new UnknownTypeError('biomeToSong', biome);
      }
    }
  }

  switch (biome) {
    case Biome.Grassland:
      return 'artemis-hunt';
    case Biome.Desert:
      return 'apollos-gleam';
    case Biome.Snow:
      return 'chiones-leap';
    case Biome.Swamp:
      return 'poseidons-tide';
    case Biome.Spaceship:
      return 'astraeus-expanse';
    case Biome.Volcano:
      return 'ares-chaos';
    case Biome.Luna:
      return 'selenes-tranquility';
    default: {
      biome satisfies never;
      throw new UnknownTypeError('biomeToSong', biome);
    }
  }
}

export function useBiomeMusic(
  biome: Biome | undefined | null,
  tags: ReadonlyArray<string> | undefined,
) {
  useMusic(biome != null ? biomeToSong(biome, tags) : fallbackSong);
}
