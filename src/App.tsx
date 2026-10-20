import React, {useEffect, useMemo, useState} from 'react';
import {ImageBackground, StyleSheet} from 'react-native';
import {HomeScreen} from './screens/HomeScreen';
import {PlayerScreen} from './screens/PlayerScreen';
import {QuizScreen} from './screens/QuizScreen';
import {SummaryScreen} from './screens/SummaryScreen';
import {loadCaptions} from './captions/captionSource';
import {MasteryMap} from './learning/mastery';
import {Cue, Settings} from './learning/types';
import {sampleLexicon} from './data/sampleLexicon';
import {DEMO_VIDEO_ID} from './config';
import {
  defaultSettings,
  loadMastery,
  loadSettings,
  memoryStore,
  saveMastery,
} from './storage/progress';

// Lesson flow: home -> quiz (covers the video's words) -> video -> summary -> (restart quiz or home).
type Screen = 'home' | 'quiz' | 'player' | 'summary';

export const App = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [coveredIds, setCoveredIds] = useState<string[]>([]);
  // Captions are loaded up front so the quiz can cover the words in the video.
  const [cues, setCues] = useState<Cue[] | null>(null);

  // Storage is in-memory until a persistent backend is added (see storage/progress.ts).
  const store = memoryStore;
  const [settings] = useState<Settings>(() => loadSettings(store));
  const [mastery, setMastery] = useState<MasteryMap>(() => loadMastery(store));

  useEffect(() => {
    loadCaptions(DEMO_VIDEO_ID).then(setCues);
  }, []);

  const updateMastery = (next: MasteryMap) => {
    setMastery(next);
    saveMastery(store, next);
  };

  const lexicon = useMemo(() => sampleLexicon, []);
  const activeSettings = {...defaultSettings, ...settings};

  return (
    <ImageBackground
      source={require('./assets/background.png')}
      style={styles.background}>
      {screen === 'home' && <HomeScreen onStart={() => setScreen('quiz')} />}
      {screen === 'quiz' && (
        <QuizScreen
          lexicon={lexicon}
          cues={cues}
          mastery={mastery}
          targetLang={activeSettings.targetLang}
          onMasteryChange={updateMastery}
          onDone={() => setScreen('player')}
          onExit={() => setScreen('home')}
        />
      )}
      {screen === 'player' && (
        <PlayerScreen
          videoId={DEMO_VIDEO_ID}
          settings={activeSettings}
          lexicon={lexicon}
          mastery={mastery}
          onMasteryChange={updateMastery}
          onFinished={ids => {
            setCoveredIds(ids);
            setScreen('summary');
          }}
          onExit={() => setScreen('home')}
        />
      )}
      {screen === 'summary' && (
        <SummaryScreen
          coveredIds={coveredIds}
          lexicon={lexicon}
          mastery={mastery}
          glossThreshold={activeSettings.glossThreshold}
          onRestart={() => setScreen('quiz')}
          onHome={() => setScreen('home')}
        />
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {flex: 1},
});
