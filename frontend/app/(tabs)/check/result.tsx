import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { MALLO_COLORS } from '@/constants/colors';
import { MALLO_TEXT_STYLES } from '@/constants/text-styles';
import {
  MALLO_RADIUS,
  MALLO_SPACING,
  MALLO_TYPOGRAPHY,
} from '@/constants/theme';

type ActionResultDecision = 'POSSIBLE' | 'ADJUST' | 'POSTPONE' | 'CONNECT';

type ActionResult = {
  decision: ActionResultDecision;
  action: string;
  headline: string;
  reason: string;
  protocol_refs: string[];
  next_action: {
    type: string;
    label: string;
  };
};

type ActionResultRouteParams = {
  action?: string | string[];
  condition?: string | string[];
  decision?: string | string[];
};

type SemanticColor =
  (typeof MALLO_COLORS.semantic)[keyof typeof MALLO_COLORS.semantic];

// 개발용 임시 상태입니다. URL에 decision이 없을 때 사용할 variant입니다.
const DEV_DECISION: ActionResultDecision = 'CONNECT';

const ACTION_RESULT_MOCKS: Record<ActionResultDecision, ActionResult> = {
  POSSIBLE: {
    decision: 'POSSIBLE',
    action: '세안',
    headline: '지금은 자극을 줄여\n가볍게 세안할 수 있어요.',
    reason:
      '현재 회복 단계와 선택한 세안 조건을 기준으로 자극을 줄여 가볍게 진행할 수 있도록 안내해요.',
    protocol_refs: [
      'Recovery Protocol · 세안 강도 기준',
      'Recovery Protocol · 회복 단계 확인 기준',
    ],
    next_action: {
      type: 'APPLY_TO_PLAN',
      label: '오늘 계획에 반영하기',
    },
  },
  ADJUST: {
    decision: 'ADJUST',
    action: '운동',
    headline: '강도를 낮춰서 진행하는 편이 좋아요.',
    reason:
      '현재 DAY와 선택한 운동 강도를 기준으로 무리한 움직임보다 낮은 강도의 대안을 먼저 안내해요.',
    protocol_refs: [
      'Recovery Protocol · 운동 강도 기준',
      'Recovery Protocol · 열 자극 확인 기준',
    ],
    next_action: {
      type: 'VIEW_ALTERNATIVE',
      label: '저강도 대안 보기',
    },
  },
  POSTPONE: {
    decision: 'POSTPONE',
    action: '운동',
    headline: '오늘은 강도 높은 운동을 미루는 편이 좋아요.',
    reason:
      '현재 DAY와 선택한 운동 강도를 기준으로 격한 운동과 과도한 열 자극을 피하도록 안내해요.',
    protocol_refs: [
      'Recovery Protocol · 고강도 운동 기준',
      'Recovery Protocol · 회복 중 열 자극 기준',
    ],
    next_action: {
      type: 'CHECK_LATER',
      label: '나중에 다시 확인하기',
    },
  },
  CONNECT: {
    decision: 'CONNECT',
    action: '피부 상태 문의',
    headline: '의료진의 확인이 필요해요.',
    reason:
      '입력한 내용은 일반적인 행동 기준만으로 안내하기 어려워 의료진 확인 단계로 연결해요.',
    protocol_refs: [
      'Recovery Protocol · 의료진 확인 필요 항목',
      'MALLO Connect · 상담 연결 기준',
    ],
    next_action: {
      type: 'CONNECT_CLINICIAN',
      label: '의료진에게 문의하기',
    },
  },
};

const DEFAULT_CONDITIONS: Record<ActionResultDecision, string> = {
  POSSIBLE: '가볍게',
  ADJUST: '중간 강도',
  POSTPONE: '높은 강도',
  CONNECT: '상태 확인 필요',
};

const DECISION_COLORS: Record<ActionResultDecision, SemanticColor> = {
  POSSIBLE: MALLO_COLORS.semantic.possible,
  ADJUST: MALLO_COLORS.semantic.adjust,
  POSTPONE: MALLO_COLORS.semantic.postpone,
  CONNECT: MALLO_COLORS.semantic.connect,
};

const DECISION_LABELS: Record<ActionResultDecision, string> = {
  POSSIBLE: '가볍게 진행할 수 있어요',
  ADJUST: '조절해서 진행해요',
  POSTPONE: '오늘은 미루는 게 좋아요',
  CONNECT: '의료진의 확인이 필요해요',
};

