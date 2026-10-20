import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FocusButton} from '../components/FocusButton';
import {MasteryMap, markLearnt, recordAnswer} from '../learning/mastery';
import {indexLexicon, wordIdsInCues} from '../learning/substitute';
import {Cue, LexiconEntry, Lang} from '../learning/types';

interface Props {
  lexicon: LexiconEntry[];
  /** Caption cues for the video; null while they are still loading. */
  cues: Cue[] | null;
  mastery: MasteryMap;
  targetLang: Lang;
  onMasteryChange: (next: MasteryMap) => void;
  onDone: () => void;
  onExit: () => void;
}

interface Question {
  entry: LexiconEntry;
  choices: string[];
}

/** One question per lexicon word that appears in the video, in the order it is spoken. */
function buildQuestions(
  lexicon: LexiconEntry[],
  cues: Cue[],
  targetLang: Lang,
): Question[] {
  const pool = lexicon.filter(e => e.lang === targetLang);
  const byId = new Map(pool.map(e => [e.id, e]));
  const index = indexLexicon(pool);
  const entries = wordIdsInCues(cues, index, targetLang)
    .map(id => byId.get(id))
    .filter((e): e is LexiconEntry => !!e);
  return entries.map(entry => {
    const distractors = pool
      .filter(e => e.id !== entry.id && e.gloss !== entry.gloss)
      .map(e => e.gloss)
      .slice(0, 3);
    const choices = [entry.gloss, ...distractors].sort(() => Math.random() - 0.5);
    return {entry, choices};
  });
}

/** The result of the current question, shown until the learner presses Next. */
interface Result {
  isRight: boolean;
  headline: string;
  answer: string;
}

export const QuizScreen = ({
  lexicon,
  cues,
  mastery,
  targetLang,
  onMasteryChange,
  onDone,
  onExit,
}: Props) => {
  const questions = useMemo(
    () => (cues ? buildQuestions(lexicon, cues, targetLang) : []),
    [lexicon, cues, targetLang],
  );
  const [asked, setAsked] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [current, setCurrent] = useState<MasteryMap>(mastery);

  if (!cues) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading the lesson...</Text>
        <FocusButton label="Back" onPress={onExit} hasTVPreferredFocus compact />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No lexicon words appear in this video.</Text>
        <FocusButton label="Watch video" onPress={onDone} hasTVPreferredFocus compact />
        <FocusButton label="Back" onPress={onExit} compact />
      </View>
    );
  }

  if (asked >= questions.length) {
    return (
      <View style={styles.container}>
        <View style={styles.question}>
          <Text style={styles.word}>Quiz done</Text>
          <Text style={styles.text}>
            {correct} of {questions.length} correct.
          </Text>
          <Text style={styles.text}>
            Correct words will be blanked in the video's English line.
          </Text>
        </View>
        <View style={styles.choices}>
          <FocusButton label="Watch video" onPress={onDone} hasTVPreferredFocus compact />
          <FocusButton label="Back" onPress={onExit} compact />
        </View>
      </View>
    );
  }

  const question = questions[asked];
  const isLast = asked + 1 >= questions.length;

  const answer = (choice: string) => {
    const isRight = choice === question.entry.gloss;
    // A correct answer means the word is learnt, so its English is blanked in the video.
    const answered = recordAnswer(current, question.entry.id, isRight);
    const next = isRight ? markLearnt(answered, question.entry.id) : answered;
    setCurrent(next);
    onMasteryChange(next);
    if (isRight) {
      setCorrect(c => c + 1);
    }
    setResult({
      isRight,
      headline: isRight ? 'Correct!' : 'Not quite.',
      answer: `The answer is ${question.entry.gloss}.`,
    });
  };

  // Moves on only when the learner presses Next, after reading the feedback.
  const nextQuestion = () => {
    setResult(null);
    setAsked(a => a + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.question}>
        <Text style={styles.small}>
          Question {asked + 1} of {questions.length}
        </Text>
        <Text style={styles.word}>{question.entry.word}</Text>
        {question.entry.pinyin ? (
          <Text style={styles.pinyin}>{question.entry.pinyin}</Text>
        ) : null}
        <Text style={styles.text}>What does it mean?</Text>
      </View>
      <View style={styles.choices}>
        {result === null ? (
          <>
            {question.choices.map((choice, i) => (
              <FocusButton
                key={`${question.entry.id}-${asked}-${i}`}
                label={choice}
                onPress={() => answer(choice)}
                hasTVPreferredFocus={i === 0}
                compact
              />
            ))}
          </>
        ) : (
          <>
            <Text style={result.isRight ? styles.right : styles.wrong}>
              {result.headline}
            </Text>
            <Text style={styles.text}>{result.answer}</Text>
            <FocusButton
              label={isLast ? 'See results' : 'Next question'}
              onPress={nextQuestion}
              hasTVPreferredFocus
              compact
            />
          </>
        )}
        <FocusButton label="Back" onPress={onExit} compact />
      </View>
    </View>
  );
};

// Padding keeps content inside the TV's safe area at top and bottom.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 64,
    paddingVertical: 48,
    gap: 48,
  },
  question: {flex: 1, justifyContent: 'center'},
  choices: {flex: 1, justifyContent: 'center'},
  word: {color: '#FFFFFF', fontSize: 64, fontWeight: '600'},
  pinyin: {color: '#FFD966', fontSize: 28, marginBottom: 12},
  text: {color: '#FFFFFF', fontSize: 24, marginVertical: 6},
  right: {color: '#9FE8A0', fontSize: 32, fontWeight: '600', marginVertical: 8},
  wrong: {color: '#FFB3B3', fontSize: 24, marginVertical: 8},
  small: {color: '#AAAAAA', fontSize: 18, marginBottom: 6},
});
