import React, {useEffect, useMemo, useState} from 'react';
import {ImageBackground, StyleSheet} from 'react-native';
import {HomeScreen} from './screens/HomeScreen';
import {PlayerScreen} from './screens/PlayerScreen';
import {QuizScreen} from './screens/QuizScreen';
import {SummaryScreen} from './screens/SummaryScreen';
import {ChooseUserScreen} from './screens/ChooseUserScreen';
import {OnboardingScreen} from './screens/OnboardingScreen';
import {SettingsScreen} from './screens/SettingsScreen';
import {ManageAccountsScreen} from './screens/ManageAccountsScreen';
import {DeleteAccountScreen} from './screens/DeleteAccountScreen';
import {loadCaptions} from './captions/captionSource';
import {MasteryMap} from './learning/mastery';
import {QuizAnswer} from './learning/summary';
import {Cue, Lang, Settings} from './learning/types';
import {sampleLexicon} from './data/sampleLexicon';
import {LANGUAGES, languageLabel} from './data/languages';
import {DEMO_VIDEO_ID} from './config';
import {defaultSettings} from './storage/progress';
import {AppState, User, loadState, saveState} from './users/userStore';

// Launch: no users -> onboarding; otherwise -> choose user.
// Then: home -> quiz (new and due words; skipped when empty) -> video -> summary -> (restart quiz or home).
type Screen =
  | 'loading'
  | 'onboarding'
  | 'choose'
  | 'home'
  | 'settings'
  | 'manageAccounts'
  | 'confirmDelete'
  | 'quiz'
  | 'player'
  | 'summary';

export const App = () => {
  const [screen, setScreen] = useState<Screen>('loading');
  const [state, setState] = useState<AppState>({users: [], currentUserId: null});
  const [coveredIds, setCoveredIds] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Captions are loaded up front so the quiz can cover the words in the video.
  const [cues, setCues] = useState<Cue[] | null>(null);

  useEffect(() => {
    loadState().then(loaded => {
      setState(loaded);
      setScreen(loaded.users.length === 0 ? 'onboarding' : 'choose');
    });
    loadCaptions(DEMO_VIDEO_ID).then(setCues);
  }, []);

  // Functional updates, so rapid mastery changes never overwrite each other.
  const update = (change: (prev: AppState) => AppState) =>
    setState(prev => {
      const next = change(prev);
      saveState(next);
      return next;
    });

  const user: User | undefined = state.users.find(u => u.id === state.currentUserId);
  const lexicon = useMemo(() => sampleLexicon, []);
  const targetLang: Lang = user?.targetLang ?? 'zh';
  const settings: Settings = {...defaultSettings, targetLang};
  const mastery: MasteryMap = user?.mastery ?? {};

  // Removes an account and its progress. Routes to the screen that makes sense next.
  const deleteAccount = (id: string) => {
    const keepCurrent = state.currentUserId !== id;
    const remaining = state.users.filter(u => u.id !== id).length;
    update(prev => ({
      users: prev.users.filter(u => u.id !== id),
      currentUserId: prev.currentUserId === id ? null : prev.currentUserId,
    }));
    setDeleteId(null);
    if (remaining === 0) {
      setScreen('onboarding');
    } else if (keepCurrent) {
      setScreen('manageAccounts');
    } else {
      setScreen('choose');
    }
  };

  const deleteTarget = state.users.find(u => u.id === deleteId);

  const updateCurrentUser = (patch: Partial<User>) =>
    update(prev => ({
      ...prev,
      users: prev.users.map(u => (u.id === prev.currentUserId ? {...u, ...patch} : u)),
    }));

  const selectUser = (id: string) => {
    update(prev => ({...prev, currentUserId: id}));
    setScreen('home');
  };

  const createUser = (nickname: string, lang: Lang) => {
    const id = `user-${Date.now()}`;
    const created: User = {id, nickname, targetLang: lang, mastery: {}};
    update(prev => ({...prev, users: [...prev.users, created], currentUserId: id}));
    setScreen('home');
  };

  // Cycles through the languages that have vocabulary.
  const cycleLanguage = () => {
    const available = LANGUAGES.filter(l => l.available);
    const at = available.findIndex(l => l.code === targetLang);
    updateCurrentUser({targetLang: available[(at + 1) % available.length].code});
  };

  return (
    <ImageBackground
      source={require('./assets/background.png')}
      style={styles.background}>
      {screen === 'onboarding' && (
        <OnboardingScreen
          canExit={state.users.length > 0}
          onExit={() => setScreen(state.users.length > 0 ? 'choose' : 'onboarding')}
          onComplete={createUser}
        />
      )}
      {screen === 'choose' && (
        <ChooseUserScreen
          users={state.users}
          onSelect={selectUser}
          onCreate={() => setScreen('onboarding')}
        />
      )}
      {screen === 'home' && (
        <HomeScreen
          nickname={user?.nickname ?? ''}
          languageLabel={languageLabel(targetLang)}
          onCycleLanguage={cycleLanguage}
          onSwitchUser={() => setScreen('choose')}
          onCreateUser={() => setScreen('onboarding')}
          onOpenSettings={() => setScreen('settings')}
          onStart={() => setScreen('quiz')}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          onManageAccounts={() => setScreen('manageAccounts')}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'manageAccounts' && (
        <ManageAccountsScreen
          users={state.users}
          onSelect={id => {
            setDeleteId(id);
            setScreen('confirmDelete');
          }}
          onBack={() => setScreen('settings')}
        />
      )}
      {screen === 'confirmDelete' && deleteTarget && (
        <DeleteAccountScreen
          user={deleteTarget}
          isLastUser={state.users.length === 1}
          onCancel={() => setScreen('manageAccounts')}
          onConfirm={() => deleteAccount(deleteTarget.id)}
        />
      )}
      {screen === 'quiz' && (
        <QuizScreen
          lexicon={lexicon}
          cues={cues}
          mastery={mastery}
          targetLang={targetLang}
          onMasteryChange={next => updateCurrentUser({mastery: next})}
          onDone={answers => {
            setQuizAnswers(answers);
            setScreen('player');
          }}
          onExit={() => setScreen('home')}
        />
      )}
      {screen === 'player' && (
        <PlayerScreen
          videoId={DEMO_VIDEO_ID}
          settings={settings}
          lexicon={lexicon}
          mastery={mastery}
          onFinished={ids => {
            setCoveredIds(ids);
            setScreen('summary');
          }}
          onExit={() => setScreen('home')}
        />
      )}
      {screen === 'summary' && (
        <SummaryScreen
          answers={quizAnswers}
          coveredIds={coveredIds}
          lexicon={lexicon}
          mastery={mastery}
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
