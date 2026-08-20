import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';
import { styles } from '@/features/ask/styles';
import { ACTION_LABELS, CONDITION_CONFIGS } from '@/features/check/data';
import type { QuickCheckDecision } from '@/features/recovery/types';
import type { AskResult } from '@/types/ask';

const DECISION_LABELS: Record<QuickCheckDecision, string> = {
  POSSIBLE: '가볍게 진행할 수 있어요',
  ADJUST: '조절해서 진행해요',
  POSTPONE: '오늘은 미루는 게 좋아요',
  CONNECT: '의료진의 확인이 필요해요',
};

const DECISION_COLORS: Record<QuickCheckDecision, string> = {
  POSSIBLE: MALLO_COLORS.semantic.possible,
  ADJUST: MALLO_COLORS.semantic.adjust,
  POSTPONE: MALLO_COLORS.semantic.postpone,
  CONNECT: MALLO_COLORS.semantic.connect,
};

export function AskMatchedResultState({
  onReset,
  question,
  result,
}: {
  onReset: () => void;
  question: string;
  result: AskResult;
}) {
  if (
    !result.action ||
    !result.context ||
    !result.decision ||
    result.guidance === null ||
    result.protocolRef === null
  ) {
    return null;
  }

  const config = CONDITION_CONFIGS[result.action];
  const contextValue = result.context[config.contextKey];
  const contextLabel = config.options.find(
    (option) => option.value === contextValue,
  )?.label;
  const decisionColor = DECISION_COLORS[result.decision];

  return (
    <View style={styles.stateContent}>
      <View style={styles.questionRecall}>
        <Text style={styles.questionRecallLabel}>오늘 내가 궁금한 것</Text>
        <Text style={styles.questionRecallText}>“{question}”</Text>
      </View>

      <View style={styles.matchedContextRow}>
        <View style={styles.matchedContextChip}>
          <Text style={styles.matchedContextText}>
            {ACTION_LABELS[result.action]}
          </Text>
        </View>

        {contextLabel ? (
          <View style={styles.matchedConditionChip}>
            <Text style={styles.matchedConditionText}>{contextLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.matchedResultSection}>
        <View
          style={[
            styles.matchedDecisionBadge,
            {
              borderColor: decisionColor,
              backgroundColor: `${decisionColor}14`,
            },
          ]}
        >
          <Text style={[styles.matchedDecisionText, { color: decisionColor }]}>
            {DECISION_LABELS[result.decision]}
          </Text>
        </View>

        <Text style={styles.matchedHeadline}>
          Recovery Protocol을 기준으로 확인했어요
        </Text>
      </View>

      <View style={styles.matchedSection}>
        <Text style={styles.matchedSectionTitle}>확인한 내용</Text>
        <Text style={styles.matchedBodyText}>{result.guidance}</Text>
      </View>

      <View style={styles.matchedSection}>
        <Text style={styles.matchedSectionTitle}>Recovery Protocol 근거</Text>
        <View style={styles.matchedProtocolCard}>
          <View style={styles.matchedProtocolIndex}>
            <Text style={styles.matchedProtocolIndexText}>1</Text>
          </View>
          <Text style={styles.matchedProtocolText}>검수된 Recovery Protocol</Text>
        </View>
      </View>

      {result.nextAction ? (
        <View style={styles.matchedSection}>
          <Text style={styles.matchedSectionTitle}>다음 행동</Text>
          <Text style={styles.matchedBodyText}>{result.nextAction}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onReset}
        style={({ pressed }) => [
          styles.resetButton,
          styles.matchedResetButton,
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
  );
}
