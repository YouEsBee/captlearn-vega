import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

interface Props {
  /** What is being waited for, shown under the spinner. */
  label?: string;
}

/** Shown on any wait, so the app never looks stuck. */
export const Spinner = ({label}: Props) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#FFFFFF" />
    {label ? <Text style={styles.label}>{label}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16},
  label: {color: '#FFFFFF', fontSize: 24},
});
