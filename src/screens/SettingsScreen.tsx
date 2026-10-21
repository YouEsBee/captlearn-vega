import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FocusButton} from '../components/FocusButton';

interface Props {
  onManageAccounts: () => void;
  onBack: () => void;
}

export const SettingsScreen = ({onManageAccounts, onBack}: Props) => (
  <View style={styles.container}>
    <FocusButton label="‹ Back" onPress={onBack} variant="text" />
    <View style={styles.body}>
      <Text style={styles.title}>Settings</Text>
      <FocusButton label="Manage Accounts" onPress={onManageAccounts} hasTVPreferredFocus compact />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, paddingHorizontal: 64, paddingVertical: 48},
  body: {flex: 1, justifyContent: 'center', alignItems: 'flex-start'},
  title: {color: '#FFFFFF', fontSize: 56, fontWeight: '600', marginBottom: 24},
});
