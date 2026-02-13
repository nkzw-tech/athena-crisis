import { SongName, SoundName } from '@deities/athena/info/Music.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { App } from '@deities/ui/App.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import { NativeTimeout } from '@deities/ui/controls/throttle.tsx';
import useLocation from '@deities/ui/hooks/useLocation.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import useVisibilityState from '@nkzw/use-visibility-state';
import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';

type MusicContext = {
  songByRoute: Map<string, SongName | null>;
  timer?: NativeTimeout;
};

const fallbackSong = 'hestias-serenade';
const context: MusicContext = {
  songByRoute: new Map(),
  timer: undefined,
};
const Context = createContext<MusicContext>(context);

export const MusicContext = ({ children }: { children: ReactNode }) => (
  <Context value={context}>{children}</Context>
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

let resume = false;
let timer: NativeTimeout = null;

export function updateMusicOnVisibilityChange(isVisible: boolean) {
  if (timer != null) {
    clearTimeout(timer);
  }

  if (!App.canQuit) {
    if (!document.hidden && resume && isVisible) {
      AudioPlayer.resume();
      resume = false;
    } else if (!isVisible && !AudioPlayer.isPaused()) {
      // Visibility change is fired on reload and navigation.
      // We can avoid pausing music on navigation by using a timer.
      timer = setTimeout(() => {
        AudioPlayer.pause(true);
        resume = true;
      }, 100);
    }
  }
}

export function usePlayMusic(dep?: unknown) {
  const { pathname } = useLocation();
  const contextRef = useRef(useContext(Context));

  useVisibilityState(updateMusicOnVisibilityChange);

  useEffect(() => {
    const context = contextRef.current;
    if (context.timer != null) {
      clearTimeout(context.timer);
    }
    context.timer = setTimeout(
      () => AudioPlayer.play(context.songByRoute.get(pathname) || fallbackSong),
      isPlaying(document.getElementById('video')?.querySelector<HTMLVideoElement>('video'))
        ? 3000
        : 100,
    );
  }, [pathname, dep]);
}

export function biomeToSong(biome: Biome, tags: ReadonlyArray<string> | undefined): SongName {
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

export function crystalToSound(crystal: Crystal): SoundName {
  switch (crystal) {
    case Crystal.Power:
      return 'Crystal/Power';
    case Crystal.Help:
      return 'Crystal/Help';
    case Crystal.Phantom:
      return 'Crystal/Phantom';
    case Crystal.Command:
      return 'Crystal/Command';
    case Crystal.Super:
      return 'Crystal/Super';
    case Crystal.Memory:
      return 'Crystal/Memory';
    default: {
      crystal satisfies never;
      throw new UnknownTypeError('crystalToSound', crystal);
    }
  }
}
