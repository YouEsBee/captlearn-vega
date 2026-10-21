import React, {useEffect, useMemo} from 'react';
import {BackHandler, StyleSheet, Text, View} from 'react-native';
import {FocusButton} from '../components/FocusButton';
import {MasteryMap} from '../learning/mastery';
import {QuizAnswer, lessonSummary} from '../learning/summary';
import {LexiconEntry} from '../learning/types';

interface Props {
  /** The quiz's answers; empty when the quiz was skipped or had nothing to ask. */
  answers: QuizAnswer[];
  /** The lexicon words spoken in the video. */
  coveredIds: string[];
  lexicon: LexiconEntry[];
  mastery: MasteryMap;
  /** Title of the next unwatched video; undefined once every video is watched. */
  nextTitle?: string;
  onWatchNext: () => void;
  onRestart: () => void;
  /** Also what the remote's Back does here. */
  onHome: () => void;
}

/** Shown after the video: what the quiz changed, and how many of the video's words are still glossed. */
export const SummaryScreen = ({
  answers,
  coveredIds,
  lexicon,
  mastery,
  nextTitle,
  onWatchNext,
  onRestart,
  onHome,
}: Props) => {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onHome();
      return true;
    });
    return () => sub.remove();
  }, [onHome]);

  const summary = useMemo(
    () => lessonSummary(answers, coveredIds, mastery),
    [answers, coveredIds, mastery],
  );
  const byId = useMemo(() => new Map(lexicon.map(e => [e.id, e])), [lexicon]);
  const groups = [
    {title: 'Newly learnt', ids: summary.newlyLearnt, style: styles.learnt},
    {title: 'Reviewed and kept', ids: summary.kept, style: styles.kept},
    {title: 'Lapsed', ids: summary.lapsed, style: styles.lapsed},
  ].filter(g => g.ids.length > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lesson summary</Text>
      {groups.length === 0 ? (
        <Text style={styles.text}>No quiz answers this time.</Text>
      ) : null}
      {groups.map(g => (
        <View key={g.title} style={styles.group}>
          <Text style={[styles.heading, g.style]}>
            {g.title} ({g.ids.length})
          </Text>
          <Text style={styles.row}>
            {g.ids
              .map(id => byId.get(id))
              .filter((e): e is LexiconEntry => !!e)
              .map(e => `${e.word} ${e.pinyin ?? ''} ${e.gloss}`.replace(/\s+/g, ' '))
              .join('   ·   ')}
          </Text>
        </View>
      ))}
      <Text style={styles.text}>
        {summary.stillGlossed === 1
          ? '1 word in this video is still glossed.'
          : `${summary.stillGlossed} words in this video are still glossed.`}
      </Text>
      <View style={styles.buttons}>
        {nextTitle ? (
          <FocusButton
            label={`Watch next: ${nextTitle}`}
            onPress={onWatchNext}
            hasTVPreferredFocus
            compact
          />
        ) : null}
        <FocusButton
          label="Restart lesson"
          onPress={onRestart}
          hasTVPreferredFocus={!nextTitle}
          compact
        />
        <FocusButton label="Home" onPress={onHome} compact />
      </View>
    </View>
  );
};

// Padding keeps content inside the TV's safe area at top and bottom.
const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', paddingHorizontal: 64, paddingVertical: 48},
  title: {color: '#FFFFFF', fontSize: 44, fontWeight: '600', marginBottom: 8},
  text: {color: '#FFFFFF', fontSize: 24, marginVertical: 4},
  group: {marginVertical: 6},
  heading: {fontSize: 26, fontWeight: '600'},
  learnt: {color: '#9FE8A0'},
  kept: {color: '#FFD966'},
  lapsed: {color: '#FFB3B3'},
  row: {color: '#FFFFFF', fontSize: 22, marginTop: 2},
  buttons: {flexDirection: 'row', gap: 24, marginTop: 16},
});
