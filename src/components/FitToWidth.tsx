import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';

/** Extra room, since the width is estimated from characters rather than measured. */
const SAFETY = 1.1;

/**
 * Shrinks a single-line row to fit the box it sits in, so long lines stay whole.
 * `naturalWidth` is the estimated width of the row at full size.
 */
export const FitToWidth = ({
  naturalWidth,
  children,
}: {
  naturalWidth: number;
  children: React.ReactNode;
}) => {
  const [boxWidth, setBoxWidth] = useState(0);
  const needed = naturalWidth * SAFETY;
  const scale = boxWidth > 0 && needed > boxWidth ? boxWidth / needed : 1;
  return (
    <View style={styles.box} onLayout={e => setBoxWidth(e.nativeEvent.layout.width)}>
      <View style={[styles.content, {transform: [{scale}]}]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
});
