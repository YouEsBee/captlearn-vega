import React, {useEffect, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';

/** Which bar element has focus. The buttons take focus; the track seeks only once it is entered. */
export type BarTarget = 'back' | 'play' | 'track' | 'skip';

/** "m:ss" for a time in seconds. */
export const formatTime = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

interface Props {
  time: number;
  duration: number;
  playing: boolean;
  /** Element to focus. Changing `nonce` remounts the bar so that element gets focus. */
  target: BarTarget;
  nonce: number;
  /** True while the track is entered: left and right move the video instead of the focus. */
  scrubbing: boolean;
  onFocusTarget: (target: BarTarget) => void;
  onBack: () => void;
  onTogglePlay: () => void;
  onToggleScrub: () => void;
  onSkip: () => void;
}

/**
 * One bar element. Only the element we have chosen is focusable, so the TV's own D-pad focus
 * can't move on by itself and two elements are never highlighted together.
 */
const BarItem = ({
  id,
  label,
  target,
  nonce,
  onFocusTarget,
  onPress,
  style,
  focusedStyle,
  children,
}: {
  id: BarTarget;
  label: string;
  target: BarTarget;
  nonce: number;
  onFocusTarget: (target: BarTarget) => void;
  onPress?: () => void;
  style: object;
  focusedStyle: object;
  children: React.ReactNode;
}) => {
  const focused = target === id;
  return (
    <Pressable
      key={`${id}-${nonce}`}
      focusable={focused}
      hasTVPreferredFocus={focused}
      onPress={onPress}
      onFocus={() => onFocusTarget(id)}
      accessibilityRole={onPress ? 'button' : 'adjustable'}
      accessibilityLabel={label}
      style={[style, focused && focusedStyle]}>
      {children}
    </Pressable>
  );
};

/** Triangle when paused (press to play), two bars when playing (press to pause). */
const PlayIcon = ({playing}: {playing: boolean}) =>
  playing ? (
    <View style={styles.pauseIcon}>
      <View style={styles.pauseBar} />
      <View style={styles.pauseBar} />
    </View>
  ) : (
    <View style={styles.playTriangle} />
  );

const KNOB = 28;

/** Bottom bar: Back, Play/Pause, the progress track (OK enters it to seek), and Skip. */
export const Timeline = ({
  time,
  duration,
  playing,
  target,
  nonce,
  scrubbing,
  onFocusTarget,
  onBack,
  onTogglePlay,
  onToggleScrub,
  onSkip,
}: Props) => {
  const fraction = duration > 0 ? Math.min(1, time / duration) : 0;
  const [trackWidth, setTrackWidth] = useState(0);

  // The knob and fill slide to the new position rather than jumping, so seeking is visible.
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: fraction,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [fraction, progress]);

  const slide = Math.max(trackWidth, 1);
  const fillWidth = progress.interpolate({inputRange: [0, 1], outputRange: [0, slide]});
  const knobLeft = progress.interpolate({inputRange: [0, 1], outputRange: [-KNOB / 2, slide - KNOB / 2]});

  const common = {target, nonce, onFocusTarget};
  return (
    <View style={styles.row}>
      <BarItem
        id="back"
        label="Back"
        {...common}
        onPress={onBack}
        style={styles.button}
        focusedStyle={styles.buttonFocused}>
        <Text style={styles.backIcon}>←</Text>
      </BarItem>
      <BarItem
        id="play"
        label={playing ? 'Pause' : 'Play'}
        {...common}
        onPress={onTogglePlay}
        style={styles.button}
        focusedStyle={styles.buttonFocused}>
        <PlayIcon playing={playing} />
      </BarItem>
      <Text style={styles.time}>{formatTime(time)}</Text>
      <BarItem
        id="track"
        label={scrubbing ? 'Seeking' : 'Progress'}
        {...common}
        onPress={onToggleScrub}
        style={styles.trackWrap}
        focusedStyle={[styles.trackFocused, scrubbing && styles.trackScrubbing]}>
        <View style={styles.track} onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}>
          <Animated.View style={[styles.fill, {width: fillWidth}]} />
          <Animated.View
            style={[styles.knob, scrubbing && styles.knobScrubbing, {left: knobLeft}]}
          />
        </View>
      </BarItem>
      <Text style={styles.time}>{formatTime(duration)}</Text>
      <BarItem
        id="skip"
        label="Skip"
        {...common}
        onPress={onSkip}
        style={styles.button}
        focusedStyle={styles.buttonFocused}>
        <Text style={styles.skipLabel}>Skip</Text>
      </BarItem>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 64,
    right: 64,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    minWidth: 72,
    height: 56,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  backIcon: {color: '#FFFFFF', fontSize: 32},
  playTriangle: {
    width: 0,
    height: 0,
    marginLeft: 4,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderLeftWidth: 22,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
  },
  pauseIcon: {flexDirection: 'row', gap: 8},
  pauseBar: {width: 8, height: 28, borderRadius: 2, backgroundColor: '#FFFFFF'},
  skipLabel: {color: '#FFFFFF', fontSize: 24, fontWeight: '600'},
  // A larger touch area around the track, so its focus outline is easy to see.
  trackWrap: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  trackFocused: {
    borderColor: '#FFFFFF',
  },
  // Entered for seeking: yellow outline while left and right move the video.
  trackScrubbing: {
    borderColor: '#FFD966',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  fill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD966',
  },
  // Round playhead showing where the video is up to.
  knob: {
    position: 'absolute',
    top: (8 - KNOB) / 2,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: '#FFFFFF',
  },
  knobScrubbing: {
    backgroundColor: '#FFD966',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  time: {color: '#FFFFFF', fontSize: 20, minWidth: 80, textAlign: 'center'},
});
