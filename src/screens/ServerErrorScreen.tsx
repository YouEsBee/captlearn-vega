import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FocusButton} from '../components/FocusButton';
import {BACKEND_URL} from '../config';

interface Props {
  onRetry: () => void;
}

/** Shown when the app can't reach its backend, which holds the catalogue and every video. */
export const ServerErrorScreen = ({onRetry}: Props) => (
  <View style={styles.container}>
    <Text style={styles.title}>Can't reach CaptLearn</Text>
    <Text style={styles.text}>
      {BACKEND_URL
        ? `Check that this TV is online and that the CaptLearn server at ${BACKEND_URL} is running.`
        : 'This build has no server address. Set BACKEND_URL and build the app again.'}
    </Text>
    <FocusButton label="Try again" onPress={onRetry} hasTVPreferredFocus />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 96,
    paddingVertical: 54,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {color: '#FFFFFF', fontSize: 56, fontWeight: '600', marginBottom: 16},
  text: {color: '#CCCCCC', fontSize: 28, marginBottom: 32, maxWidth: 1200},
});
