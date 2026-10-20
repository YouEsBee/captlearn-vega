import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  onStart: () => void;
}

export const HomeScreen = ({onStart}: Props) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>CaptLearn</Text>
        <Text style={styles.subtitle}>Learn a lang? Watch a vid.</Text>

        <Pressable
          onPress={onStart}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          hasTVPreferredFocus
          testID="btn-start"
          accessibilityRole="button"
          accessibilityLabel="Start Lesson"
          style={[styles.button, focused && styles.buttonFocused]}>
          <View style={styles.playIcon} />
          <Text style={styles.buttonLabel}>Start Lesson</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  // Padding keeps the content inside the TV's safe area.
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 120,
    paddingVertical: 48,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 104,
    fontWeight: '600',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 32,
    marginTop: 8,
    marginBottom: 56,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#323766',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  buttonFocused: {
    borderColor: '#FFFFFF',
  },
  // Play triangle drawn with borders, so it needs no icon font.
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 26,
    borderBottomWidth: 26,
    borderLeftWidth: 40,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
    marginRight: 32,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '500',
  },
});
