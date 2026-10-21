import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FocusButton} from '../components/FocusButton';
import {CREDITS} from '../data/credits';

interface Props {
  onBack: () => void;
}

/** The sources the app's videos and words come from, credited as their terms ask. */
export const CreditsScreen = ({onBack}: Props) => (
  <View style={styles.container}>
    <FocusButton label="‹ Back" onPress={onBack} variant="text" hasTVPreferredFocus />
    <View style={styles.body}>
      <Text style={styles.title}>Credits</Text>
      {CREDITS.map(c => (
        <View key={c.source} style={styles.entry}>
          <Text style={styles.source}>{c.source}</Text>
          <Text style={styles.detail}>{c.detail}</Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, paddingHorizontal: 96, paddingVertical: 54},
  body: {flex: 1, justifyContent: 'center', alignItems: 'flex-start'},
  title: {color: '#FFFFFF', fontSize: 56, fontWeight: '600', marginBottom: 24},
  entry: {marginBottom: 20},
  source: {color: '#FFFFFF', fontSize: 30, fontWeight: '600'},
  detail: {color: '#CCCCCC', fontSize: 24, marginTop: 4},
});
