import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {FocusButton} from '../components/FocusButton';
import {User} from '../users/userStore';

interface Props {
  user: User;
  /** True when this is the only account. Deleting it sends the learner to onboarding. */
  isLastUser: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Second step of deleting an account. Cancel is focused first so a misclick does nothing. */
export const DeleteAccountScreen = ({user, isLastUser, onCancel, onConfirm}: Props) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      <FocusButton label="‹ Back" onPress={onCancel} variant="text" />
      <View style={styles.body}>
        <Text style={styles.title}>Delete {user.nickname}?</Text>
        <Text style={styles.text}>All of their progress will be removed.</Text>
        {isLastUser ? (
          <Text style={styles.text}>
            This is the only account. You'll create a new one after deleting it.
          </Text>
        ) : null}
        <View style={styles.buttons}>
          <FocusButton label="Cancel" onPress={onCancel} hasTVPreferredFocus compact />
          <Pressable
            onPress={onConfirm}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            style={[styles.danger, focused && styles.dangerFocused]}>
            <Text style={styles.dangerLabel}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, paddingHorizontal: 64, paddingVertical: 48},
  body: {flex: 1, justifyContent: 'center', alignItems: 'flex-start', maxWidth: 900},
  title: {color: '#FFFFFF', fontSize: 48, fontWeight: '600', marginBottom: 16},
  text: {color: '#FFFFFF', fontSize: 26, marginVertical: 6},
  buttons: {flexDirection: 'row', alignItems: 'center', gap: 48, marginTop: 32},
  danger: {
    paddingHorizontal: 40,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: '#8A2E3A',
  },
  dangerFocused: {borderColor: '#FFFFFF'},
  dangerLabel: {color: '#FFFFFF', fontSize: 28},
});
