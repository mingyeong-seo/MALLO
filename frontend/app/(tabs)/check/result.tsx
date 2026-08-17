import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
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

// URL에 decision이 없을 때 개발용으로 사용할 기본 상태
const DEV_DECISION: ActionResultDecision = 'CONNECT';

const ACTION_RESULT_MOCKS: Record<ActionResultDecision, ActionResult> = {
  POSSIBLE: {
    decision: 'POSSIBLE',
    action: '세안',
    headline: '가볍게 세안해도 괜찮아요.',
    reason: '현재 회복 단계에서는 자극을 줄여 가볍게 진행하는 게 좋아요.',

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
    headline: '운동 강도를 낮추는 게 좋아요.',
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
    headline: '오늘은 고강도 운동을 미루는 게 좋아요.',
    reason:
      '현재 DAY와 선택한 운동 강도를 기준으로 격한 운동과 과도한 열 자극을 피하도록 안내해요.',

    detail: {
      title: '다시 확인할 시점',
      text: 'DAY 5 이후 다시 확인해 주세요. (DAY 5 임시 Mock)',
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
    primaryActionLabel: '오늘 행동 목록으로',
  },

  ADJUST: {
    primaryActionLabel: '오늘 행동 목록으로',
  },

  POSTPONE: {
    primaryActionLabel: '오늘 행동 목록으로',
  },

  CONNECT: {
    primaryActionLabel: '의료진에게 문의하기',
  },
};

// API 연결 전 임시 Recovery Context
const MOCK_RESULT_CONTEXT = {
  procedureName: 'REJURAN',
  recoveryDay: 1,
} as const;

const DETAIL_REVEAL_DELAY = 400;
const DETAIL_STAGGER_DELAY = 140;
const DETAIL_ANIMATION_DURATION = 280;

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

  const [showScrollHint, setShowScrollHint] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const currentScrollY = useRef(0);

  const updateScrollHint = () => {
    const maxScrollY = contentHeight.current - viewportHeight.current;

    // 콘텐츠가 화면 안에 전부 들어오면 화살표 없음
    if (maxScrollY <= 8) {
      setShowScrollHint(false);
      return;
    }

    const isAtBottom = currentScrollY.current >= maxScrollY - 16;

    setShowScrollHint(!isAtBottom);
  };
  /*
   * 상세 정보 표시 여부
   *
   * 처음에는 MALLO Result Reveal만 보여주고,
   * 일정 시간이 지나면 상세 내용을 렌더링한다.
   */
  const [showDetail, setShowDetail] = useState(false);

  /*
   * 상세 영역별 Fade / Slide 애니메이션
   */
  const explanationAnimation = useRef(new Animated.Value(0)).current;

  const decisionDetailAnimation = useRef(new Animated.Value(0)).current;

  const protocolAnimation = useRef(new Animated.Value(0)).current;

  const actionAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setShowDetail(false);
    setShowScrollHint(false);

    explanationAnimation.setValue(0);
    decisionDetailAnimation.setValue(0);
    protocolAnimation.setValue(0);
    actionAnimation.setValue(0);

    const timer = setTimeout(() => {
      setShowDetail(true);

      requestAnimationFrame(() => {
        const animations = [
          createRevealAnimation(explanationAnimation),

          ...(result.detail
            ? [createRevealAnimation(decisionDetailAnimation)]
            : []),

          createRevealAnimation(protocolAnimation),
          createRevealAnimation(actionAnimation),
        ];

        Animated.stagger(DETAIL_STAGGER_DELAY, animations).start(() => {
          requestAnimationFrame(() => {
            updateScrollHint();
          });
        });
      });
    }, DETAIL_REVEAL_DELAY);

    return () => clearTimeout(timer);
  }, [
    decision,
    result.detail,
    explanationAnimation,
    decisionDetailAnimation,
    protocolAnimation,
    actionAnimation,
  ]);

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
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={(event) => {
          viewportHeight.current = event.nativeEvent.layout.height;

          updateScrollHint();
        }}
        onContentSizeChange={(_, height) => {
          contentHeight.current = height;

          updateScrollHint();
        }}
        onScroll={(event) => {
          currentScrollY.current = event.nativeEvent.contentOffset.y;

          updateScrollHint();
        }}
      >
        <ScreenHeader topInset={insets.top} />

        <View style={styles.content}>
          {/* 현재 시술 / DAY / 행동 Context */}
          <ContextSection
            action={result.action}
            condition={condition}
            procedureName={MOCK_RESULT_CONTEXT.procedureName}
            recoveryDay={MOCK_RESULT_CONTEXT.recoveryDay}
            color={semanticColor}
          />

          {/* ASK MALLO에서 들어온 경우 사용자가 입력한 질문 */}
          {isFromAsk && routeQuestion ? (
            <QuestionRecall question={routeQuestion} color={semanticColor} />
          ) : null}

          {/* 먼저 보여주는 MALLO 결과 요약 */}
          <ResultReveal
            action={result.action}
            condition={condition}
            headline={result.headline}
            decision={decision}
            color={semanticColor}
          />

          {/* 시간차로 나타나는 상세 결과 */}
          {showDetail ? (
            <View style={styles.detailSections}>
              {/* 1. 이유 */}
              <Animated.View style={getRevealStyle(explanationAnimation)}>
                <ExplanationSection reason={result.reason} />
              </Animated.View>

              {/* 2. ADJUST / POSTPONE 추가 안내 */}
              {result.detail ? (
                <Animated.View style={getRevealStyle(decisionDetailAnimation)}>
                  <DecisionDetail
                    color={semanticColor}
                    title={result.detail.title}
                    text={result.detail.text}
                  />
                </Animated.View>
              ) : null}

              {/* 3. Protocol 근거 */}
              <Animated.View style={getRevealStyle(protocolAnimation)}>
                <ProtocolReferences references={result.protocol_refs} />
              </Animated.View>

              {/* 4. 기록 / 다음 행동 */}
              <Animated.View style={getRevealStyle(actionAnimation)}>
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
              </Animated.View>
            </View>
          ) : null}
        </View>
      </ScrollView>
      {showScrollHint && (
        <Pressable
          style={styles.scrollHint}
          onPress={() => {
            const nextY = currentScrollY.current + viewportHeight.current * 0.7;

            scrollRef.current?.scrollTo({
              y: nextY,
              animated: true,
            });
          }}
        >
          <Ionicons
            name="chevron-down"
            size={20}
            color={MALLO_COLORS.core.red}
          />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

/*
 * 상세 섹션 하나에 적용할 공통 등장 애니메이션
 *
 * opacity: 0 → 1
 * translateY: 8 → 0
 */
function createRevealAnimation(animation: Animated.Value) {
  return Animated.timing(animation, {
    toValue: 1,
    duration: DETAIL_ANIMATION_DURATION,
    useNativeDriver: Platform.OS !== 'web',
  });
}

function getRevealStyle(animation: Animated.Value) {
  return {
    opacity: animation,

    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };
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
          {
            borderColor: color,
          },
        ]}
      >
        <Text
          style={[
            styles.contextLabel,
            {
              color,
            },
          ]}
        >
          조건
        </Text>

        <Text
          style={[
            styles.contextValue,
            {
              color,
            },
          ]}
        >
          {condition}
        </Text>
      </View>
    </View>
  );
}

