import React, {useState} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {formatLength} from '../catalogue/catalogue';
import {Video} from '../catalogue/types';
import {thumbnailUrl} from '../data/catalogue';

interface Props {
  video: Video;
  watched: boolean;
  /** How many of the video's words are new to the learner; undefined while its captions load. */
  newWordCount?: number;
  hasTVPreferredFocus?: boolean;
  onPress: () => void;
}

const CARD_WIDTH = 352;
/** How much a focused card grows. Rows leave room for it so it stays inside the safe area. */
const FOCUS_SCALE = 1.08;

function newWordsLabel(count: number): string {
  if (count === 0) {
    return 'No new words';
  }
  return count === 1 ? '1 new word' : `${count} new words`;
}

/** A catalogue video on the home screen: thumbnail, title, length, HSK level and progress. */
export const VideoCard = ({video, watched, newWordCount, hasTVPreferredFocus, onPress}: Props) => {
  const [focused, setFocused] = useState(false);
  const length = formatLength(video.lengthSeconds);
  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      accessibilityRole="button"
      accessibilityLabel={`${video.title}, HSK ${video.level}, ${length}${watched ? ', watched' : ''}`}
      style={[styles.card, focused && styles.focused]}>
      <View style={styles.thumbnail}>
        <Image source={{uri: thumbnailUrl(video.id)}} style={styles.image} resizeMode="cover" />
        <Text style={[styles.badge, styles.level]}>HSK {video.level}</Text>
        {watched ? <Text style={[styles.badge, styles.watched]}>✓ Watched</Text> : null}
        <Text style={[styles.badge, styles.length]}>{length}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.newWords}>
            {newWordCount === undefined ? ' ' : newWordsLabel(newWordCount)}
          </Text>
          <Text style={styles.credit}>{video.credit}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const THUMB_HEIGHT = (CARD_WIDTH * 9) / 16;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: 'transparent',
    backgroundColor: '#323766',
    overflow: 'hidden',
  },
  focused: {
    borderColor: '#FFFFFF',
    transform: [{scale: FOCUS_SCALE}],
  },
  thumbnail: {height: THUMB_HEIGHT, backgroundColor: '#1E2147'},
  image: {...StyleSheet.absoluteFillObject},
  badge: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  level: {top: 12, left: 12, backgroundColor: '#6E70A6'},
  watched: {top: 12, right: 12, backgroundColor: 'rgba(46,125,50,0.9)'},
  length: {bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)'},
  info: {paddingHorizontal: 16, paddingVertical: 12},
  title: {color: '#FFFFFF', fontSize: 26, fontWeight: '600', minHeight: 64},
  meta: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 6},
  newWords: {color: '#FFD966', fontSize: 22},
  credit: {color: '#AAAAAA', fontSize: 20},
});
