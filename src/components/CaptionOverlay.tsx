import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NativeSegment, Segment} from '../learning/types';
import {FitToWidth} from './FitToWidth';

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

const CJK = /[\u3000-\u9fff\uff00-\uffef]/;

/** Rough rendered width of a string: a CJK character is about one em, a Latin one about half. */
function estimateWidth(text: string, size: number): number {
  let width = 0;
  for (const ch of text) {
    width += CJK.test(ch) ? size * 1.05 : size * 0.55;
  }
  return width;
}

/** Estimated width of the English line at its font sizes (30px English, 22px Chinese). */
function nativeLineWidth(segments: NativeSegment[]): number {
  return nativeColumns(segments).reduce(
    (sum, col) =>
      sum + Math.max(estimateWidth(col.top, 30), col.zh ? estimateWidth(col.zh, 22) : 0) + 8,
    0,
  );
}

/** Estimated width of the Chinese line at its font sizes (40px characters, 24px pinyin, 20px gloss). */
function targetLineWidth(segments: Segment[]): number {
  return segments.reduce(
    (sum, seg) =>
      sum +
      Math.max(
        estimateWidth(seg.text, 40),
        seg.pinyin ? estimateWidth(seg.pinyin, 24) : 0,
        seg.gloss ? estimateWidth(seg.gloss, 20) : 0,
      ) +
      6,
    0,
  );
}

/** Bilingual caption: native translation on top, target language below with pinyin under each word. */
export const CaptionOverlay = ({nativeSegments, targetSegments}: Props) => (
  <View style={styles.container} pointerEvents="none">
    {nativeSegments.length > 0 ? (
      <FitToWidth naturalWidth={nativeLineWidth(nativeSegments)}>
      <View style={styles.nativeLine}>
        {/* Each English word is its own column: the English (or underscores) on the top line,
            and the Chinese for a learnt word directly beneath it on the next line. */}
        {nativeColumns(nativeSegments).map((col, i) => (
          <View key={i} style={styles.nativeWord}>
            <Text numberOfLines={1} style={col.zh ? styles.nativeBlank : styles.native}>{col.top}</Text>
            <Text numberOfLines={1} style={styles.nativeZh}>{col.zh ?? '\u00A0'}</Text>
          </View>
        ))}
      </View>
      </FitToWidth>
    ) : null}
    <FitToWidth naturalWidth={targetLineWidth(targetSegments)}>
    <View style={styles.target}>
      {targetSegments.map((seg, i) => {
        return (
          <View key={i} style={styles.word}>
            <Text numberOfLines={1} style={[styles.chars, seg.gloss ? styles.glossed : null]}>{seg.text}</Text>
            {seg.pinyin ? <Text numberOfLines={1} style={styles.pinyin}>{seg.pinyin}</Text> : null}
            {seg.gloss ? <Text numberOfLines={1} style={styles.gloss}>{seg.gloss}</Text> : null}
          </View>
        );
      })}
    </View>
    </FitToWidth>
  </View>
);

// The box is anchored to the bottom and grows upward, so it never clips its own lines.
// Tight line heights keep the stacked lines compact.
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 64,
    right: 64,
    bottom: 110,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  // English line, with learnt words as underscores.
  nativeLine: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nativeWord: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  native: {
    color: '#DDDDDD',
    fontSize: 30,
    lineHeight: 36,
  },
  nativeBlank: {
    color: '#DDDDDD',
    fontSize: 30,
    lineHeight: 36,
  },
  nativeZh: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 27,
  },
  // Chinese line: each word is a column, with pinyin under it.
  target: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
  },
  word: {
    alignItems: 'center',
    marginHorizontal: 3,
  },
  chars: {
    color: '#FFFFFF',
    fontSize: 40,
    lineHeight: 50,
  },
  glossed: {
    textDecorationLine: 'underline',
  },
  pinyin: {
    color: '#FFD966',
    fontSize: 24,
    lineHeight: 28,
  },
  gloss: {
    color: '#DDDDDD',
    fontSize: 20,
    lineHeight: 24,
  },
});
