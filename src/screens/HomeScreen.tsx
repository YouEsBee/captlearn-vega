import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Avatar} from '../components/Avatar';
import {FocusButton} from '../components/FocusButton';
import {Gear} from '../components/Gear';

interface Props {
  nickname: string;
  languageLabel: string;
  onCycleLanguage: () => void;
  onSwitchUser: () => void;
  onCreateUser: () => void;
  onOpenSettings: () => void;
  onStart: () => void;
}

export const HomeScreen = ({
  nickname,
  languageLabel,
  onCycleLanguage,
  onSwitchUser,
  onCreateUser,
  onOpenSettings,
  onStart,
}: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [gearFocused, setGearFocused] = useState(false);
  const [avatarFocused, setAvatarFocused] = useState(false);
  const [startFocused, setStartFocused] = useState(false);

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

      <View style={styles.content}>
        <Text style={styles.title}>CaptLearn</Text>
        <Text style={styles.subtitle}>Learn a lang? Watch a vid.</Text>
        <Text style={styles.nickname}>Learning as {nickname}</Text>
        <Pressable
          onPress={onStart}
          onFocus={() => setStartFocused(true)}
          onBlur={() => setStartFocused(false)}
          hasTVPreferredFocus={!menuOpen}
          testID="btn-start"
          accessibilityRole="button"
          accessibilityLabel="Start Lesson"
          style={[styles.start, startFocused && styles.focused]}>
          <View style={styles.playIcon} />
          <Text style={styles.startLabel}>Start Lesson</Text>
        </Pressable>
      </View>
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
  // Padding pushes the title down from the top row, as in the Figma layout.
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 120,
    paddingRight: 120,
    paddingTop: 120,
    paddingBottom: 48,
  },
  title: {color: '#FFFFFF', fontSize: 104, fontWeight: '600'},
  subtitle: {color: '#FFFFFF', fontSize: 32, marginTop: 8, marginBottom: 24},
  nickname: {color: '#AAAAAA', fontSize: 24, marginBottom: 40},
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#323766',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    paddingVertical: 20,
    paddingHorizontal: 36,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 24,
    borderBottomWidth: 24,
    borderLeftWidth: 36,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
    marginRight: 28,
  },
  startLabel: {color: '#FFFFFF', fontSize: 34, fontWeight: '500'},
});
