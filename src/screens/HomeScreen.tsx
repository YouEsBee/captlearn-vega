import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Avatar} from '../components/Avatar';
import {FocusButton} from '../components/FocusButton';
import {Gear} from '../components/Gear';
import {VideoCard} from '../components/VideoCard';
import {catalogueRows, nextVideo} from '../catalogue/catalogue';
import {Video} from '../catalogue/types';

interface Props {
  nickname: string;
  languageLabel: string;
  onCycleLanguage: () => void;
  onSwitchUser: () => void;
  onCreateUser: () => void;
  onOpenSettings: () => void;
  /** The catalogue, in suggested order. */
  videos: Video[];
  /** Ids of the videos this learner has watched. */
  watched: string[];
  /** New word count per video id; missing while a video's captions load. */
  newWordCounts: Record<string, number>;
  onPickVideo: (id: string) => void;
}

export const HomeScreen = ({
  nickname,
  languageLabel,
  onCycleLanguage,
  onSwitchUser,
  onCreateUser,
  onOpenSettings,
  videos,
  watched,
  newWordCounts,
  onPickVideo,
}: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [gearFocused, setGearFocused] = useState(false);
  const [avatarFocused, setAvatarFocused] = useState(false);
  // Focus starts on the next unwatched video, or the first video once all are watched.
  const focusId = (nextVideo(videos, watched) ?? videos[0])?.id;

  return (
    <View style={styles.container}>
      {/* Top left: settings. */}
      <Pressable
        onPress={onOpenSettings}
        onFocus={() => setGearFocused(true)}
        onBlur={() => setGearFocused(false)}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        style={[styles.iconButton, styles.gear, gearFocused && styles.focused]}>
        <Gear size={40} />
      </Pressable>

      {/* Top right: learning-language toggle and user toggle, same height. */}
      <View style={styles.topRight}>
        <FocusButton
          variant="pill"
          label={`${languageLabel} ▾`}
          onPress={onCycleLanguage}
        />
        <Pressable
          onPress={() => setMenuOpen(open => !open)}
          onFocus={() => setAvatarFocused(true)}
          onBlur={() => setAvatarFocused(false)}
          accessibilityRole="button"
          accessibilityLabel={`User ${nickname}`}
          style={[styles.iconButton, styles.avatar, avatarFocused && styles.focused]}>
          <Avatar size={36} />
        </Pressable>
      </View>

      {menuOpen && (
        <View style={styles.menu}>
          <FocusButton
            label="Switch User"
            onPress={() => {
              setMenuOpen(false);
              onSwitchUser();
            }}
            hasTVPreferredFocus
            compact
          />
          <FocusButton
            label="Create New User"
            onPress={() => {
              setMenuOpen(false);
              onCreateUser();
            }}
            compact
          />
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>CaptLearn</Text>
        <Text style={styles.nickname}>Learning as {nickname}. Pick a video.</Text>
        {catalogueRows(videos).map(row => (
          <View key={row.level} style={styles.row}>
            <Text style={styles.rowTitle}>HSK {row.level}</Text>
            <View style={styles.cards}>
              {row.videos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  watched={watched.includes(video.id)}
                  newWordCount={newWordCounts[video.id]}
                  hasTVPreferredFocus={!menuOpen && video.id === focusId}
                  onPress={() => onPickVideo(video.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  // Shared 64px square for the gear and profile controls.
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gear: {
    position: 'absolute',
    top: 40,
    left: 64,
    zIndex: 2,
  },
  avatar: {
    backgroundColor: '#6E70A6',
  },
  focused: {
    borderColor: '#FFFFFF',
  },
  topRight: {
    position: 'absolute',
    top: 40,
    right: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 2,
  },
  menu: {
    position: 'absolute',
    top: 120,
    right: 64,
    backgroundColor: '#6E70A6',
    borderRadius: 12,
    padding: 8,
    zIndex: 2,
  },
  // Content stays inside the 90% safe area (96px and 54px margins on a 1920x1080 screen),
  // with room for a focused card to grow.
  scroll: {flex: 1},
  content: {
    paddingLeft: 112,
    paddingRight: 112,
    paddingTop: 112,
    paddingBottom: 70,
  },
  title: {color: '#FFFFFF', fontSize: 48, fontWeight: '600'},
  nickname: {color: '#AAAAAA', fontSize: 24, marginBottom: 8},
  row: {marginTop: 12},
  rowTitle: {color: '#FFFFFF', fontSize: 28, fontWeight: '600', marginBottom: 12},
  cards: {flexDirection: 'row', gap: 40},
});