function QuestionRecall({
  question,
  color,
}: {
  question: string;
  color: SemanticColor;
}) {
  return (
    <View
      style={[
        styles.questionRecall,
        {
          borderLeftColor: color,
        },
      ]}
    >
      <Text
        style={[
          styles.questionRecallLabel,
          {
            color,
          },
        ]}
      >
        오늘 내가 궁금한 것
      </Text>

      <Text style={styles.questionRecallText}>“{question}”</Text>
    </View>
  );
}

function ResultReveal({
  action,
  condition,
  headline,
  decision,
  color,
}: {
  action: string;
  condition: string;
  headline: string;
  decision: ActionResultDecision;
  color: SemanticColor;
}) {
  const isConnect = decision === 'CONNECT';
  const showCharacter = !isConnect;

  const formattedHeadline = formatResultHeadline(headline);
  return (
    <View style={styles.resultReveal}>
      {/* MALLO가 이해한 질문 Context */}
      <View
        style={[
          styles.resultRevealSummary,
          isConnect && styles.resultRevealSummaryConnect,
        ]}
      >
        {/* CONNECT에서는 캐릭터를 표시하지 않음 */}
        {showCharacter ? (
          <Image
            accessible={false}
            source={require('../../../assets/images/mallo-character-default.png')}
            style={styles.resultRevealCharacter}
            resizeMode="contain"
          />
        ) : null}

        <View
          style={[
            styles.resultRevealCopy,
            isConnect && styles.resultRevealCopyConnect,
          ]}
        >
          <Text
            style={[
              styles.resultRevealEyebrow,
              isConnect && styles.resultRevealConnectTitle,
            ]}
          >
            {isConnect
              ? '의료진 확인이 필요한 내용이에요'
              : 'MALLO가 이렇게 정리했어요'}
          </Text>

          <View style={styles.resultRevealContextRow}>
            <Text style={styles.resultRevealContext}>{action}</Text>

            <View
              style={[
                styles.resultRevealContextDot,
                isConnect && {
                  backgroundColor: MALLO_COLORS.semantic.connect,
                },
              ]}
            />

            <Text style={styles.resultRevealContext}>{condition}</Text>
          </View>
        </View>
      </View>

      {/* 핵심 결과 */}
      {!isConnect ? (
        <View style={styles.resultRevealAnswer}>
          <Text
            style={[
              styles.resultRevealHeadline,
              {
                backgroundColor: getDecisionTint(decision),
              },
            ]}
          >
            {formattedHeadline}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function formatResultHeadline(headline: string) {
  const normalized = headline.trim();

  // 짧은 문장은 한 줄 그대로 사용
  if (normalized.length <= 18) {
    return normalized;
  }

  const words = normalized.split(' ');

  // 띄어쓰기가 없는 경우는 원문 그대로
  if (words.length <= 1) {
    return normalized;
  }

  const totalLength = normalized.length;
  const targetLength = totalLength / 2;

  let currentLength = 0;
  let bestIndex = 1;
  let smallestDifference = Infinity;

  for (let i = 0; i < words.length - 1; i += 1) {
    currentLength += words[i].length;

    // 단어 사이 공백 길이까지 포함
    if (i > 0) {
      currentLength += 1;
    }

    const difference = Math.abs(targetLength - currentLength);

    if (difference < smallestDifference) {
      smallestDifference = difference;
      bestIndex = i + 1;
    }
  }

  const firstLine = words.slice(0, bestIndex).join(' ');
  const secondLine = words.slice(bestIndex).join(' ');

  return `${firstLine}\n${secondLine}`;
}

function getDecisionTint(decision: ActionResultDecision) {
  switch (decision) {
    case 'POSSIBLE':
      return 'rgba(76, 143, 91, 0.08)';

    case 'ADJUST':
      return 'rgba(213, 162, 58, 0.10)';

    case 'POSTPONE':
      return 'rgba(122, 127, 135, 0.09)';

    case 'CONNECT':
      return 'rgba(219, 92, 77, 0.08)';

    default:
      return MALLO_COLORS.support.warmGray;
  }
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
      <View
        style={[
          styles.detailIndicator,
          {
            backgroundColor: color,
          },
        ]}
      />

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

  questionRecall: {
    marginTop: MALLO_SPACING.md,
    marginBottom: MALLO_SPACING.lg,

    minHeight: 64,

    justifyContent: 'center',

    borderLeftWidth: 3,

    paddingLeft: MALLO_SPACING.md,
    paddingRight: MALLO_SPACING.md,
    paddingVertical: 10,

    backgroundColor:
      Platform.OS === 'web'
        ? 'rgba(180, 68, 51, 0.055)'
        : 'rgba(180, 68, 51, 0.035)',
  },

  questionRecallLabel: {
    ...MALLO_TYPOGRAPHY.caption,

    fontSize: 14,
    lineHeight: 20,

    color: MALLO_COLORS.core.red,
  },

  questionRecallText: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,

    marginTop: MALLO_SPACING.xs,

    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',

    color: MALLO_COLORS.support.charcoal,
  },

  /*
   * RESULT REVEAL
   */

  resultReveal: {
    marginTop: Platform.OS === 'web' ? 20 : 18,
  },

  resultRevealSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 26,
  },

  resultRevealSummaryConnect: {
    justifyContent: 'flex-start',
  },

  resultRevealCopyConnect: {
    width: '100%',
    alignItems: 'flex-start',
  },

  resultRevealCharacter: {
    width: 140,
    height: 140,
  },

  resultRevealCopy: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  resultRevealEyebrow: {
    ...MALLO_TYPOGRAPHY.body,

    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',

    color: MALLO_COLORS.core.red,
  },

  /*
   * 기존 Pill 대신 텍스트로
   * MALLO가 이해한 조건을 표시
   */

  resultRevealContextRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 10,
  },

  resultRevealContext: {
    ...MALLO_TYPOGRAPHY.secondaryBody,

    fontWeight: '500',

    color: MALLO_COLORS.support.secondaryTextGray,
  },

  resultRevealContextDot: {
    width: 4,
    height: 4,

    marginHorizontal: 9,

    borderRadius: MALLO_RADIUS.full,

    backgroundColor: MALLO_COLORS.support.progress,
  },

  resultRevealAnswer: {
    width: '100%',
    alignItems: 'center',

    marginTop: 12,

    paddingHorizontal: 8,
  },

  resultRevealPrefix: {
    ...MALLO_TYPOGRAPHY.body,

    marginBottom: 4,

    color: MALLO_COLORS.support.secondaryTextGray,

    textAlign: 'center',
  },

  resultRevealHeadline: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,

    fontSize: 24,
    lineHeight: 34,
    fontWeight: '700',

    color: MALLO_COLORS.core.ink,
    textAlign: 'center',

    maxWidth: '100%',
    flexShrink: 1,

    paddingHorizontal: 8,
    paddingVertical: 2,

    borderRadius: 3,
  },
  /*
   * 상세 결과
   */

  detailSections: {
    width: '100%',

    marginTop: 18,
    paddingTop: 16,

    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },

  explanationSection: {
    marginTop: 0,
  },

  explanationTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,

    marginBottom: MALLO_SPACING.md,

    color: MALLO_COLORS.support.charcoal,
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

  /*
   * Protocol
   */

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

  /*
   * 기록 / 다음 행동
   */

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
    marginTop: MALLO_SPACING.lg,

    paddingTop: MALLO_SPACING.md,
    paddingBottom: MALLO_SPACING.xxl,
  },

  connectNextActionSection: {
    marginTop: MALLO_SPACING.xl,
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

  scrollHintButton: {
    position: 'absolute',

    right: 24,
    bottom: Platform.OS === 'web' ? 96 : 110,

    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.full,

    backgroundColor: MALLO_COLORS.core.white,

    shadowColor: MALLO_COLORS.core.ink,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,

    elevation: 4,

    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 8px rgba(26, 26, 26, 0.08)',
        }
      : {}),
  },

  scrollHint: {
    position: 'absolute',

    right: 22,
    bottom: Platform.OS === 'web' ? 96 : 108,

    width: 38,
    height: 38,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.full,

    backgroundColor: 'rgba(244, 241, 237, 0.88)',

    zIndex: 999,

    shadowColor: MALLO_COLORS.core.ink,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,

    elevation: 20,

    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 8px rgba(26, 26, 26, 0.07)',
          cursor: 'pointer',
        }
      : {}),
  },

  resultRevealConnectTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',

    color: MALLO_COLORS.semantic.connect,

    textAlign: 'left',
  },
});
