import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Platform, Pressable, Text, View } from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';
import { EXERCISE_OPTIONS } from '@/features/ask/data';
import { styles } from '@/features/ask/styles';
import type {
  FollowUpOption,
  QuickAnswer,
  RecoveryContext,
} from '@/features/ask/types';
import { formatRecoveryDay } from '@/features/ask/utils';

export function AskHeader() {
  return (
    <View style={styles.header}>
      <Image
        accessible
        accessibilityLabel="MALLO"
        source={require('../../../assets/images/mallo-logo-red.png')}
        style={styles.headerLogo}
        resizeMode="contain"
      />
    </View>
  );
}

export function RecoveryContextTags({
  recovery,
}: {
  recovery: RecoveryContext;
}) {
  return (
    <View
      accessibilityLabel={`${recovery.procedureName}, ${formatRecoveryDay(
        recovery.recoveryDay,
      )}`}
      style={styles.contextSection}
    >
      <View style={styles.contextChip}>
        <Text style={styles.contextText}>{recovery.procedureName}</Text>
      </View>

      <View style={styles.contextChip}>
        <Text style={styles.contextText}>
          {formatRecoveryDay(recovery.recoveryDay)}
        </Text>
      </View>
    </View>
  );
}

export function QuestionInputState() {
  return (
    <View style={styles.stateContent}>
      <View style={styles.introSection}>
        <View style={styles.introTitleRow}>
          <Ionicons
            name="sparkles-outline"
            size={20}
            color={MALLO_COLORS.core.red}
          />

          <Text style={styles.screenTitle}>ASK MALLO</Text>
        </View>

        <Text style={styles.screenDescription}>
          필요한 조건을 확인한 뒤 Recovery Protocol을 기준으로 안내해요.
        </Text>
      </View>

      {/* 1. 그래픽 */}
      <View style={styles.illustrationContainer}>
        <Image
          accessible={false}
          source={require('../../../assets/images/ask-recovery-actions.png')}
          style={styles.askIllustration}
          resizeMode="contain"
        />
      </View>

      {/* 2. MALLO 안내 */}
      <View style={styles.askGuide}>
        {/* 위 구분선 */}
        <View style={styles.askGuideDivider}>
          <View style={styles.askGuideLine} />

          <Ionicons
            name="sparkles-outline"
            size={14}
            color={MALLO_COLORS.core.red}
          />

          <View style={styles.askGuideLine} />
        </View>

        {/* 안내 문구 */}
        <View style={styles.askGuideTextContainer}>
          <Text style={styles.askGuideTitle}>MALLO에게</Text>

          <Text style={styles.askGuideHighlight}>
            궁금한 행동을 물어보세요.
          </Text>

          <Text style={styles.askGuideSub}>
            입력창을 누르면 질문 예시도 확인할 수 있어요.
          </Text>
        </View>

        {/* 아래 구분선 */}
        <View style={styles.askGuideDivider}>
          <View style={styles.askGuideLine} />

          <Ionicons
            name="sparkles-outline"
            size={14}
            color={MALLO_COLORS.core.red}
          />

          <View style={styles.askGuideLine} />
        </View>
      </View>
    </View>
  );
}

