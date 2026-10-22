import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NativeSegment, Segment} from '../learning/types';

interface Props {
  /** English line, shown on top. Learnt words are underscores with their Chinese beneath. */
  nativeSegments: NativeSegment[];
  /** Target-language line: pinyin under each word, and glosses while a word is not yet learnt. */
  targetSegments: Segment[];
}

/** Turns the English segments into one column per word; learnt words keep their Chinese. */
function nativeColumns(segments: NativeSegment[]): {top: string; zh?: string}[] {
  return segments.flatMap(seg =>
    seg.zh
      ? [{top: '_'.repeat(seg.text.length), zh: seg.zh}]
      : seg.text
          .split(/\s+/)
          .filter(Boolean)
          .map(word => ({top: word})),
  );
}

/** Bilingual caption: native translation on top, target language below with pinyin under each word. */
export const CaptionOverlay = ({nativeSegments, targetSegments}: Props) => (
  <View style={styles.container} pointerEvents="none">
    {nativeSegments.length > 0 ? (
      <View style={styles.nativeLine}>
        {/* Each English word is its own column: the English (or underscores) on the top line,
            and the Chinese for a learnt word directly beneath it on the next line. */}
        {nativeColumns(nativeSegments).map((col, i) => (
          <View key={i} style={styles.nativeWord}>
            <Text style={col.zh ? styles.nativeBlank : styles.native}>{col.top}</Text>
            <Text style={styles.nativeZh}>{col.zh ?? '\u00A0'}</Text>
          </View>
        ))}
      </View>
    ) : null}
    <View style={styles.target}>
      {targetSegments.map((seg, i) => {
        return (
          <View key={i} style={styles.word}>
            <Text style={[styles.chars, seg.gloss ? styles.glossed : null]}>{seg.text}</Text>
            {seg.pinyin ? <Text style={styles.pinyin}>{seg.pinyin}</Text> : null}
            {seg.gloss ? <Text style={styles.gloss}>{seg.gloss}</Text> : null}
          </View>
        );
      })}
    </View>
  </View>
);

// The box is anchored to the bottom and grows upward, so it never clips its own lines.
// Tight line heights keep the stacked lines compact.
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 64,
    right: 64,
    bottom: 48,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  // English line, with learnt words as underscores.
  nativeLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nativeWord: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  native: {
    color: '#DDDDDD',
    fontSize: 22,
    lineHeight: 28,
  },
  nativeBlank: {
    color: '#DDDDDD',
    fontSize: 22,
    lineHeight: 28,
  },
  nativeZh: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
  },
  // Chinese line: each word is a column, with pinyin under it.
  target: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  word: {
    alignItems: 'center',
    marginHorizontal: 3,
  },
  chars: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
  },
  glossed: {
    textDecorationLine: 'underline',
  },
  pinyin: {
    color: '#FFD966',
    fontSize: 17,
    lineHeight: 21,
  },
  gloss: {
    color: '#DDDDDD',
    fontSize: 16,
    lineHeight: 20,
  },
});
