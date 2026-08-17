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
   * S08 결과 화면 이동
   *
   * ASK에서는 결과를 직접 보여주지 않고
   * 최종 결과 화면으로 통일한다.
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

    /**
     * 사용자가 이후 Ask 탭으로 다시 돌아왔을 때
     * 처음 질문 화면부터 시작하도록 상태 초기화
     */
    setScreenState('input');
    setQuestion('');
    setSubmittedQuestion('');
    setInputNotice('');
    setIsLoadingComplete(false);
    setIsComposerFocused(false);
  };

  /**
   * 운동 추가 조건 선택
   *
   * 조건 선택
   * → checked
   * → S08 Result
   */
  const completeExerciseCheck = (option: FollowUpOption) => {
    Keyboard.dismiss();

    // 조건 확인 완료
    setIsLoadingComplete(true);
    setScreenState('loading');

    /**
     * checked 캐릭터를 잠깐 보여준 뒤
     * 결과 화면으로 이동
     */
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
   * 세안 결과
   *
   * thinking/searching
   * → checked
   * → POSSIBLE Result
   */
  const openWashResult = (questionText: string) => {
    openResult({
      action: '세안',
      condition: '가볍게',
      decision: 'POSSIBLE',
      question: questionText,
    });
  };

  /**
   * 스킨케어 결과
   *
   * 현재 MVP Mock:
   * 제품 성분 확인이 필요한 상황으로 처리
   */
  const openSkincareResult = (questionText: string) => {
    openResult({
      action: '스킨케어 제품 사용',
      condition: '성분 확인 필요',
      decision: 'ADJUST',
      question: questionText,
    });
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

    Keyboard.dismiss();

    const intent = classifyMockQuestion(normalizedQuestion);

    /**
     * 모든 질문 공통
     *
     * 질문 전송
     * → thinking ↔ searching
     */
    setIsLoadingComplete(false);
    setScreenState('loading');

    /**
     * 운동 질문
     *
     * 운동은 강도 Context가 필요하므로
     * 바로 결과로 보내지 않고 추가 질문 화면으로 이동한다.
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
     * 세안 / 스킨케어
     *
     * 추가 Context 없이 현재 Mock에서
     * 결과를 결정할 수 있으므로:
     *
     * thinking/searching
     * → checked
     * → Result
     */

    // thinking/searching을 충분히 보여준 뒤 checked
    setTimeout(() => {
      setIsLoadingComplete(true);
    }, 3600);

    // checked를 잠깐 보여준 뒤 최종 Result
    setTimeout(() => {
      if (intent === 'wash-result') {
        openWashResult(normalizedQuestion);
        return;
      }

      if (intent === 'skincare-result') {
        openSkincareResult(normalizedQuestion);
        return;
      }

      /**
       * 현재 Mock 범위 밖 질문
       *
       * NO_PROTOCOL / CONNECT 자동 분류는
       * 이후 실제 API 연결 시 확장.
       *
       * 현재는 기존 notice 방식 유지.
       */
      setIsLoadingComplete(false);
      setScreenState('input');

      setQuestion(normalizedQuestion);
      setSubmittedQuestion('');

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
    setIsLoadingComplete(false);
    setIsComposerFocused(false);

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
          ) : null}
        </ScrollView>

        {screenState === 'input' ? (
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
