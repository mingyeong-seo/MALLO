import { router, useLocalSearchParams } from 'expo-router';
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
import { AskLoadingState } from '@/features/ask/components/AskLoadingState';
import { QuestionComposer } from '@/features/ask/components/QuestionComposer';
import { EXAMPLE_QUESTIONS, MOCK_RECOVERY_CONTEXT } from '@/features/ask/data';
import { styles } from '@/features/ask/styles';
import type {
  ActionResultDecision,
  AskMalloState,
  FollowUpOption,
  QuickAnswer,
} from '@/features/ask/types';
import { classifyMockQuestion } from '@/features/ask/utils';

export default function AskScreen() {
  const { question: previewQuestion, state: previewState } =
    useLocalSearchParams<{
      question?: string;
      state?: string;
    }>();

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const isLoadingPreview = previewState === 'loading';

  const loadingPreviewQuestion =
    typeof previewQuestion === 'string' && previewQuestion.trim()
      ? previewQuestion.trim()
      : '세안해도 될까?';

  const [isComposerFocused, setIsComposerFocused] = useState(false);

  const [screenState, setScreenState] = useState<AskMalloState>(
    isLoadingPreview ? 'loading' : 'input',
  );

  const [question, setQuestion] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [inputNotice, setInputNotice] = useState('');

  const [quickAnswer, setQuickAnswer] = useState<QuickAnswer | null>(null);

  // false = thinking ↔ searching
  // true = checked
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

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

  /**
   * S08 상세 결과 화면 이동
   */
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

    // 다음에 Ask 탭으로 돌아왔을 때 초기 상태가 되도록 정리
    setScreenState('input');
    setQuestion('');
    setSubmittedQuestion('');
    setInputNotice('');
    setQuickAnswer(null);
    setIsLoadingComplete(false);
  };

  /**
   * 운동 추가 조건 선택 후
   * checked 상태를 잠깐 보여준 뒤 S08 결과로 이동
   */
  const completeExerciseCheck = (option: FollowUpOption) => {
    Keyboard.dismiss();

    // 조건 확인이 끝났으므로 checked 상태로 전환
    setIsLoadingComplete(true);
    setScreenState('loading');

    // checked 이미지를 0.7초 보여준 뒤 결과 화면으로 이동
    setTimeout(() => {
      openResult({
        action: '운동',
        condition: option.condition,
        decision: option.decision,
        question: submittedQuestion,
      });
    }, 1200);
  };

  /**
   * ASK 질문 실행
   */
  const runQuestion = (rawQuestion: string) => {
    const normalizedQuestion = rawQuestion.trim();

    if (!normalizedQuestion) {
      setInputNotice('질문을 입력해 주세요.');
      return;
    }

    setQuestion(normalizedQuestion);
    setSubmittedQuestion(normalizedQuestion);
    setInputNotice('');
    setIsComposerFocused(false);
    setQuickAnswer(null);

    Keyboard.dismiss();

    const intent = classifyMockQuestion(normalizedQuestion);

    /**
     * 모든 질문은 먼저 Loading 진입
     *
     * false:
     * thinking ↔ searching 반복
     */
    setIsLoadingComplete(false);
    setScreenState('loading');

    /**
     * 운동 질문
     *
     * thinking ↔ searching
     * → 조건 확인
     *
     * 아직 조건이 부족하므로 여기서는 checked를 보여주지 않음.
     */
    if (intent === 'exercise-follow-up') {
      setTimeout(() => {
        setIsLoadingComplete(false);
        setScreenState('behavior-follow-up');

        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            animated: false,
            y: 0,
          });
        });
      }, 3600);

      return;
    }

    /**
     * 세안 / 스킨케어 등 바로 답변 가능한 질문
     *
     * thinking ↔ searching
     * → checked
     * → Quick Result
     */

    // 2.7초 후 checked 표시
    setTimeout(() => {
      setIsLoadingComplete(true);
    }, 3600);

    // checked를 약 1.1초 보여준 뒤 결과로 이동
    setTimeout(() => {
      if (intent === 'wash-result') {
        setQuickAnswer({
          action: '세안',
          condition: '가볍게',
          decision: 'POSSIBLE',
          title: '지금 진행해도 괜찮아요',
          description:
            '현재 회복 단계에서는 자극을 줄여 가볍게 세안하는 방향으로 안내해요.',
        });

        setQuestion('');
        setIsLoadingComplete(false);
        setScreenState('quick-result');

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

        setQuestion('');
        setIsLoadingComplete(false);
        setScreenState('quick-result');

        return;
      }

      /**
       * 현재 Mock 범위에서 분류하지 못한 질문
       *
       * NO_PROTOCOL 전용 화면은 다음 브랜치에서 구현 예정.
       * 지금은 기존 입력 화면의 notice 방식 유지.
       */
      setIsLoadingComplete(false);
      setScreenState('input');
      setQuestion(normalizedQuestion);

      setInputNotice(
        '운동, 세안, 스킨케어처럼 확인할 행동을 포함해 질문해 주세요.',
      );
    }, 5000);
  };

  /**
   * 질문 초기화
   */
  const resetQuestion = () => {
    Keyboard.dismiss();

    setScreenState('input');
    setQuestion('');
    setSubmittedQuestion('');
    setInputNotice('');
    setQuickAnswer(null);
    setIsLoadingComplete(false);

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

            (screenState === 'behavior-follow-up' ||
              screenState === 'loading') && {
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
          ) : screenState === 'loading' ? (
            <AskLoadingState
              question={
                isLoadingPreview ? loadingPreviewQuestion : submittedQuestion
              }
              isComplete={isLoadingComplete}
            />
          ) : screenState === 'behavior-follow-up' ? (
            <BehaviorFollowUpState
              question={submittedQuestion}
              onOptionPress={completeExerciseCheck}
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

        {(screenState === 'input' || screenState === 'quick-result') && (
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
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
