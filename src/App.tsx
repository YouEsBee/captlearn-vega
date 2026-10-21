import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import {CreditsScreen} from './screens/CreditsScreen';
import {ServerErrorScreen} from './screens/ServerErrorScreen';
import {Spinner} from './components/Spinner';
import {loadCaptions} from './captions/captionSource';
import {newWordCount, nextVideo} from './catalogue/catalogue';
import {loadCatalogue, thumbnailUrl} from './catalogue/catalogueSource';
import {Video} from './catalogue/types';
import {MasteryMap} from './learning/mastery';
import {indexLexicon, wordIdsInCues} from './learning/substitute';
import {QuizAnswer} from './learning/summary';
import {Cue, Lang, LexiconEntry, Settings} from './learning/types';
import {mergeLexicons} from './lexicon/lexicon';
import {loadLexicon} from './lexicon/lexiconSource';
import {LANGUAGES, languageLabel} from './data/languages';
import {defaultSettings} from './storage/progress';
import {AppState, User, loadState, saveState} from './users/userStore';

// Launch: no users -> onboarding; otherwise -> choose user.
// Then: home (pick a video) -> quiz (new and due words; skipped when empty) -> video
// -> summary -> (quiz for the next unwatched video, or home).
type Screen =
  | 'loading'
  | 'onboarding'
  | 'choose'
  | 'home'
  | 'settings'
  | 'credits'
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
  // The video picked on the home screen, or by "Watch next".
  const [videoId, setVideoId] = useState<string>('');
  // The catalogue from the backend; empty until it loads.
  const [videos, setVideos] = useState<Video[]>([]);
  const [backendDown, setBackendDown] = useState(false);
  // Every catalogue video's captions and lexicon are loaded up front: the quiz covers the words
  // in the video, and each home screen card counts its new words.
  const [cuesByVideo, setCuesByVideo] = useState<Record<string, Cue[]>>({});
  const [lexiconByVideo, setLexiconByVideo] = useState<Record<string, LexiconEntry[]>>({});

  // The catalogue, then each video's captions and lexicon: all static files on the backend.
  // A video's captions and lexicon are set together, so the quiz never opens on captions
  // without their words.
  const loadVideos = useCallback(() => {
    setBackendDown(false);
    loadCatalogue()
      .then(list => {
        setVideos(list);
        list.forEach(v =>
          Promise.all([loadCaptions(v.id), loadLexicon(v.id)]).then(([cues, entries]) => {
            setCuesByVideo(prev => ({...prev, [v.id]: cues}));
            setLexiconByVideo(prev => ({...prev, [v.id]: entries}));
          }),
        );
      })
      .catch(err => {
        console.warn('[catalogue] cannot load:', err);
        setBackendDown(true);
      });
  }, []);

  useEffect(() => {
    loadState().then(loaded => {
      setState(loaded);
      setScreen(loaded.users.length === 0 ? 'onboarding' : 'choose');
    });
    loadVideos();
  }, [loadVideos]);

  // Functional updates, so rapid mastery changes never overwrite each other.
  const update = (change: (prev: AppState) => AppState) =>
    setState(prev => {
      const next = change(prev);
      saveState(next);
      return next;
    });

  const user: User | undefined = state.users.find(u => u.id === state.currentUserId);
  // Every video's words, so the quiz can bring back due words from earlier videos.
  const lexicon = useMemo(
    () => mergeLexicons(videos.map(v => lexiconByVideo[v.id] ?? [])),
    [videos, lexiconByVideo],
  );
  const targetLang: Lang = user?.targetLang ?? 'zh';
  const settings: Settings = {...defaultSettings, targetLang};
  const mastery: MasteryMap = user?.mastery ?? {};
  const watched = user?.watched ?? [];
  const nextUnwatched = nextVideo(videos, watched);

  // Each video's lexicon words, in the order they are first spoken.
  const wordsByVideo = useMemo(() => {
    const index = indexLexicon(lexicon.filter(e => e.lang === targetLang));
    return Object.fromEntries(
      Object.entries(cuesByVideo).map(([id, cues]) => [id, wordIdsInCues(cues, index, targetLang)]),
    );
  }, [cuesByVideo, lexicon, targetLang]);
  const newWordCounts = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(wordsByVideo).map(([id, ids]) => [id, newWordCount(ids, mastery)]),
      ),
    [wordsByVideo, mastery],
  );

  const pickVideo = (id: string) => {
    setVideoId(id);
    setScreen('quiz');
  };
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

  const updateCurrentUser = (change: (user: User) => User) =>
    update(prev => ({
      ...prev,
      users: prev.users.map(u => (u.id === prev.currentUserId ? change(u) : u)),
    }));

  // Watching to the end, or pressing Finish, marks a video watched.
  const markWatched = (id: string) =>
    updateCurrentUser(u => (u.watched.includes(id) ? u : {...u, watched: [...u.watched, id]}));

  const selectUser = (id: string) => {
    update(prev => ({...prev, currentUserId: id}));
    setScreen('home');
  };

  const createUser = (nickname: string, lang: Lang) => {
    const id = `user-${Date.now()}`;
    const created: User = {id, nickname, targetLang: lang, mastery: {}, watched: []};
    update(prev => ({...prev, users: [...prev.users, created], currentUserId: id}));
    setScreen('home');
  };

  // Cycles through the languages that have vocabulary.
  const cycleLanguage = () => {
    const available = LANGUAGES.filter(l => l.available);
    const at = available.findIndex(l => l.code === targetLang);
    updateCurrentUser(u => ({...u, targetLang: available[(at + 1) % available.length].code}));
  };

  // Every screen waits for the catalogue, and nothing works without the backend.
  if (backendDown || screen === 'loading' || videos.length === 0) {
    return (
      <ImageBackground source={require('./assets/background.png')} style={styles.background}>
        {backendDown ? (
          <ServerErrorScreen onRetry={loadVideos} />
        ) : (
          <Spinner label="Loading CaptLearn..." />
        )}
      </ImageBackground>
    );
  }

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
          videos={videos}
          watched={watched}
          newWordCounts={newWordCounts}
          onPickVideo={pickVideo}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          onManageAccounts={() => setScreen('manageAccounts')}
          onOpenCredits={() => setScreen('credits')}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'credits' && <CreditsScreen onBack={() => setScreen('settings')} />}
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
          cues={cuesByVideo[videoId] ?? null}
          mastery={mastery}
          targetLang={targetLang}
          onMasteryChange={next => updateCurrentUser(u => ({...u, mastery: next}))}
          onDone={answers => {
            setQuizAnswers(answers);
            setScreen('player');
          }}
          onExit={() => setScreen('home')}
        />
      )}
      {screen === 'player' && (
        <PlayerScreen
          videoId={videoId}
          thumbnail={thumbnailUrl(videoId)}
          cues={cuesByVideo[videoId] ?? []}
          settings={settings}
          lexicon={lexicon}
          mastery={mastery}
          onFinished={ids => {
            setCoveredIds(ids);
            markWatched(videoId);
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
          nextTitle={nextUnwatched?.title}
          onWatchNext={() => nextUnwatched && pickVideo(nextUnwatched.id)}
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
