import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Avatar} from '../components/Avatar';
import {User} from '../users/userStore';

interface Props {
  users: User[];
  onSelect: (id: string) => void;
  onCreate: () => void;
}

/** Shown on every launch: pick a local user, or create a new one. */
export const ChooseUserScreen = ({users, onSelect, onCreate}: Props) => (
  <View style={styles.container}>
    <Text style={styles.title}>Which CaptLearner is learning today?</Text>
    <View style={styles.row}>
      {users.map((user, i) => (
        <UserTile
          key={user.id}
          label={user.nickname}
          preferred={i === 0}
          onPress={() => onSelect(user.id)}>
          <Avatar size={200} />
        </UserTile>
      ))}
      <UserTile label="Create new user" preferred={users.length === 0} onPress={onCreate}>
        <View style={styles.plusBox}>
          <Text style={styles.plus}>+</Text>
        </View>
      </UserTile>
    </View>
  </View>
);

export const UserTile = ({
  label,
  onPress,
  preferred,
  children,
}: {
  label: string;
  onPress: () => void;
  preferred: boolean;
  children: React.ReactNode;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={preferred}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.tile, focused && styles.tileFocused]}>
      {children}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 64,
    paddingVertical: 48,
  },
  title: {color: '#FFFFFF', fontSize: 48, fontWeight: '600', textAlign: 'center'},
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 48,
    gap: 48,
  },
  tile: {alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 3, borderColor: 'transparent'},
  tileFocused: {borderColor: '#FFFFFF'},
  label: {color: '#FFFFFF', fontSize: 28, marginTop: 16},
  plusBox: {
    width: 200,
    height: 200,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#6E70A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {color: '#FFFFFF', fontSize: 96, fontWeight: '300'},
});
