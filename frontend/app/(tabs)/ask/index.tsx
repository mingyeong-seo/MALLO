import { StackActions } from '@react-navigation/native';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
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
import { EXAMPLE_QUESTIONS } from '@/features/ask/data';
import { styles } from '@/features/ask/styles';
import { useAskFlow } from '@/features/ask/useAskFlow';
import { CONDITION_CONFIGS } from '@/features/check/data';

const EMPTY_ATTACHMENTS: readonly string[] = [];

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const flow = useAskFlow();
  const floatingTabClearance =
    MALLO_SPACING.xxl * 2 +
    Math.max(insets.bottom, MALLO_SPACING.md) +
    MALLO_SPACING.lg;
  const composerBottomClearance =
    Platform.OS === 'ios' && flow.isComposerFocused
      ? MALLO_SPACING.md
      : floatingTabClearance;

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ animated: false, y: 0 });
    }, 250);
    return () => clearTimeout(timer);
  }, [flow.screenState]);

  function renderState() {
    if (flow.screenState === 'input') {
      return <QuestionInputState />;
    }
    if (flow.screenState === 'loading') {
      return (
        <AskLoadingState
          isComplete={flow.isLoadingComplete}
          question={
            flow.isLoadingPreview
              ? flow.loadingPreviewQuestion
              : flow.submittedQuestion
          }
        />
      );
    }
    if (flow.screenState === 'behavior-follow-up') {
      return (
        <BehaviorFollowUpState
          config={CONDITION_CONFIGS[flow.pendingAction]}
          onOptionPress={flow.completeConditionCheck}
          onReset={flow.resetQuestion}
          question={flow.submittedQuestion}
        />
      );
    }

    const common = {
      onReset: flow.resetQuestion,
      question: flow.submittedQuestion,
    };
    switch (flow.screenState) {
      case 'general-result':
        return (
          <AskStatusState
            {...common}
            description={flow.statusMessage}
            icon="sparkles-outline"
            title="현재 회복 단계의 안내예요"
          />
        );
      case 'no-protocol':
        return (
          <AskStatusState
            {...common}
            description={flow.statusMessage}
            icon="document-text-outline"
            title="아직 제공할 수 있는 안내가 없어요"
          />
        );
      case 'unsupported-question':
        return (
          <AskStatusState
            {...common}
            description={flow.statusMessage}
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
            onPrimaryPress={() => void flow.runQuestion(flow.submittedQuestion)}
            primaryLabel="다시 확인하기"
            title="안내를 불러오지 못했어요"
          />
        );
      case 'connect':
        return (
          <AskStatusState
            {...common}
            description={flow.statusMessage}
            icon="medical-outline"
            onPrimaryPress={() =>
              flow.rootNavigation.dispatch(
                StackActions.replace('consultation', {
                  question: flow.submittedQuestion,
                  source: 'ask-mallo',
                }),
              )
            }
            primaryLabel="의료진에게 문의하기"
            title="의료진의 확인이 필요해요"
          />
        );
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            flow.screenState !== 'input' && {
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
          <RecoveryContextTags recovery={flow.recoveryContext} />
          {flow.screenState === 'input' ? (
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

        {flow.screenState === 'input' ? (
          <QuestionComposer
            attachments={EMPTY_ATTACHMENTS}
            bottomClearance={composerBottomClearance}
            notice={flow.inputNotice}
            onAddAttachment={() =>
              flow.setInputNotice(
                '사진 첨부는 아직 연결 중이에요. 질문만 먼저 확인할게요.',
              )
            }
            onChangeText={(text) => {
              flow.setQuestion(text);
              if (flow.inputNotice) {
                flow.setInputNotice('');
              }
            }}
            onRemoveAttachment={() => undefined}
            onFocusChange={flow.setIsComposerFocused}
            onSubmit={() => void flow.runQuestion(flow.question)}
            suggestions={EXAMPLE_QUESTIONS}
            value={flow.question}
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
