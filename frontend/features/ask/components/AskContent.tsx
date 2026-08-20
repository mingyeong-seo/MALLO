import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';
import { styles } from '@/features/ask/styles';
import type { RecoveryContext } from '@/features/ask/types';
import { formatRecoveryDay } from '@/features/ask/utils';
import type { ConditionConfig, ConditionOption } from '@/features/check/types';

export function AskHeader({ onLogoPress }: { onLogoPress: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Recovery Journey 홈으로 이동"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onLogoPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Image
          accessible={false}
          source={require('../../../assets/images/mallo-logo-red.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </Pressable>
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

      <View style={styles.illustrationContainer}>
        <Image
          accessible={false}
          source={require('../../../assets/images/ask-recovery-actions.png')}
          style={styles.askIllustration}
          resizeMode="contain"
        />
      </View>

      <View style={styles.askGuide}>
        <View style={styles.askGuideDivider}>
          <View style={styles.askGuideLine} />
        </View>

        <View style={styles.askGuideTextContainer}>
          <Text style={styles.askGuideTitle}>MALLO에게</Text>

          <Text style={styles.askGuideHighlight}>
            오늘 해도 되는지 물어보세요.
          </Text>

          <Text style={styles.askGuideSub}>
            운동, 세안, 스킨케어처럼 궁금한 행동을 물어볼 수 있어요.
          </Text>
        </View>

        <View style={styles.askGuideDivider}>
          <View style={styles.askGuideLine} />
        </View>
      </View>
    </View>
  );
}

export function BehaviorFollowUpState({
  config,
  onOptionPress,
  onReset,
  question,
}: {
  config: ConditionConfig;
  onOptionPress: (option: ConditionOption) => void;
  onReset: () => void;
  question: string;
}) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  return (
    <View style={styles.stateContent}>
      <View style={styles.questionRecall}>
        <Text style={styles.questionRecallLabel}>오늘 내가 궁금한 것</Text>

        <Text style={styles.questionRecallText}>“{question}”</Text>
      </View>

      <View style={styles.followUpSection}>
        <View style={styles.followUpMainContent}>
          <Text style={styles.followUpTitle}>{config.question}</Text>

          <Text style={styles.followUpDescription}>{config.guide}</Text>

          <View style={styles.optionList}>
            {config.options.map((option) => (
              <Pressable
                accessibilityRole="button"
                key={option.label}
                onHoverIn={() => setHoveredOption(option.value)}
                onHoverOut={() => setHoveredOption(null)}
                onPress={() => onOptionPress(option)}
                style={({ pressed }) => [
                  styles.optionCard,
                  hoveredOption === option.value && styles.optionCardHovered,
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

          <View
            style={[
              styles.followUpIllustrationContainer,
              Platform.OS === 'web' && compactFollowUpStyles.illustrationContainer,
            ]}
          >
            <Image
              accessible={false}
              source={require('../../../assets/images/ask-condition-check.png')}
              style={[
                styles.followUpIllustration,
                Platform.OS === 'web' && compactFollowUpStyles.illustration,
              ]}
              resizeMode="contain"
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          style={({ pressed }) => [
            styles.resetButton,
            Platform.OS === 'web' && compactFollowUpStyles.resetButton,
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

const compactFollowUpStyles = StyleSheet.create({
  illustrationContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  illustration: {
    width: 136,
    height: 136,
  },
  resetButton: {
    marginTop: 10,
  },
});
