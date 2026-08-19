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
import { AskStatusState } from '@/features/ask/components/AskStatusState';
import { QuestionComposer } from '@/features/ask/components/QuestionComposer';
import {
  EXAMPLE_QUESTIONS,
  getGeneralRecoveryResult,
} from '@/features/ask/data';
import { styles } from '@/features/ask/styles';
import type { AskMalloState, MockQuestionIntent } from '@/features/ask/types';
import {
  classifyMockQuestion,
  getExplicitMockContext,
} from '@/features/ask/utils';
import { CONDITION_CONFIGS } from '@/features/check/data';
import { requestMockQuickCheck } from '@/features/check/mock-service';
import type { ConditionOption } from '@/features/check/types';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import type { QuickCheckAction } from '@/features/recovery/types';

const INTENT_ACTION: Partial<Record<MockQuestionIntent, QuickCheckAction>> = {
  'exercise-follow-up': 'EXERCISE',
  'wash-follow-up': 'CLEANSING',
  'skincare-follow-up': 'SKINCARE',
  'makeup-follow-up': 'MAKEUP',
  'heat-follow-up': 'HEAT',
};

// ASK 첫 분석 단계에서 THINK ↔ SEARCH를 보여주는 최소 시간
const INITIAL_LOADING_DELAY_MS = 2800;

// 조건 선택 후 다시 Protocol을 확인할 때 THINK ↔ SEARCH를 보여주는 최소 시간
const FOLLOW_UP_LOADING_MIN_MS = 2200;

