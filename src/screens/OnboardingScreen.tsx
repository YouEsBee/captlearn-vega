import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {FocusButton} from '../components/FocusButton';
import {LANGUAGES} from '../data/languages';
import {Lang} from '../learning/types';

type Step = 'welcome' | 'nickname' | 'language';

interface Props {
  /** Called when the learner finishes: creates the user and starts at home. */
  onComplete: (nickname: string, lang: Lang) => void;
  /** Leaves onboarding. Hidden on first run, when there is nowhere to go back to. */
  onExit: () => void;
  canExit: boolean;
}

/** First-run flow: welcome, pick a nickname for a local account, then pick a language. */
export const OnboardingScreen = ({onComplete, onExit, canExit}: Props) => {
  const [step, setStep] = useState<Step>('welcome');
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const trimmed = nickname.trim();

  const back = () => {
    if (step === 'welcome') {
      onExit();
    } else {
      setStep(step === 'language' ? 'nickname' : 'welcome');
    }
  };

  return (
    <View style={styles.container}>
      {step !== 'welcome' || canExit ? (
        <FocusButton label="‹ Back" onPress={back} variant="text" />
      ) : null}
      <View style={styles.body}>
        {step === 'welcome' && (
          <>
            <Text style={styles.title}>Welcome to CaptLearn</Text>
            <FocusButton label="Continue" onPress={() => setStep('nickname')} hasTVPreferredFocus compact />
          </>
        )}

        {step === 'nickname' && (
          <>
            <Text style={styles.title}>Let's create a local account. Set your nickname.</Text>
            <TextInput
              value={nickname}
              onChangeText={text => {
                setNickname(text);
                setMessage(null);
              }}
              placeholder="Enter your nickname here"
              placeholderTextColor="#8C90B8"
              style={styles.input}
              autoFocus
            />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <FocusButton
              label="Continue"
              onPress={() => {
                if (trimmed.length === 0) {
                  setMessage('Please enter a nickname.');
                  return;
                }
                setStep('language');
              }}
              compact
            />
          </>
        )}

        {step === 'language' && (
          <>
            <Text style={styles.title}>What language would you like to learn?</Text>
            {LANGUAGES.map((lang, i) => (
              <FocusButton
                key={lang.code}
                label={lang.available ? lang.label : `${lang.label} (coming soon)`}
                onPress={() => {
                  if (lang.available) {
                    onComplete(trimmed, lang.code);
                  }
                }}
                hasTVPreferredFocus={i === 0}
                compact
              />
            ))}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, paddingHorizontal: 64, paddingVertical: 48},
  body: {flex: 1, justifyContent: 'center', maxWidth: 900},
  title: {color: '#FFFFFF', fontSize: 48, fontWeight: '600', marginBottom: 32},
  input: {
    color: '#FFFFFF',
    fontSize: 28,
    borderWidth: 2,
    borderColor: '#5B60A0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 16,
    width: 560,
  },
  message: {color: '#FFB3B3', fontSize: 22, marginBottom: 8},
});
