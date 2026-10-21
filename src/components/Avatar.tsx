import React from 'react';
import {StyleSheet, View} from 'react-native';

/** Simple person icon drawn with views, so no icon font is needed. */
export const Avatar = ({size = 160}: {size?: number}) => (
  <View
    style={[
      styles.box,
      {width: size, height: size, borderRadius: size * 0.12},
    ]}>
    <View
      style={{
        width: size * 0.25,
        height: size * 0.25,
        borderRadius: size * 0.125,
        backgroundColor: '#FFFFFF',
      }}
    />
    <View
      style={{
        width: size * 0.55,
        height: size * 0.28,
        marginTop: size * 0.06,
        borderTopLeftRadius: size * 0.3,
        borderTopRightRadius: size * 0.3,
        backgroundColor: '#FFFFFF',
      }}
    />
  </View>
);

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6E70A6',
  },
});