// CHECK 이미지를 보여준 뒤 다음 화면으로 넘어가기 전 유지 시간
const CHECKED_HOLD_MS = 700;

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
  const { recoverySession, saveQuickCheck } = useRecoveryFlow();

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
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<QuickCheckAction>('EXERCISE');
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  const recoveryContext = useMemo(
    () => ({
      procedureName: recoverySession?.procedureName ?? 'REJURAN',
      recoveryDay: (recoverySession?.elapsedDay ?? 0) + 1,
    }),
    [recoverySession],
  );

  const generalRecoveryResult = useMemo(
    () => getGeneralRecoveryResult(submittedQuestion),
    [submittedQuestion],
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
    setScreenState('input');
    setQuestion('');
    setSubmittedQuestion('');
    setInputNotice('');
    setAttachments([]);
    setIsComposerFocused(false);
    setIsLoadingComplete(false);
  }, []);

  useEffect(() => {
    if (typeof resetRequest === 'string' && !isLoadingPreview) {
      resetQuestion();
    }
  }, [isLoadingPreview, resetQuestion, resetRequest]);

  const openStoredResult = (checkId: string, resultQuestion: string) => {
    router.push({
      pathname: '/(tabs)/check/result',
      params: {
        checkId,
        question: resultQuestion,
        source: 'ask-mallo',
      },
    });
  };

  const showCheckedThen = async (next: () => void) => {
    setIsLoadingComplete(true);

    // CHECK 상태가 실제 화면에 한 번 렌더링될 때까지 기다림
    await waitForPaint();

    // 렌더링된 CHECK 화면을 지정한 시간 동안 유지
    await wait(CHECKED_HOLD_MS);

    next();
  };

  const completeConditionCheck = async (option: ConditionOption) => {
    const config = CONDITION_CONFIGS[pendingAction];

    Keyboard.dismiss();
    setIsLoadingComplete(false);
    setScreenState('loading');

    try {
      const [response] = await Promise.all([
        requestMockQuickCheck({
          action: pendingAction,
          context: { [config.contextKey]: option.value },
          elapsedDay: recoverySession?.elapsedDay ?? 0,
        }),
        wait(FOLLOW_UP_LOADING_MIN_MS),
      ]);

      if (response.status === 'NO_PROTOCOL') {
        setScreenState('no-protocol');
        return;
      }

      saveQuickCheck(response.result);

      await showCheckedThen(() => {
        openStoredResult(response.result.checkId, submittedQuestion);
      });
    } catch {
      setScreenState('error');
    }
  };

  const resolveExplicitContext = async (
    action: QuickCheckAction,
    contextValue: string,
    resultQuestion: string,
  ) => {
    const config = CONDITION_CONFIGS[action];

    try {
      const response = await requestMockQuickCheck({
        action,
        context: { [config.contextKey]: contextValue },
        elapsedDay: recoverySession?.elapsedDay ?? 0,
      });

      if (response.status === 'NO_PROTOCOL') {
        setScreenState('no-protocol');
        return;
      }

      saveQuickCheck(response.result);

      await showCheckedThen(() => {
        openStoredResult(response.result.checkId, resultQuestion);
      });
    } catch {
      setScreenState('error');
    }
  };

  const finishNonActionIntent = async (intent: MockQuestionIntent) => {
    await showCheckedThen(() => {
      switch (intent) {
        case 'general-result':
          setScreenState('general-result');
          break;

        case 'medical-connect':
          setScreenState('connect');
          break;

        case 'mock-error':
          setScreenState('error');
          break;

        default:
          setScreenState('unsupported-question');
      }
    });
  };

  const runQuestion = (rawQuestion: string) => {
    const normalizedQuestion = rawQuestion.trim();

    if (!normalizedQuestion) {
      setInputNotice('질문을 입력해 주세요.');
      return;
    }

    const intent = classifyMockQuestion(normalizedQuestion);
    const action = INTENT_ACTION[intent];
    const explicitContext = getExplicitMockContext(normalizedQuestion);

    setQuestion(normalizedQuestion);
    setSubmittedQuestion(normalizedQuestion);
    setInputNotice('');
    setIsLoadingComplete(false);
    setScreenState('loading');
    Keyboard.dismiss();

    setTimeout(() => {
      if (explicitContext) {
        void resolveExplicitContext(
          explicitContext.action,
          explicitContext.value,
          normalizedQuestion,
        );
        return;
      }

      if (action) {
        setPendingAction(action);
        setScreenState('behavior-follow-up');
        return;
      }

      void finishNonActionIntent(intent);
    }, INITIAL_LOADING_DELAY_MS);
  };

  const renderState = () => {
    if (screenState === 'input') {
      return <QuestionInputState />;
    }

    if (screenState === 'loading') {
      return (
        <AskLoadingState
          isComplete={isLoadingComplete}
          question={
            isLoadingPreview ? loadingPreviewQuestion : submittedQuestion
          }
        />
      );
    }

    if (screenState === 'behavior-follow-up') {
      return (
        <BehaviorFollowUpState
          config={CONDITION_CONFIGS[pendingAction]}
          onOptionPress={completeConditionCheck}
          onReset={resetQuestion}
          question={submittedQuestion}
        />
      );
    }

    const common = {
      onReset: resetQuestion,
      question: submittedQuestion,
    };

    switch (screenState) {
      case 'general-result':
        return (
          <AskStatusState
            {...common}
            description={generalRecoveryResult.description}
            icon="sparkles-outline"
            title={generalRecoveryResult.title}
          />
        );

      case 'no-protocol':
        return (
          <AskStatusState
            {...common}
            description="현재 Recovery Protocol에서 이 조건에 맞는 안내를 찾지 못했어요."
            icon="document-text-outline"
            title="아직 제공할 수 있는 안내가 없어요"
          />
        );

      case 'unsupported-question':
        return (
          <AskStatusState
            {...common}
            description="운동, 세안, 스킨케어, 화장, 열 자극처럼 회복 중 궁금한 행동이나 회복 변화에 대해 질문해 주세요."
            icon="chatbubble-ellipses-outline"
            title="이 질문은 아직 확인하기 어려워요"
          />
        );

      case 'error':
        return (
          <AskStatusState
            {...common}
            description="잠시 후 다시 확인해 주세요. 입력한 질문은 그대로 유지돼요."
            icon="refresh-outline"
            onPrimaryPress={() => runQuestion(submittedQuestion)}
            primaryLabel="다시 확인하기"
            title="안내를 불러오지 못했어요"
          />
        );

      case 'connect':
        return (
          <AskStatusState
            {...common}
            description="입력한 내용만으로 안내하기 어려워 의료진 확인 단계로 연결해요."
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

      default:
        return null;
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
            attachments={attachments}
            bottomClearance={composerBottomClearance}
            notice={inputNotice}
            onAddAttachment={() =>
              setAttachments((current) => [
                ...current,
                `mock-ask-photo-${Date.now()}`,
              ])
            }
            onChangeText={(text) => {
              setQuestion(text);

              if (inputNotice) {
                setInputNotice('');
              }
            }}
            onRemoveAttachment={(attachment) =>
              setAttachments((current) =>
                current.filter((item) => item !== attachment),
              )
            }
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

function wait(duration: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}
