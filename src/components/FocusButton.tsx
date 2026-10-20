import React, {useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
  testID?: string;
  /** Smaller padding, for screens with many buttons. */
  compact?: boolean;
}

/** Button that shows a clear focus ring, since the D-pad is the only input. */
export const FocusButton = ({
  label,
  onPress,
  hasTVPreferredFocus,
  testID,
  compact,
}: Props) => {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, compact && styles.compact, focused && styles.focused]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 8,
  },
  compact: {
    paddingVertical: 8,
    marginVertical: 4,
  },
  focused: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 28,
  },
});