export function BehaviorFollowUpState({
  onOptionPress,
  onReset,
  question,
}: {
  onOptionPress: (option: FollowUpOption) => void;
  onReset: () => void;
  question: string;
}) {
  return (
    <View style={styles.stateContent}>
      {/* 사용자가 입력한 질문 */}
      <View style={styles.questionRecall}>
        <Text style={styles.questionRecallLabel}>내 질문</Text>
        <Text style={styles.questionRecallText}>“{question}”</Text>
      </View>

      <View style={styles.questionFlowLine} />

      <View style={styles.followUpSection}>
        <Text style={styles.followUpTitle}>
          어떤 <Text style={styles.followUpKeyword}>운동</Text>을 하려고 하나요?
        </Text>

        <Text style={styles.followUpDescription}>
          운동 강도에 따라 안내가 달라질 수 있어요.
        </Text>

        {/* 가로 조건 선택 */}
        <View style={styles.optionList}>
          {EXERCISE_OPTIONS.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option.label}
              onPress={() => onOptionPress(option)}
              style={({ pressed, hovered }) => [
                styles.optionCard,
                hovered && styles.optionCardHovered,
                pressed && styles.optionCardPressed,
              ]}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>

              {option.description ? (
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        {/* 공통 조건 확인 일러스트 */}
        <View style={styles.followUpIllustrationContainer}>
          <Image
            accessible={false}
            source={require('../../../assets/images/ask-condition-check.png')}
            style={styles.followUpIllustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.protocolNote}>
          <Ionicons
            name="document-text-outline"
            size={17}
            color={MALLO_COLORS.support.secondaryTextGray}
          />

          <Text style={styles.protocolNoteText}>
            선택한 조건은 Recovery Protocol과 함께 확인해요.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          style={({ pressed }) => [
            styles.resetButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={17}
            color={MALLO_COLORS.support.charcoal}
          />

          <Text style={styles.resetButtonText}>질문 다시 입력하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function QuickAnswerState({
  answer,
  isComposerFocused,
  onDetailPress,
  question,
}: {
  answer: QuickAnswer;
  isComposerFocused: boolean;
  onDetailPress: () => void;
  question: string;
}) {
  const isPossible = answer.decision === 'POSSIBLE';
  const isWeb = Platform.OS === 'web';

  return (
    <View
      style={[
        styles.stateContent,
        styles.quickAnswerStateContent,

        !isComposerFocused &&
          (isWeb
            ? styles.quickAnswerStateRestingWeb
            : styles.quickAnswerStateRestingNative),
      ]}
    >
      {/* 내가 입력한 질문 */}
      <View style={[styles.questionRecall, isWeb && styles.questionRecallWeb]}>
        <Text style={styles.questionRecallLabel}>내 질문</Text>
        <Text style={styles.questionRecallText}>“{question}”</Text>
      </View>

      <View style={styles.questionFlowLine} />

      {/* MALLO 간단 답변 */}
      <View style={styles.quickAnswerSection}>
        <Text style={styles.quickAnswerEyebrow}>MALLO가 확인했어요</Text>

        <View style={styles.quickAnswerHeader}>
          <Ionicons
            name={isPossible ? 'checkmark-circle-outline' : 'options-outline'}
            size={22}
            color={isPossible ? '#5F9F6A' : MALLO_COLORS.core.red}
          />

          <Text style={styles.quickAnswerTitle}>{answer.title}</Text>
        </View>

        <Text
          style={[
            styles.quickAnswerDescription,
            isWeb
              ? styles.quickAnswerDescriptionWeb
              : styles.quickAnswerDescriptionNative,
          ]}
        >
          {answer.description}
        </Text>

        <View
          style={[
            styles.quickAnswerProtocol,
            isWeb
              ? styles.quickAnswerProtocolWeb
              : styles.quickAnswerProtocolNative,
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={MALLO_COLORS.support.secondaryTextGray}
          />

          <Text style={styles.quickAnswerProtocolText}>
            Recovery Protocol을 기준으로 확인했어요.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onDetailPress}
          style={({ pressed }) => [
            styles.quickAnswerDetailButton,

            isWeb
              ? styles.quickAnswerDetailButtonWeb
              : styles.quickAnswerDetailButtonNative,

            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.quickAnswerDetailButtonText}>
            자세한 결과 보기
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color={MALLO_COLORS.core.white}
          />
        </Pressable>

        <View
          style={[
            styles.quickAnswerNextGuide,

            isWeb
              ? styles.quickAnswerNextGuideWeb
              : styles.quickAnswerNextGuideNative,
          ]}
        >
          <Text style={styles.quickAnswerNextTitle}>
            다른 행동도 궁금한가요?
          </Text>

          <Text style={styles.quickAnswerNextDescription}>
            아래 입력창에서 바로 이어서 물어보세요.
          </Text>
        </View>
      </View>
    </View>
  );
}
