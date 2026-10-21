import React from 'react';
import {View} from 'react-native';

/** Settings gear drawn with views (a ring and eight teeth), so no icon font or SVG is needed. */
export const Gear = ({size = 56, color = '#FFFFFF'}: {size?: number; color?: string}) => (
  <View style={{width: size, height: size}}>
    {Array.from({length: 8}, (_, i) => (
      <View
        key={i}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          transform: [{rotate: `${i * 45}deg`}],
        }}>
        <View
          style={{
            position: 'absolute',
            left: size / 2 - size * 0.07,
            top: 0,
            width: size * 0.14,
            height: size * 0.2,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
      </View>
    ))}
    <View
      style={{
        position: 'absolute',
        left: size * 0.2,
        top: size * 0.2,
        width: size * 0.6,
        height: size * 0.6,
        borderRadius: size * 0.3,
        borderWidth: size * 0.09,
        borderColor: color,
      }}
    />
  </View>
);
