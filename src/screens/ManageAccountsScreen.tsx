import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Avatar} from '../components/Avatar';
import {FocusButton} from '../components/FocusButton';
import {UserTile} from './ChooseUserScreen';
import {User} from '../users/userStore';

interface Props {
  users: User[];
  onSelect: (id: string) => void;
  onBack: () => void;
}

/** Lists accounts so the learner can pick one to delete. */
export const ManageAccountsScreen = ({users, onSelect, onBack}: Props) => (
  <View style={styles.container}>
    <FocusButton label="‹ Back" onPress={onBack} variant="text" />
    <View style={styles.body}>
      <Text style={styles.title}>Choose an account to delete</Text>
      <View style={styles.row}>
        {users.map((user, i) => (
          <UserTile
            key={user.id}
            label={user.nickname}
            preferred={i === 0}
            onPress={() => onSelect(user.id)}>
            <Avatar size={160} />
          </UserTile>
        ))}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, paddingHorizontal: 64, paddingVertical: 48},
  body: {flex: 1, justifyContent: 'center'},
  title: {color: '#FFFFFF', fontSize: 40, fontWeight: '600', marginBottom: 32},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 32},
});
