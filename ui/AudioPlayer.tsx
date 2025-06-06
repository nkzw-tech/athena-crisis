import { SongName, SoundName } from '@deities/athena/info/Music.tsx';
import parseInteger from '@nkzw/core/parseInteger.js';
import { Music, Sounds } from 'athena-crisis:audio';
import { Howl, Howler } from 'howler';

export type AudioVolumeType = 'master' | 'music' | 'sound';

// Keep in sync with `ares/index.html`.
const storageKeys = {
  master: '::AC::volume',
  music: '::AC::volume-music',
  sound: '::AC::volume-sound',
} as const;

const pausedKey = '::AC::paused';

const isMusic = (name: SoundName | SongName): name is SongName =>
  Music.has(name as SongName);

class AudioPlayer {
  private readonly instances = new Map<SongName | SoundName, Howl>();
  private currentInstance: Howl | null = null;
  private currentSong: SongName | null = null;
  private didPreload = false;
  private paused = parseInteger(localStorage.getItem(pausedKey) || '') === 1;

  constructor(
    private readonly music: ReadonlyMap<SongName | SoundName, string>,
  ) {}

  preload() {
    if (!this.didPreload) {
      this.didPreload = true;
      (window.requestIdleCallback || requestAnimationFrame)(() => {
        for (const [name] of Sounds) {
          this.getInstance(name);
        }
      });
    }
  }

  play(song: SongName) {
    const instance = this.getInstance(song);
    const previousSong = this.currentSong;
    if (this.currentInstance === instance) {
      return;
    }

    this.stopCurrentSong();
    this.currentInstance = instance;
    this.currentSong = song;

    const volume = getVolume('music');
    if (volume <= 0) {
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        `%caudio ›${
          previousSong ? ` from '${previousSong}' to` : ''
        } '${song}'.`,
        `color: #777;`,
      );
    }

    if (!this.paused) {
      instance.volume(volume);
      instance.off('fade');
      if (!instance.playing()) {
        instance.fade(0, volume, 250);
      }
      instance.play();
    }
  }

  playSound(sound: SoundName, rate = 1) {
    if (rate > 1 && sound === 'Attack/MG') {
      sound = 'Attack/MGFast';
      rate = 1;
    }

    const instance = this.getInstance(sound);
    const reduceVolume = sound === 'Fireworks' || sound.startsWith('Talking/');
    const volume = getVolume('sound') * (reduceVolume ? 0.66 : 1);

    if (
      this.paused ||
      rate <= 0 ||
      rate === Number.POSITIVE_INFINITY ||
      volume <= 0
    ) {
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`%caudio › playing sound '${sound}'.`, `color: #777;`);
    }

    if (instance.playing()) {
      instance.seek(0);
    }

    instance.volume(volume);
    instance.rate(rate);
    instance.play();
  }

  playOrContinueSound(sound: SoundName, rate = 1) {
    const instance = this.getInstance(sound);
    if (!instance.playing()) {
      this.playSound(sound, rate);
    }
  }

  stop(name: SoundName | SongName, duration = 250) {
    const instance = this.getInstance(name);
    instance.off('fade');
    if (instance.playing() && duration > 0) {
      instance.fade(instance.volume() || 1, 0, duration);
      instance.once('fade', () => instance.stop());
    } else {
      instance.stop();
    }
  }

  stopCurrentSong() {
    const song = this.currentSong;
    if (song) {
      this.stop(song);
    }
    this.currentInstance = null;
    this.currentSong = null;
  }

  isPaused() {
    return this.paused;
  }

  pause(temporary?: boolean) {
    if (this.paused) {
      return;
    }

    this.paused = true;
    this.currentInstance?.pause();
    if (!temporary) {
      localStorage.setItem(pausedKey, String(1));
    }
  }

  resume() {
    if (!this.paused) {
      return;
    }

    this.paused = false;
    localStorage.removeItem(pausedKey);
    const instance = this.currentInstance;
    const volume = getVolume('music');
    if (instance && volume > 0) {
      if (instance.volume() <= 0) {
        instance.volume(volume);
      }

      if (!instance.playing()) {
        instance.play();
      }
    }
  }

  togglePause() {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  getVolume(type: AudioVolumeType) {
    return type === 'master' ? Howler.volume() : (getVolume(type) ?? 1);
  }

  setVolume(type: AudioVolumeType, volume: number) {
    const previousVolume = getVolume('music');
    localStorage.setItem(storageKeys[type], String(volume));
    if (type === 'master') {
      Howler.volume(volume);
    } else if (type === 'music') {
      this.currentInstance?.volume(volume);
      const song = this.currentSong;
      if (song && previousVolume <= 0 && volume > 0) {
        this.currentInstance?.stop();
        this.currentInstance = null;
        requestAnimationFrame(() => this.play(song));
      }
    }

    if (
      (type === 'music' || type === 'sound') &&
      getVolume('music') <= 0 &&
      getVolume('sound') <= 0
    ) {
      this.pause();
    }
  }

  private getInstance(name: SongName | SoundName) {
    if (!this.instances.has(name)) {
      const source = this.music.get(name);
      if (!source) {
        throw new Error(`No source for '${name}'.`);
      }

      const isMusicType = isMusic(name);
      const isMessageSound = name.startsWith('Talking/');
      const instance = new Howl({
        html5: false,
        loop: isMusicType || isMessageSound,
        onplayerror: isMusicType
          ? () =>
              instance.once('unlock', () => {
                if (this.currentInstance === instance && !instance.playing()) {
                  instance.play();
                }
              })
          : undefined,
        src: [source],
      });

      this.instances.set(name, instance);
    }
    return this.instances.get(name)!;
  }
}

const getVolume = (type: AudioVolumeType) => {
  const volume = Number.parseFloat(
    localStorage.getItem(storageKeys[type]) || '',
  );
  return Number.isFinite(volume) && volume >= 0 && volume <= 1 ? volume : 1;
};

const hasMasterVolume = () => localStorage.getItem(storageKeys.master) !== null;

Howler.volume(hasMasterVolume() ? getVolume('master') : 0.66);

const audioPlayer = new AudioPlayer(new Map([...Music, ...Sounds]));

export default audioPlayer;

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    audioPlayer.stopCurrentSong();
  });
}
