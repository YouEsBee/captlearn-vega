import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FocusButton} from '../components/FocusButton';

interface Props {
  onStart: () => void;
}

export const HomeScreen = ({onStart}: Props) => (
  <View style={styles.container}>
    <Text style={styles.title}>CaptLearn</Text>
    <Text style={styles.subtitle}>Learn Chinese while you watch.</Text>
    <FocusButton
      label="Start lesson"
      onPress={onStart}
      hasTVPreferredFocus
      testID="btn-start"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 64,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '600',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 28,
    marginBottom: 32,
  },
});
