import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FocusButton} from '../components/FocusButton';
import {MasteryMap, getScore} from '../learning/mastery';
import {LexiconEntry} from '../learning/types';

const MAX_ROWS = 4;

interface Props {
  coveredIds: string[];
  lexicon: LexiconEntry[];
  mastery: MasteryMap;
  glossThreshold: number;
  onRestart: () => void;
  onHome: () => void;
}

/** Shown after the video: the Chinese words it covered, and how many are now learnt. */
export const SummaryScreen = ({
  coveredIds,
  lexicon,
  mastery,
  glossThreshold,
  onRestart,
  onHome,
}: Props) => {
  const words = useMemo(
    () =>
      lexicon
        .filter(e => e.lang === 'zh' && coveredIds.includes(e.id))
        .sort((a, b) => a.level - b.level),
    [lexicon, coveredIds],
  );
  const learnt = words.filter(w => getScore(mastery, w.id) >= glossThreshold).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lesson summary</Text>
      <Text style={styles.text}>
        {words.length} words covered, {learnt} learnt.
      </Text>
      {words.length === 0 ? (
        <Text style={styles.text}>No lexicon words appeared in this video.</Text>
      ) : null}
      {words.slice(0, MAX_ROWS).map(w => (
        <Text key={w.id} style={styles.row}>
          {w.word}  {w.pinyin}  {w.gloss}
        </Text>
      ))}
      {words.length > MAX_ROWS ? (
        <Text style={styles.text}>+ {words.length - MAX_ROWS} more</Text>
      ) : null}
      <View style={styles.buttons}>
        <FocusButton label="Restart lesson" onPress={onRestart} hasTVPreferredFocus compact />
        <FocusButton label="Home" onPress={onHome} compact />
      </View>
    </View>
  );
};

// Padding keeps content inside the TV's safe area at top and bottom.
const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', paddingHorizontal: 64, paddingVertical: 48},
  title: {color: '#FFFFFF', fontSize: 44, fontWeight: '600'},
  text: {color: '#FFFFFF', fontSize: 24, marginVertical: 4},
  row: {color: '#FFD966', fontSize: 24, marginVertical: 2},
  buttons: {flexDirection: 'row', marginTop: 16},
});
