import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, Text, View } from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';
import { EXERCISE_OPTIONS } from '@/features/ask/data';
import { styles } from '@/features/ask/styles';
import type { FollowUpOption, RecoveryContext } from '@/features/ask/types';
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
          오늘 궁금한 행동을 물어보면 현재 회복 단계에 맞춰 확인해드려요.
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
        </View>

        {/* 안내 문구 */}
        <View style={styles.askGuideTextContainer}>
          <Text style={styles.askGuideTitle}>MALLO에게</Text>

          <Text style={styles.askGuideHighlight}>
            오늘 해도 되는지 물어보세요.
          </Text>

          <Text style={styles.askGuideSub}>
            운동, 세안, 스킨케어처럼 궁금한 행동을 물어볼 수 있어요.
          </Text>
        </View>

        {/* 아래 구분선 */}
        <View style={styles.askGuideDivider}>
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
        <Text style={styles.questionRecallLabel}>오늘 내가 궁금한 것</Text>

        <Text style={styles.questionRecallText}>“{question}”</Text>
      </View>

      <View style={styles.followUpSection}>
        {/* 추가로 확인할 조건 영역 */}
        <View style={styles.followUpMainContent}>
          <Text style={styles.followUpTitle}>
            어떤 <Text style={styles.followUpKeyword}>운동</Text>을 하려고
            하나요?
          </Text>

          <Text style={styles.followUpDescription}>
            현재 회복 단계에 맞춰 확인할 수 있도록 운동 강도를 알려주세요.
          </Text>

          {/* 운동 강도 선택 */}
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

          {/* 조건 확인 일러스트 */}
          <View style={styles.followUpIllustrationContainer}>
            <Image
              accessible={false}
              source={require('../../../assets/images/ask-condition-check.png')}
              style={styles.followUpIllustration}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 질문 다시 입력 */}
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
