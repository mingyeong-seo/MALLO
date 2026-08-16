import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { MALLO_SPACING } from '@/constants/theme';
import {
  AskHeader,
  BehaviorFollowUpState,
  QuestionInputState,
  QuickAnswerState,
  RecoveryContextTags,
} from '@/features/ask/components/AskContent';
import { QuestionComposer } from '@/features/ask/components/QuestionComposer';
import { EXAMPLE_QUESTIONS, MOCK_RECOVERY_CONTEXT } from '@/features/ask/data';
import { styles } from '@/features/ask/styles';
import type {
  ActionResultDecision,
  AskMalloState,
  QuickAnswer,
} from '@/features/ask/types';
import { classifyMockQuestion } from '@/features/ask/utils';

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [screenState, setScreenState] = useState<AskMalloState>('input');
  const [question, setQuestion] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [inputNotice, setInputNotice] = useState('');

  const [quickAnswer, setQuickAnswer] = useState<QuickAnswer | null>(null);

  const recovery = MOCK_RECOVERY_CONTEXT;

  const floatingTabClearance =
    MALLO_SPACING.xxl * 2 +
    Math.max(insets.bottom, MALLO_SPACING.md) +
    MALLO_SPACING.lg;

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        animated: false,
        y: 0,
      });
    }, 250);

    return () => clearTimeout(scrollTimer);
  }, [screenState]);

  const openResult = ({
    action,
    condition,
    decision,
    question,
  }: {
    action: string;
    condition: string;
    decision: ActionResultDecision;
    question: string;
  }) => {
    Keyboard.dismiss();

    router.push({
      pathname: '/(tabs)/check/result',
      params: {
        action,
        condition,
        decision,
        question,
        source: 'ask-mallo',
      },
    });

    // 다음에 Ask 탭을 다시 열면 초기 상태가 되도록 정리
    setScreenState('input');
    setQuestion('');
    setSubmittedQuestion('');
    setInputNotice('');
  };

  const runQuestion = (rawQuestion: string) => {
    const normalizedQuestion = rawQuestion.trim();

    if (!normalizedQuestion) {
      setInputNotice('질문을 입력해 주세요.');
      return;
    }

    setQuestion(normalizedQuestion);
    setSubmittedQuestion(normalizedQuestion);
    setInputNotice('');

    const intent = classifyMockQuestion(normalizedQuestion);

    if (intent === 'exercise-follow-up') {
      Keyboard.dismiss();
      setScreenState('behavior-follow-up');

      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          animated: false,
          y: 0,
        });
      });

      return;
    }

    if (intent === 'wash-result') {
      setQuickAnswer({
        action: '세안',
        condition: '가볍게',
        decision: 'POSSIBLE',
        title: '지금 진행해도 괜찮아요',
        description:
          '현재 회복 단계에서는 자극을 줄여 가볍게 세안하는 방향으로 안내해요.',
      });

      setSubmittedQuestion(normalizedQuestion);
      setQuestion('');
      setIsComposerFocused(false);
      setScreenState('quick-result');
      Keyboard.dismiss();

      return;
    }

    if (intent === 'skincare-result') {
      setQuickAnswer({
        action: '스킨케어 제품 사용',
        condition: '성분 확인 필요',
        decision: 'ADJUST',
        title: '조건을 확인해서 조절해 주세요',
        description:
          '현재 회복 단계에서는 사용하는 제품의 성분을 확인한 뒤 조절해서 사용하는 방향으로 안내해요.',
      });

      setSubmittedQuestion(normalizedQuestion);
      setQuestion('');
      setIsComposerFocused(false);
      setScreenState('quick-result');
      Keyboard.dismiss();

      return;
    }

    setInputNotice(
      '운동, 세안, 스킨케어처럼 확인할 행동을 포함해 질문해 주세요.',
    );
  };

  const resetQuestion = () => {
    Keyboard.dismiss();

    setScreenState('input');
    setQuestion('');
    setSubmittedQuestion('');
    setInputNotice('');
    setQuickAnswer(null);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        animated: false,
        y: 0,
      });
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            screenState === 'behavior-follow-up' && {
              paddingBottom: floatingTabClearance + MALLO_SPACING.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
        >
          <AskHeader />
          <RecoveryContextTags recovery={recovery} />

          {screenState === 'input' ? (
            <QuestionInputState />
          ) : screenState === 'behavior-follow-up' ? (
            <BehaviorFollowUpState
              question={submittedQuestion}
              onOptionPress={(option) =>
                openResult({
                  action: '운동',
                  condition: option.condition,
                  decision: option.decision,
                  question: submittedQuestion,
                })
              }
              onReset={resetQuestion}
            />
          ) : quickAnswer ? (
            <QuickAnswerState
              answer={quickAnswer}
              question={submittedQuestion}
              isComposerFocused={isComposerFocused}
              onDetailPress={() =>
                openResult({
                  action: quickAnswer.action,
                  condition: quickAnswer.condition,
                  decision: quickAnswer.decision,
                  question: submittedQuestion,
                })
              }
            />
          ) : null}
        </ScrollView>

        {screenState !== 'behavior-follow-up' ? (
          <QuestionComposer
            bottomClearance={floatingTabClearance}
            notice={inputNotice}
            onChangeText={(text) => {
              setQuestion(text);

              if (inputNotice) {
                setInputNotice('');
              }
            }}
            onFocusChange={setIsComposerFocused}
            onSubmit={() => runQuestion(question)}
            suggestions={EXAMPLE_QUESTIONS}
            value={question}
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
