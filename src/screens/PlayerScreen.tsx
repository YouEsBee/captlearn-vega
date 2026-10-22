import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Image, Platform, StyleSheet, Text, View} from 'react-native';
import {
  useKeplerAppStateManager,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {
  KeplerVideoSurfaceView,
  VideoPlayer,
} from '@amazon-devices/react-native-w3cmedia';
import {AppOverrideMediaControlHandler} from '../utils/AppOverrideMediaControlHandler';
import {CaptionOverlay} from '../components/CaptionOverlay';
import {BarTarget, Timeline} from '../components/Timeline';

// Remote key actions and tuning for the D-pad controls.
const KEY_DOWN = 0;
const KEY_UP = 1;
const SKIP_SECONDS = 10;
const SCRUB_STEP_SECONDS = 5;
const SCRUB_DELAY_MS = 400;
const SCRUB_INTERVAL_MS = 200;

// video: no controls. bar: progress bar shown. buttons: top Play/Finish/Back focused.
type Zone = 'video' | 'controls';
interface Hold {
  dir: number;
  delay?: ReturnType<typeof setTimeout>;
  repeat?: ReturnType<typeof setInterval>;
}
import {FocusButton} from '../components/FocusButton';
import {Spinner} from '../components/Spinner';
import {activeCue} from '../captions/captions';
import {splitCues} from '../captions/splitCues';
import {
  applyGlosses,
  splitNativeLine,
  indexLexicon,
  tokenize,
  wordIdsInCues,
} from '../learning/substitute';
import {MasteryMap, isLearnt} from '../learning/mastery';
import {Cue, LexiconEntry, Settings} from '../learning/types';
import {videoUrl} from '../catalogue/catalogueSource';

interface Props {
  videoId: string;
  /** The video's thumbnail, shown until playback starts. */
  thumbnail: string;
  /** The video's captions, made ahead of time. */
  cues: Cue[];
  settings: Settings;
  lexicon: LexiconEntry[];
  mastery: MasteryMap;
  /** Called when the video ends or the learner presses Finish, with the word ids it covered. */
  onFinished: (coveredIds: string[]) => void;
  onExit: () => void;
}

export const PlayerScreen = ({
  videoId,
  thumbnail,
  cues,
  settings,
  lexicon,
  mastery,
  onFinished,
  onExit,
}: Props) => {
  // On-screen status, so problems show up without the developer console.
  const [status, setStatus] = useState<string[]>(['starting']);
  const addStatus = (line: string) => setStatus(s => [...s.slice(-5), line]);

  const index = useMemo(() => indexLexicon(lexicon), [lexicon]);
  const entriesById = useMemo(
    () => new Map(lexicon.map(e => [e.id, e])),
    [lexicon],
  );

  const video = useRef<VideoPlayer>(new VideoPlayer());
  const keplerAppStateManager = useKeplerAppStateManager();
  const componentInstance = keplerAppStateManager.getComponentInstance();
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0);
  durationRef.current = duration;
  const [zone, setZone] = useState<Zone>('video');
  const zoneRef = useRef<Zone>('video');
  // True while the progress track is entered: left and right move the video.
  const [scrubbing, setScrubbing] = useState(false);
  const scrubRef = useRef(false);
  // Which bar element has focus, and a counter that remounts the bar to focus it.
  const [barTarget, setBarTarget] = useState<BarTarget>('track');
  const barTargetRef = useRef<BarTarget>('track');
  const [barNonce, setBarNonce] = useState(0);
  const holdRef = useRef<Hold | null>(null);
  const [playing, setPlaying] = useState(false);
  // The thumbnail and a spinner cover the screen until playback first starts.
  const [started, setStarted] = useState(false);
  // Set when the video can't load or play, so the cover says so instead of spinning.
  const [failed, setFailed] = useState(false);
  // The surface is only rendered once the media has loaded (same order as the Vega sample).
  const [mediaLoaded, setMediaLoaded] = useState(false);

  // The effect below is set up once per video, so it reads the latest values through refs.
  // Long lines are split into shorter timed pieces, so the captions can use a larger font.
  const captionCues = useMemo(
    () => splitCues(cues, settings.targetLang, index),
    [cues, settings.targetLang, index],
  );
  const cuesRef = useRef<Cue[]>([]);
  cuesRef.current = captionCues;
  const finishRef = useRef<() => void>(() => {});

  const finish = () => {
    video.current.pause();
    setPlaying(false);
    onFinished(wordIdsInCues(cuesRef.current, index, settings.targetLang));
  };
  finishRef.current = finish;

  useEffect(() => {
    const player = video.current;
    const onTimeUpdate = () => setTime(player.currentTime);
    const onEnded = () => finishRef.current();
    const onLoadedMetadata = () => {
      addStatus('media loaded');
      setDuration(player.duration || 0);
      setMediaLoaded(true);
    };
    // Same error fields the official sample reads (mediaControlStateUtil.mError).
    const onError = (event: any) => {
      // Try the standard media error first, then the sample's internal field.
      const std = (player as any).error;
      const internal = event?.target?.mediaControlStateUtil?.mError;
      const code = std?.code ?? internal?.code_ ?? 'none';
      const message = std?.message ?? internal?.message_ ?? 'no message';
      setFailed(true);
      addStatus(`media error code=${code}`);
      addStatus(`detail: ${String(message).slice(0, 80)}`);
      addStatus(`event keys: ${Object.keys(event ?? {}).join(',').slice(0, 60)}`);
    };

    player.addEventListener('timeupdate', onTimeUpdate);
    player.addEventListener('ended', onEnded);
    player.addEventListener('loadedmetadata', onLoadedMetadata);
    player.addEventListener('error', onError);
    // Some players don't fire timeupdate reliably, so also poll the position.
    const poll = setInterval(() => {
      setTime(player.currentTime);
      // Duration can arrive after the first metadata event, so keep checking until known.
      setDuration(d => d || player.duration || 0);
    }, 250);

    // Attach to the app's media controls first, as the official sample does.
    const attachControls = async () => {
      try {
        await player.setMediaControlFocus(
          componentInstance,
          new AppOverrideMediaControlHandler(player, false),
        );
        addStatus('media controls attached');
      } catch (err) {
        addStatus(`controls error: ${String(err)}`);
      }
    };

    attachControls()
      .then(() => player.initialize())
      .then(() => {
        player.autoplay = false;
        player.src = videoUrl(videoId);
        // Same order as the official sample's loadStaticMediaPlayer: pause, then load.
        player.pause();
        player.load();
        addStatus('loading media');
      })
      .catch(err => addStatus(`init error: ${String(err)}`));

    return () => {
      player.removeEventListener('timeupdate', onTimeUpdate);
      player.removeEventListener('ended', onEnded);
      player.removeEventListener('loadedmetadata', onLoadedMetadata);
      player.removeEventListener('error', onError);
      clearInterval(poll);
      player.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Once the surface exists, hand it to the player and start playback.
  const onSurfaceViewCreated = (surfaceHandle: string) => {
    addStatus('surface created');
    video.current.setSurfaceHandle(surfaceHandle);
    video.current
      .play()
      .then(() => {
        setPlaying(true);
        setStarted(true);
        addStatus('playing');
      })
      .catch(err => {
        setFailed(true);
        addStatus(`play error: ${String(err)}`);
      });
  };

  const onSurfaceViewDestroyed = (surfaceHandle: string) => {
    video.current.clearSurfaceHandle(surfaceHandle);
  };

  const togglePlay = () => {
    if (playing) {
      video.current.pause();
      setPlaying(false);
    } else {
      video.current.play();
      setPlaying(true);
      setStarted(true);
    }
  };

  const cue = activeCue(captionCues, time);

  // Seeks by a number of seconds, clamped to the start and end of the video.
  const seekBy = (seconds: number) => {
    const player = video.current as any;
    const limit = durationRef.current > 0 ? durationRef.current : Infinity;
    const target = Math.max(0, Math.min(limit, (player.currentTime ?? 0) + seconds));
    player.currentTime = target;
    setTime(target);
  };

  // Holding left or right: one skip on press, then steady scrubbing after a short delay.
  const stopSeek = () => {
    const hold = holdRef.current;
    if (!hold) {
      return;
    }
    clearTimeout(hold.delay);
    clearInterval(hold.repeat);
    holdRef.current = null;
  };

  const startSeek = (dir: number) => {
    // Auto-repeat key-downs from a held button are ignored; the timers handle them.
    if (holdRef.current?.dir === dir) {
      return;
    }
    stopSeek();
    seekBy(dir * SKIP_SECONDS);
    const hold: Hold = {dir};
    hold.delay = setTimeout(() => {
      hold.repeat = setInterval(
        () => seekBy(dir * SCRUB_STEP_SECONDS),
        SCRUB_INTERVAL_MS,
      );
    }, SCRUB_DELAY_MS);
    holdRef.current = hold;
  };

  const moveZone = (next: Zone) => {
    zoneRef.current = next;
    setZone(next);
  };

  const focusBar = (target: BarTarget) => {
    barTargetRef.current = target;
    setBarTarget(target);
    setBarNonce(n => n + 1);
  };

  const setScrub = (on: boolean) => {
    scrubRef.current = on;
    setScrubbing(on);
    if (!on) {
      stopSeek();
    }
  };

  // Moves focus along the bar: Back, Play/Pause, progress track, Skip.
  const moveFocus = (dir: number) => {
    const order: BarTarget[] = ['back', 'play', 'track', 'skip'];
    const i = order.indexOf(barTargetRef.current);
    focusBar(order[Math.max(0, Math.min(order.length - 1, i + dir))]);
  };

  // D-pad: up shows the controls and focuses the track. Left and right move between the bar's
  // elements, except once the track is entered (OK): then they seek. Only OK leaves seek mode.
  useTVEventHandler((evt: any) => {
    if (!Platform.isTV || !evt) {
      return;
    }
    if (evt.eventKeyAction === KEY_UP) {
      if (evt.eventType === 'left' || evt.eventType === 'right') {
        stopSeek();
      }
      return;
    }
    if (evt.eventKeyAction !== KEY_DOWN) {
      return;
    }
    const current = zoneRef.current;
    switch (evt.eventType) {
      case 'up':
        if (current === 'video') {
          moveZone('controls');
          focusBar('track');
        }
        break;
      case 'down':
        // While seeking, only OK leaves seek mode, so down does nothing then.
        if (current === 'controls' && !scrubRef.current) {
          moveZone('video');
        }
        break;
      case 'left':
      case 'right': {
        if (current !== 'controls') {
          break;
        }
        const dir = evt.eventType === 'left' ? -1 : 1;
        if (scrubRef.current) {
          startSeek(dir);
        } else {
          moveFocus(dir);
        }
        break;
      }
    }
  });

  useEffect(
    () => () => {
      stopSeek();
    },
    [],
  );

  // English line: learnt words become underscores, with their Chinese directly beneath.
  const nativeSegments = useMemo(() => {
    if (!cue) {
      return [];
    }
    const learnt = tokenize(cue.text, settings.targetLang, index)
      .filter(t => t.wordId && isLearnt(mastery, t.wordId))
      .map(t => entriesById.get(t.wordId ?? ''))
      .filter((e): e is LexiconEntry => !!e)
      .map(e => ({gloss: e.gloss, zh: e.word}));
    return splitNativeLine(cue.native ?? '', learnt);
  }, [cue, settings.targetLang, index, entriesById, mastery]);

  const segments = useMemo(() => {
    if (!cue) {
      return [];
    }
    const tokens = tokenize(cue.text, settings.targetLang, index);
    return applyGlosses(tokens, entriesById, mastery);
  }, [cue, settings.targetLang, index, entriesById, mastery]);

  return (
    <View style={styles.container}>
      {mediaLoaded && (
        <View style={styles.video}>
          <KeplerVideoSurfaceView
            style={{zIndex: 0}}
            onSurfaceViewCreated={onSurfaceViewCreated}
            onSurfaceViewDestroyed={onSurfaceViewDestroyed}
          />
        </View>
      )}

      {!started && (
        <View style={styles.cover}>
          <Image source={{uri: thumbnail}} style={styles.cover} resizeMode="cover" />
          {failed ? (
            <Text style={styles.failed}>This video can't play right now. Press Back and try again.</Text>
          ) : (
            <Spinner />
          )}
        </View>
      )}

      {cue ? (
        <CaptionOverlay
          nativeSegments={nativeSegments}
          targetSegments={segments}
        />
      ) : null}

      {started && mediaLoaded && zone === 'controls' && (
        <Timeline
          time={time}
          duration={duration}
          playing={playing}
          target={barTarget}
          nonce={barNonce}
          scrubbing={scrubbing}
          onFocusTarget={t => {
            barTargetRef.current = t;
            setBarTarget(t);
          }}
          onBack={() => {
            video.current.pause();
            onExit();
          }}
          onTogglePlay={togglePlay}
          onToggleScrub={() => setScrub(!scrubRef.current)}
          onSkip={() => finishRef.current()}
        />
      )}

      {/* To debug for video playing errors */}
      {/* <View style={styles.debug} pointerEvents="none">
        {status.map((line, i) => (
          <Text key={i} style={styles.debugText}>
            {line}
          </Text>
        ))}
        <Text style={styles.debugText}>time: {time.toFixed(1)}s</Text>
      </View> */}

    </View>
  );
};

const styles = StyleSheet.create({
  // Transparent, so the video surface underneath isn't covered by a black background.
  container: {flex: 1, backgroundColor: 'transparent'},
  video: {...StyleSheet.absoluteFillObject},
  cover: {...StyleSheet.absoluteFillObject, backgroundColor: '#000000', justifyContent: 'center'},
  failed: {
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 28,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  controls: {
    position: 'absolute',
    top: 32,
    right: 64,
    flexDirection: 'row',
  },
  debug: {
    position: 'absolute',
    top: 32,
    left: 64,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  debugText: {color: '#FFFFFF', fontSize: 18},
});
