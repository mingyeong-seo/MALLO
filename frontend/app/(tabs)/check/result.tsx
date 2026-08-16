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

  detail?: {
    title: string;
    text: string;
  };

  next_action: {
    type: string;
    label: string;
  };
};

type ActionResultRouteParams = {
  action?: string | string[];
  condition?: string | string[];
  decision?: string | string[];
  question?: string | string[];
  source?: string | string[];
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

    detail: {
      title: '조정 방법',
      text: '가벼운 산책 등 낮은 강도로 조정해 주세요.',
    },

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

    detail: {
      title: '다시 확인할 시점',
      text: 'DAY 5 이후 다시 확인해 주세요.(DAY 5 임시 Mock)',
    },

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

const PROTOCOL_DETAIL_MAP: Record<string, string> = {
  'Recovery Protocol · 세안 강도 기준':
    '현재 회복 단계에서는 피부 자극을 줄이기 위해 세안 강도를 낮춰 안내합니다.',

  'Recovery Protocol · 회복 단계 확인 기준':
    '현재 회복 일차와 시술 후 경과를 기준으로 적용 가능한 행동 범위를 확인합니다.',

  'Recovery Protocol · 운동 강도 기준':
    '회복 단계에 따라 무리가 될 수 있는 운동 강도를 확인하고 낮은 강도의 활동을 우선 안내합니다.',

  'Recovery Protocol · 열 자극 확인 기준':
    '운동이나 환경으로 체온이 크게 오를 수 있는 조건을 함께 확인합니다.',

  'Recovery Protocol · 고강도 운동 기준':
    '회복 중에는 강한 운동으로 인한 자극 가능성을 확인해 진행 여부를 안내합니다.',

  'Recovery Protocol · 회복 중 열 자극 기준':
    '회복 단계에서 과도한 열 자극이 발생할 수 있는 행동인지 확인합니다.',

  'Recovery Protocol · 의료진 확인 필요 항목':
    '일반적인 생활 행동 기준만으로 판단하기 어려운 내용은 의료진 확인 단계로 연결합니다.',

  'MALLO Connect · 상담 연결 기준':
    '의료적 판단이 필요한 질문은 MALLO가 직접 판단하지 않고 의료진 상담으로 연결합니다.',
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

const DECISION_PRESENTATION = {
  POSSIBLE: {
    label: '지금 진행해도 괜찮아요',
    primaryActionLabel: '오늘 행동 목록으로',
  },
  ADJUST: {
    label: '조정해서 진행해 주세요',
    primaryActionLabel: '오늘 행동 목록으로',
  },
  POSTPONE: {
    label: '오늘은 미루는 게 좋아요',
    primaryActionLabel: '오늘 행동 목록으로',
  },
  CONNECT: {
    label: '의료진 확인이 필요해요',
    primaryActionLabel: '의료진에게 문의하기',
  },
};

// API 연동 전 S08 표시용 Context Mock입니다.
// decision/action/condition 계약과 분리해 실제 세션 데이터로 교체할 수 있게 합니다.
const MOCK_RESULT_CONTEXT = {
  procedureName: 'REJURAN',
  recoveryDay: 1,
} as const;

export default function ActionResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<ActionResultRouteParams>();
  const decision = resolveDecision(getFirstParam(params.decision));
  const baseResult = ACTION_RESULT_MOCKS[decision];
  const routeAction = getFirstParam(params.action)?.trim();
  const routeCondition = getFirstParam(params.condition)?.trim();
  const routeQuestion = getFirstParam(params.question)?.trim();
  const routeSource = getFirstParam(params.source)?.trim();

  const isFromAsk = routeSource === 'ask-mallo';

  const result: ActionResult = {
    ...baseResult,
    action: routeAction || baseResult.action,
  };
  const condition = routeCondition || DEFAULT_CONDITIONS[decision];
  const semanticColor = DECISION_COLORS[decision];
  const presentation = DECISION_PRESENTATION[decision];

  const handleNextAction = () => {
    if (decision === 'CONNECT') {
      router.push('/(tabs)/ask/consultation');
      return;
    }

    router.push('/(tabs)/check');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader topInset={insets.top} />

        <View style={styles.content}>
          <ContextSection
            action={result.action}
            condition={condition}
            procedureName={MOCK_RESULT_CONTEXT.procedureName}
            recoveryDay={MOCK_RESULT_CONTEXT.recoveryDay}
            color={semanticColor}
          />

          {isFromAsk && routeQuestion ? (
            <QuestionRecall question={routeQuestion} />
          ) : null}

          <Text style={styles.resultSectionLabel}>확인 결과</Text>

          <ResultSummary
            color={semanticColor}
            decision={decision}
            label={presentation.label}
          />

          <ExplanationSection reason={result.reason} />

          {result.detail ? (
            <DecisionDetail
              color={semanticColor}
              title={result.detail.title}
              text={result.detail.text}
            />
          ) : null}

          <ProtocolReferences references={result.protocol_refs} />

          {decision !== 'CONNECT' ? <RecoveryRecordAction /> : null}

          <View
            style={[
              styles.nextActionSection,
              decision === 'CONNECT' && styles.connectNextActionSection,
            ]}
          >
            <PrimaryActionButton
              label={presentation.primaryActionLabel}
              onPress={handleNextAction}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScreenHeader({ topInset }: { topInset: number }) {
  return (
    <View style={styles.header}>
      <View
        style={{
          minHeight:
            Platform.OS === 'web' ? 0 : topInset + MIN_NAVIGATION_HEIGHT,
          paddingTop: Platform.OS === 'web' ? 0 : topInset,
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="MALLO 홈으로 이동"
        onPress={() => router.replace('/(tabs)/journey')}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Image
          accessible={false}
          source={require('../../../assets/images/mallo-logo-red.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

const MIN_NAVIGATION_HEIGHT = 44;

function ContextSection({
  action,
  condition,
  procedureName,
  recoveryDay,
  color,
}: {
  action: string;
  condition: string;
  procedureName: string;
  recoveryDay: number;
  color: SemanticColor;
}) {
  return (
    <View accessibilityLabel="현재 확인 정보" style={styles.contextSection}>
      <View style={styles.contextChip}>
        <Text style={styles.contextText}>
          {procedureName} · DAY {recoveryDay}
        </Text>
      </View>
      <View style={styles.contextChip}>
        <Text style={styles.contextText}>{action}</Text>
      </View>
      <View
        style={[
          styles.contextChip,
          styles.conditionChip,
          { borderColor: color },
        ]}
      >
        <Text style={[styles.contextLabel, { color }]}>조건</Text>
        <Text style={[styles.contextValue, { color }]}>{condition}</Text>
      </View>
    </View>
  );
}
function QuestionRecall({ question }: { question: string }) {
  return (
    <View style={styles.questionRecall}>
      <Text style={styles.questionRecallLabel}>내 질문</Text>
      <Text style={styles.questionRecallText}>“{question}”</Text>
    </View>
  );
}
function getResultIcon(decision: ActionResultDecision) {
  switch (decision) {
    case 'POSSIBLE':
      return 'checkmark';

    case 'ADJUST':
      return 'options-outline';

    case 'POSTPONE':
      return 'time-outline';

    case 'CONNECT':
      return 'chatbubble-ellipses-outline';

    default:
      return 'checkmark';
  }
}

function ResultSummary({
  color,
  decision,
  label,
}: {
  color: SemanticColor;
  decision: ActionResultDecision;
  label: string;
}) {
  const iconName = getResultIcon(decision);

  return (
    <View style={styles.resultSummary}>
      <View style={[styles.resultAccent, { backgroundColor: color }]} />

      <View style={styles.resultSummaryContent}>
        <View style={styles.resultDecisionRow}>
          <View
            style={[
              styles.resultIcon,
              {
                borderColor: color,
              },
            ]}
          >
            <Ionicons name={iconName} size={16} color={color} />
          </View>

          <Text style={styles.resultDecision}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

function ExplanationSection({ reason }: { reason: string }) {
  return (
    <View style={styles.explanationSection}>
      <Text style={styles.explanationTitle}>왜 이런 결과인가요?</Text>

      <Text style={styles.reason} lineBreakStrategyIOS="hangul-word">
        {reason}
      </Text>
    </View>
  );
}

function DecisionDetail({
  color,
  title,
  text,
}: {
  color: SemanticColor;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.decisionDetail}>
      <View style={[styles.detailIndicator, { backgroundColor: color }]} />

      <View style={styles.detailContent}>
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.detailText}>{text}</Text>
      </View>
    </View>
  );
}

function ProtocolReferences({ references }: { references: string[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <View style={styles.protocolSection}>
      <Text style={styles.protocolTitle}>Recovery Protocol 근거</Text>

      <View style={styles.protocolCard}>
        {references.map((reference, index) => {
          const isExpanded = expandedIndex === index;
          const detail = PROTOCOL_DETAIL_MAP[reference];

          return (
            <View key={reference}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${reference} 상세 보기`}
                onPress={() => setExpandedIndex(isExpanded ? null : index)}
                style={({ pressed }) => [
                  styles.protocolRow,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.protocolIndex}>
                  <Text style={styles.protocolIndexText}>{index + 1}</Text>
                </View>

                <Text style={styles.protocolText}>{reference}</Text>

                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={MALLO_COLORS.support.secondaryTextGray}
                />
              </Pressable>

              {isExpanded ? (
                <View style={styles.protocolDetail}>
                  <Text
                    style={styles.protocolDetailText}
                    lineBreakStrategyIOS="hangul-word"
                  >
                    {detail ?? '상세 Recovery Protocol 기준을 확인 중입니다.'}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={styles.protocolNote}>
        현재 화면은 개발용 Mock Recovery Protocol을 표시합니다.
      </Text>
    </View>
  );
}

function RecoveryRecordAction() {
  return (
    <Pressable
      accessibilityLabel="오늘 기록하기, 선택 사항"
      accessibilityRole="button"
      onPress={() => router.push('/(tabs)/journey/record')}
      style={({ pressed }) => [styles.recordAction, pressed && styles.pressed]}
    >
      <View>
        <Text style={styles.recordTitle}>오늘 기록하기</Text>
        <Text style={styles.recordMeta}>선택 사항</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={MALLO_COLORS.support.secondaryTextGray}
      />
    </Pressable>
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
    paddingBottom: MALLO_SPACING.xxl * 2,
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

  brandLogo: {
    width: 112,
    height: 25,
    alignSelf: 'center',
    marginTop: Platform.OS === 'web' ? MALLO_SPACING.lg : MALLO_SPACING.md,
  },
  content: {
    flexGrow: 1,
  },
  contextSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: MALLO_SPACING.sm,
    paddingVertical: MALLO_SPACING.md,
  },
  questionRecall: {
    marginBottom: MALLO_SPACING.lg,
    paddingVertical: MALLO_SPACING.sm,
  },

  questionRecallLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.core.red,
  },

  questionRecallText: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    fontWeight: '600',
    color: MALLO_COLORS.support.charcoal,
  },
  contextChip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.xs,
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  contextText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.charcoal,
  },
  contextLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  contextValue: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.charcoal,
  },
  conditionChip: {
    borderWidth: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },

  resultSectionLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    marginBottom: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
    letterSpacing: 0.4,
  },
  resultSummary: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  resultAccent: {
    width: 4,
  },
  resultSummaryContent: {
    flex: 1,
    paddingHorizontal: MALLO_SPACING.lg,
    paddingLeft: MALLO_SPACING.lg,
    paddingVertical: MALLO_SPACING.lg,
  },
  resultDecisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
  },

  resultIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },

  resultDecision: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    color: MALLO_COLORS.core.ink,
    letterSpacing: -0.5,
  },

  explanationSection: {
    marginTop: Platform.OS === 'web' ? MALLO_SPACING.xl : MALLO_SPACING.lg,
  },
  explanationTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    marginBottom: MALLO_SPACING.md,
    color: MALLO_COLORS.support.charcoal,
  },
  headline: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    color: MALLO_COLORS.core.ink,
  },
  reason: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  decisionDetail: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: MALLO_SPACING.md,
    marginTop: Platform.OS === 'web' ? MALLO_SPACING.lg : MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
  },
  detailIndicator: {
    width: 3,
    borderRadius: MALLO_RADIUS.full,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },
  detailText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  protocolSection: {
    marginTop: Platform.OS === 'web' ? MALLO_SPACING.xl : MALLO_SPACING.lg,
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
    minHeight: 40,
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
  protocolDetail: {
    marginTop: MALLO_SPACING.sm,
    marginLeft: 40,
    marginRight: MALLO_SPACING.sm,
    paddingTop: MALLO_SPACING.sm,
    paddingBottom: MALLO_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },

  protocolDetailText: {
    ...MALLO_TYPOGRAPHY.caption,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    color: MALLO_COLORS.support.secondaryTextGray,
    lineHeight: 20,
  },
  protocolNote: {
    ...MALLO_TYPOGRAPHY.caption,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  connectNextActionSection: {
    marginTop: MALLO_SPACING.xxl + MALLO_SPACING.md,
  },
  recordAction: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: MALLO_SPACING.xl,
    paddingVertical: MALLO_SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
  },
  recordTitle: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    color: MALLO_COLORS.support.charcoal,
  },
  recordMeta: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  nextActionSection: {
    marginTop: Platform.OS === 'web' ? 'auto' : MALLO_SPACING.lg,

    paddingTop: Platform.OS === 'web' ? MALLO_SPACING.xl : 0,

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

  pressed: {
    opacity: 0.72,
  },
});