export default function ActionResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<ActionResultRouteParams>();
  const [showMockFeedback, setShowMockFeedback] = useState(false);
  const decision = resolveDecision(getFirstParam(params.decision));
  const baseResult = ACTION_RESULT_MOCKS[decision];
  const routeAction = getFirstParam(params.action)?.trim();
  const routeCondition = getFirstParam(params.condition)?.trim();
  const result: ActionResult = {
    ...baseResult,
    action: routeAction || baseResult.action,
  };
  const condition = routeCondition || DEFAULT_CONDITIONS[decision];
  const semanticColor = DECISION_COLORS[decision];

  const handleNextAction = () => {
    if (decision === 'CONNECT') {
      router.push('/(tabs)/ask/consultation');
      return;
    }

    setShowMockFeedback(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader topInset={insets.top} />

        <View style={styles.content}>
          <View style={styles.actionSection}>
            <Text style={styles.eyebrow}>확인할 행동</Text>

            <View style={styles.actionTitleRow}>
              <Text style={styles.actionTitle}>{result.action}</Text>

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>조건</Text>
                <Text style={styles.conditionValue}>{condition}</Text>
              </View>
            </View>
          </View>

          <View style={styles.resultSection}>
            <DecisionBadge decision={result.decision} color={semanticColor} />
            <View
              style={[
                styles.decisionAccent,
                { backgroundColor: semanticColor },
              ]}
            />
            <Text style={styles.headline}>{result.headline}</Text>
            <Text style={styles.reason}>{result.reason}</Text>
          </View>

          <ProtocolReferences references={result.protocol_refs} />

          <View style={styles.nextActionSection}>
            <PrimaryActionButton
              label={result.next_action.label}
              onPress={handleNextAction}
            />
            {showMockFeedback ? (
              <Text
                accessibilityLiveRegion="polite"
                style={styles.mockFeedback}
              >
                현재 단계에서는 Mock 동작으로 처리되었습니다.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScreenHeader({ topInset }: { topInset: number }) {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/check');
  };

  return (
    <View style={styles.header}>
      <View
        style={[
          styles.systemNavigationRow,
          {
            minHeight: topInset + MIN_NAVIGATION_HEIGHT,
            paddingTop: topInset,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="이전 화면으로 돌아가기"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={MALLO_COLORS.support.charcoal}
          />
          <Text style={styles.backLabel}>Quick Check</Text>
        </Pressable>
      </View>

      <Image
        accessible
        accessibilityLabel="MALLO"
        source={require('../../../assets/images/mallo-logo-red.png')}
        style={styles.brandLogo}
        resizeMode="contain"
      />
    </View>
  );
}

const MIN_NAVIGATION_HEIGHT = 44;

function DecisionBadge({
  decision,
  color,
}: {
  decision: ActionResultDecision;
  color: SemanticColor;
}) {
  return (
    <View style={[styles.decisionBadge, { borderColor: color }]}>
      <View style={[styles.decisionDot, { backgroundColor: color }]} />
      <Text style={[styles.decisionText, { color }]}>
        {DECISION_LABELS[decision]}
      </Text>
    </View>
  );
}

function ProtocolReferences({ references }: { references: string[] }) {
  return (
    <View style={styles.protocolSection}>
      <Text style={styles.protocolTitle}>Recovery Protocol 근거</Text>
      <View style={styles.protocolCard}>
        {references.map((reference, index) => (
          <View key={reference} style={styles.protocolRow}>
            <View style={styles.protocolIndex}>
              <Text style={styles.protocolIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.protocolText}>{reference}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.protocolNote}>
        현재 화면은 개발용 Mock Recovery Protocol을 표시합니다.
      </Text>
    </View>
  );
}

function PrimaryActionButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
      <Ionicons
        name="arrow-forward"
        size={18}
        color={MALLO_COLORS.core.white}
      />
    </Pressable>
  );
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveDecision(value: string | undefined): ActionResultDecision {
  const normalizedValue = value?.toUpperCase();

  if (
    normalizedValue === 'POSSIBLE' ||
    normalizedValue === 'ADJUST' ||
    normalizedValue === 'POSTPONE' ||
    normalizedValue === 'CONNECT'
  ) {
    return normalizedValue;
  }

  return DEV_DECISION;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: MALLO_SPACING.xl,
    paddingBottom: MALLO_SPACING.xxl,
  },
  header: {
    alignItems: 'stretch',
    paddingBottom: MALLO_SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,

    ...(Platform.OS === 'ios' && {
      marginTop: -30,
    }),
  },
  systemNavigationRow: {
    justifyContent: 'center',
  },
  backButton: {
    minWidth: 96,
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -MALLO_SPACING.sm,
    paddingHorizontal: MALLO_SPACING.sm,
  },
  backLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  brandLogo: {
    width: 160,
    height: 36,
    alignSelf: 'center',
    marginTop: MALLO_SPACING.md,

    ...(Platform.OS === 'web' && {
      width: 132,
      height: 30,
    }),
  },
  content: {
    flexGrow: 1,
  },
  actionSection: {
    paddingVertical: MALLO_SPACING.xl,
  },
  eyebrow: {
    ...MALLO_TYPOGRAPHY.caption,
    marginBottom: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
    letterSpacing: 0.8,
  },
  actionTitle: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    color: MALLO_COLORS.core.ink,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.sm,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.md,
    flexWrap: 'wrap',
  },
  conditionLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  conditionValue: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.charcoal,
  },
  resultSection: {
    paddingTop: MALLO_SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },
  sectionLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    marginBottom: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
    letterSpacing: 0.8,
  },
  decisionBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.sm,
    borderWidth: 1,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },
  decisionDot: {
    width: 7,
    height: 7,
    borderRadius: MALLO_RADIUS.full,
  },
  decisionText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    letterSpacing: 0.6,
  },
  decisionAccent: {
    width: 32,
    height: 3,
    marginTop: MALLO_SPACING.xl,
    marginBottom: MALLO_SPACING.md,
    borderRadius: MALLO_RADIUS.full,
  },
  headline: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    color: MALLO_COLORS.core.ink,
    letterSpacing: -0.5,
  },
  reason: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.lg,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  protocolSection: {
    marginTop: MALLO_SPACING.xxl,
  },
  protocolTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    marginBottom: MALLO_SPACING.md,
    color: MALLO_COLORS.support.charcoal,
  },
  protocolCard: {
    gap: MALLO_SPACING.lg,
    padding: MALLO_SPACING.lg,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.md,
  },
  protocolIndex: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },
  protocolIndexText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  protocolText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    flex: 1,
    color: MALLO_COLORS.support.charcoal,
  },
  protocolNote: {
    ...MALLO_TYPOGRAPHY.caption,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  nextActionSection: {
    marginTop: MALLO_SPACING.xxl,
    paddingTop: MALLO_SPACING.xxl,
    paddingBottom: MALLO_SPACING.xxl * 2,
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,
    paddingHorizontal: MALLO_SPACING.lg,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },
  primaryButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },
  mockFeedback: {
    ...MALLO_TYPOGRAPHY.caption,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
