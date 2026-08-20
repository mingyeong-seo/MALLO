import { StackActions } from '@react-navigation/native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { AskMatchedResultState } from '@/features/ask/components/AskMatchedResultState';
import { AskStatusState } from '@/features/ask/components/AskStatusState';
import { QuestionComposer } from '@/features/ask/components/QuestionComposer';
import { EXAMPLE_QUESTIONS } from '@/features/ask/data';
import { styles } from '@/features/ask/styles';
import type { AskMalloState } from '@/features/ask/types';
import { CONDITION_CONFIGS } from '@/features/check/data';
import type { ConditionOption } from '@/features/check/types';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import { askMallo } from '@/services/ask';
import { isApiError } from '@/services/api';
import type { AskResult } from '@/types/ask';

export default function AskScreen() {
  const {
    question: previewQuestion,
    state: previewState,
    reset: resetRequest,
  } = useLocalSearchParams<{
    question?: string;
    state?: string;
    reset?: string;
  }>();
  const insets = useSafeAreaInsets();
  const rootNavigation = useNavigation('/');
  const scrollRef = useRef<ScrollView>(null);
  const lastRequestQuestionRef = useRef('');
  const { recoverySession } = useRecoveryFlow();

  const isLoadingPreview = previewState === 'loading';
  const loadingPreviewQuestion =
    typeof previewQuestion === 'string' && previewQuestion.trim()
      ? previewQuestion.trim()
      : '세안해도 될까?';

  const [screenState, setScreenState] = useState<AskMalloState>(
    isLoadingPreview ? 'loading' : 'input',
  );
  const [question, setQuestion] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [inputNotice, setInputNotice] = useState('');
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [askResult, setAskResult] = useState<AskResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [canRetry, setCanRetry] = useState(false);

  const recoveryContext = useMemo(
    () => ({
      procedureName: recoverySession?.procedureName ?? 'REJURAN',
      recoveryDay: (recoverySession?.elapsedDay ?? 0) + 1,
    }),
    [recoverySession],
  );

  const floatingTabClearance =
    MALLO_SPACING.xxl * 2 +
    Math.max(insets.bottom, MALLO_SPACING.md) +
    MALLO_SPACING.lg;
  const composerBottomClearance =
    Platform.OS === 'ios' && isComposerFocused
      ? MALLO_SPACING.md
      : floatingTabClearance;

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ animated: false, y: 0 });
    }, 250);

    return () => clearTimeout(timer);
  }, [screenState]);

  const resetQuestion = useCallback(() => {
    Keyboard.dismiss();
    lastRequestQuestionRef.current = '';
    setScreenState('input');
    setQuestion('');
    setSubmittedQuestion('');
    setInputNotice('');
    setIsComposerFocused(false);
    setAskResult(null);
    setErrorMessage('');
    setCanRetry(false);
  }, []);

  useEffect(() => {
    if (typeof resetRequest === 'string' && !isLoadingPreview) {
      resetQuestion();
    }
  }, [isLoadingPreview, resetQuestion, resetRequest]);

  const applyAskResult = useCallback((result: AskResult) => {
    setAskResult(result);
    setScreenState('resolved');
  }, []);

  const executeQuestion = useCallback(
    async (requestQuestion: string, displayQuestion: string) => {
      lastRequestQuestionRef.current = requestQuestion;
      setSubmittedQuestion(displayQuestion);
      setInputNotice('');
      setErrorMessage('');
      setCanRetry(false);
      setAskResult(null);
      setScreenState('loading');
      Keyboard.dismiss();

      try {
        const result = await askMallo(
          {
            question: requestQuestion,
            photoRecordIds: [],
          },
          recoverySession?.sessionId,
        );

        applyAskResult(result);
      } catch (error) {
        if (isApiError(error) && error.status === 400) {
          setQuestion(displayQuestion);
          setInputNotice(error.message);
          setScreenState('input');
          return;
        }

        const isSessionError = isApiError(error) && error.status === 401;
        setErrorMessage(
          isSessionError
            ? '활성 Recovery Session을 확인하지 못했어요.'
            : isApiError(error)
              ? error.message
              : '잠시 후 다시 확인해 주세요. 입력한 질문은 그대로 유지돼요.',
        );
        setCanRetry(!isSessionError);
        setScreenState('error');
      }
    },
    [applyAskResult, recoverySession?.sessionId],
  );

  const runQuestion = useCallback(
    (rawQuestion: string) => {
      const normalizedQuestion = rawQuestion.trim();

      if (!normalizedQuestion) {
        setInputNotice('질문을 입력해 주세요.');
        return;
      }

      setQuestion(normalizedQuestion);
      void executeQuestion(normalizedQuestion, normalizedQuestion);
    },
    [executeQuestion],
  );

  const completeConditionCheck = useCallback(
    (option: ConditionOption) => {
      const followUpQuestion = `${submittedQuestion} 추가 조건은 ${option.label}이에요.`;
      void executeQuestion(followUpQuestion, submittedQuestion);
    },
    [executeQuestion, submittedQuestion],
  );

  const retryLastQuestion = useCallback(() => {
    const requestQuestion = lastRequestQuestionRef.current;

    if (requestQuestion) {
      void executeQuestion(requestQuestion, submittedQuestion);
    }
  }, [executeQuestion, submittedQuestion]);

  const renderState = () => {
    if (screenState === 'input') {
      return <QuestionInputState />;
    }

    if (screenState === 'loading') {
      return (
        <AskLoadingState
          isComplete={false}
          question={
            isLoadingPreview ? loadingPreviewQuestion : submittedQuestion
          }
        />
      );
    }

    const common = {
      onReset: resetQuestion,
      question: submittedQuestion,
    };

    if (screenState === 'error') {
      return (
        <AskStatusState
          {...common}
          description={
            errorMessage ||
            '잠시 후 다시 확인해 주세요. 입력한 질문은 그대로 유지돼요.'
          }
          icon="refresh-outline"
          onPrimaryPress={canRetry ? retryLastQuestion : undefined}
          primaryLabel={canRetry ? '다시 확인하기' : undefined}
          title={
            canRetry
              ? '안내를 불러오지 못했어요'
              : 'Recovery Session을 확인해 주세요'
          }
        />
      );
    }

    if (screenState !== 'resolved' || !askResult) {
      return null;
    }

    switch (askResult.status) {
      case 'MATCHED':
        return (
          <AskMatchedResultState
            onReset={resetQuestion}
            question={submittedQuestion}
            result={askResult}
          />
        );

      case 'CLARIFY':
        const conditionConfig = askResult.action
          ? CONDITION_CONFIGS[askResult.action]
          : null;

        if (!conditionConfig) {
          return (
            <AskStatusState
              {...common}
              description={
                askResult.message ||
                '질문을 조금 더 구체적으로 입력하면 다시 확인할 수 있어요.'
              }
              icon="chatbubble-ellipses-outline"
              title="조건을 조금 더 알려주세요"
            />
          );
        }

        return (
          <BehaviorFollowUpState
            config={conditionConfig}
            message={askResult.message || undefined}
            onOptionPress={completeConditionCheck}
            onReset={resetQuestion}
            question={submittedQuestion}
          />
        );

      case 'GENERAL':
        return (
          <AskStatusState
            {...common}
            description={
              askResult.message || '현재 회복 단계의 정보를 확인했어요.'
            }
            icon="sparkles-outline"
            title="회복 정보를 확인했어요"
          />
        );

      case 'NO_PROTOCOL':
        return (
          <AskStatusState
            {...common}
            description={
              askResult.message ||
              '현재 Recovery Protocol에서 이 조건에 맞는 안내를 찾지 못했어요.'
            }
            icon="document-text-outline"
            title="아직 제공할 수 있는 안내가 없어요"
          />
        );

      case 'UNSUPPORTED':
        return (
          <AskStatusState
            {...common}
            description={
              askResult.message ||
              '이 질문은 회복 관리 범위 밖이라 답변드리기 어려워요.'
            }
            icon="chatbubble-ellipses-outline"
            title="회복 관리 범위 밖의 질문이에요"
          />
        );

      case 'CONNECT':
        return (
          <AskStatusState
            {...common}
            description={
              askResult.message || '이 질문은 의료진 확인이 필요해요.'
            }
            icon="medical-outline"
            onPrimaryPress={() =>
              rootNavigation.dispatch(
                StackActions.replace('consultation', {
                  question: submittedQuestion,
                  source: 'ask-mallo',
                }),
              )
            }
            primaryLabel="의료진에게 문의하기"
            title="의료진의 확인이 필요해요"
          />
        );

    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            screenState !== 'input' && {
              paddingBottom: floatingTabClearance + MALLO_SPACING.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
        >
          <AskHeader
            onLogoPress={() => router.replace('/(tabs)/journey/home')}
          />

          <RecoveryContextTags recovery={recoveryContext} />

          {screenState === 'input' ? (
            <Pressable
              accessibilityRole="none"
              onPress={Keyboard.dismiss}
              style={{ flex: 1 }}
            >
              {renderState()}
            </Pressable>
          ) : (
            renderState()
          )}
        </ScrollView>

        {screenState === 'input' ? (
          <QuestionComposer
            allowAttachments={false}
            bottomClearance={composerBottomClearance}
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
