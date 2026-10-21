import React, {ReactNode, useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FocusButton} from '../components/FocusButton';
import {MasteryMap, answerOutcome, recordAnswer} from '../learning/mastery';
import {buildQuiz} from '../learning/quiz';
import {QuizAnswer} from '../learning/summary';
import {Cue, LexiconEntry, Lang} from '../learning/types';

interface Props {
  lexicon: LexiconEntry[];
  /** Caption cues for the video; null while they are still loading. */
  cues: Cue[] | null;
  mastery: MasteryMap;
  targetLang: Lang;
  onMasteryChange: (next: MasteryMap) => void;
  /** Called when the learner moves on to the video, with the answers given so far. */
  onDone: (answers: QuizAnswer[]) => void;
  onExit: () => void;
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
  // The quiz is picked from progress as it was when the quiz opened, so answering doesn't reshuffle it.
  const [opening] = useState(() => ({mastery, now: Date.now()}));
  const questions = useMemo(
    () =>
      cues
        ? buildQuiz({lexicon, cues, targetLang, mastery: opening.mastery, now: opening.now})
        : [],
    [lexicon, cues, targetLang, opening],
  );
  const [asked, setAsked] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [current, setCurrent] = useState<MasteryMap>(mastery);

  // Nothing to quiz: go straight to the video.
  const nothingToQuiz = !!cues && questions.length === 0;
  useEffect(() => {
    if (nothingToQuiz) {
      onDone([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nothingToQuiz]);

  // Skipping leaves the remaining words untouched; answers already given still count.
  const skip = () => onDone(answers);

  // Back sits above the content on every quiz screen, as text with no border.
  const Frame = ({children, canSkip}: {children: ReactNode; canSkip?: boolean}) => (
    <View style={styles.container}>
      <View style={styles.header}>
        <FocusButton label="‹ Exit Quiz" onPress={onExit} variant="text" />
        {canSkip ? <FocusButton label="Skip Quiz" onPress={skip} variant="text" /> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );

  if (!cues || nothingToQuiz) {
    return (
      <Frame>
        <Text style={styles.text}>Loading the lesson...</Text>
      </Frame>
    );
  }

  if (asked >= questions.length) {
    return (
      <Frame>
        <View style={styles.question}>
          <Text style={styles.word}>Quiz done</Text>
          <Text style={styles.text}>
            {correct} of {questions.length} correct.
          </Text>
          <Text style={styles.text}>
            Learnt words will be blanked in the video's English line.
          </Text>
        </View>
        <FocusButton
          label="Watch video"
          onPress={() => onDone(answers)}
          hasTVPreferredFocus
          compact
        />
      </Frame>
    );
  }

  const question = questions[asked];
  const isLast = asked + 1 >= questions.length;

  const answer = (choice: string) => {
    const id = question.entry.id;
    const isRight = choice === question.entry.gloss;
    const outcome = answerOutcome(current, id, isRight);
    const next = recordAnswer(current, id, isRight, Date.now());
    setCurrent(next);
    onMasteryChange(next);
    setAnswers(prev => [...prev, {wordId: id, outcome}]);
    if (isRight) {
      setCorrect(c => c + 1);
    }
    setResult({
      isRight,
      headline: isRight ? 'Correct!' : 'Not quite.',
      answer: `The answer is "${question.entry.gloss}".`,
    });
  };

  // Moves on only when the learner presses Next, after reading the feedback.
  const nextQuestion = () => {
    setResult(null);
    setAsked(a => a + 1);
  };

  return (
    <Frame canSkip>
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
          question.choices.map((choice, i) => (
            <FocusButton
              key={`${question.entry.id}-${asked}-${i}`}
              label={choice}
              onPress={() => answer(choice)}
              hasTVPreferredFocus={i === 0}
              compact
            />
          ))
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
      </View>
    </Frame>
  );
};

// Padding keeps content inside the TV's safe area at top and bottom.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 64,
    paddingVertical: 48,
  },
  header: {flexDirection: 'row', justifyContent: 'space-between'},
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
