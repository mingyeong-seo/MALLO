import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MALLO_COLORS } from '@/constants/colors';
import { MALLO_TEXT_STYLES } from '@/constants/text-styles';
import {
  MALLO_RADIUS,
  MALLO_SPACING,
  MALLO_TYPOGRAPHY,
} from '@/constants/theme';
import { ACTION_LABELS } from '@/features/check/data';
import { CheckRequestState } from '@/features/check/components/CheckRequestState';
import { formatElapsedDay } from '@/features/recovery/mock-data';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import type {
  QuickCheckDecision,
  QuickCheckResult,
} from '@/features/recovery/types';
import { getTodayChecks } from '@/services/check';

type ActionStatus = 'complete' | 'check';

type ActionPlanItem = {
  action: string;
  checkId?: string;
  color?: string;
  description: string;
  detail?: string;
  label: string;
  status: ActionStatus;
};

type ActionPlanGroup = {
  color: string;
  items: ActionPlanItem[];
  title: string;
};

type RecoveryContext = {
  procedureName: string;
  recoveryDay: number;
};

const DECISION_USER_LABELS: Record<QuickCheckDecision, string> = {
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

export default function TodayPlanScreen() {
  const { quickChecks, recoverySession, setQuickChecks } = useRecoveryFlow();
  const [showAllResults, setShowAllResults] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [loadAttempt, setLoadAttempt] = useState(0);
  const recovery: RecoveryContext = {
    procedureName: recoverySession?.procedureName ?? 'REJURAN',
    recoveryDay: recoverySession?.elapsedDay ?? 0,
  };
  const visibleResults = showAllResults ? quickChecks : quickChecks.slice(0, 3);
  const actionPlanGroups = createActionPlanGroups(visibleResults);
  const hasResults = quickChecks.length > 0;
  const hasMore = quickChecks.length > 3;

  useEffect(() => {
    let cancelled = false;

    const loadTodayChecks = async () => {
      setLoadState('loading');

      try {
        const checks = await getTodayChecks(recoverySession?.sessionId);

        if (cancelled) return;

        setQuickChecks(
          checks.flatMap((check) =>
            check.status === 'MATCHED' ? [check.result] : [],
          ),
        );
        setLoadState('ready');
      } catch {
        if (!cancelled) {
          setLoadState('error');
        }
      }
    };

    void loadTodayChecks();

    return () => {
      cancelled = true;
    };
  }, [loadAttempt, recoverySession?.sessionId, setQuickChecks]);

  const handleActionPress = (action: string) => {
    router.push({
      pathname: '/(tabs)/check/condition',
      params: {
        action,
        source: 'today-plan',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TodayPlanHeader />

        <View style={styles.contextSection}>
          <View style={styles.contextChip}>
            <Text style={styles.contextText}>{recovery.procedureName}</Text>
          </View>

          <View style={styles.contextChip}>
            <Text style={styles.contextText}>
              {formatElapsedDay(recovery.recoveryDay)}
            </Text>
          </View>
        </View>

        <View style={styles.introSection}>
          <View style={styles.introTitleRow}>
            <Ionicons
              name="sparkles-outline"
              size={20}
              color={MALLO_COLORS.core.red}
            />

            <Text style={styles.screenTitle}>오늘의 회복 가이드</Text>
          </View>

          <Text style={styles.screenDescription}>
            오늘 바로 진행할 수 있는 항목과 추가 확인이 필요한 항목을
            확인해보세요.
          </Text>
        </View>

        {loadState === 'loading' ? (
          <View style={styles.planSection}>
            <CheckRequestState
              description="오늘 확인한 Quick Check 결과를 불러오고 있어요."
              title="오늘의 회복 가이드를 확인하고 있어요"
              tone="loading"
            />
          </View>
        ) : loadState === 'error' ? (
          <View style={styles.planSection}>
            <CheckRequestState
              description="네트워크 연결을 확인하고 다시 시도해주세요."
              onPrimaryPress={() =>
                setLoadAttempt((attempt) => attempt + 1)
              }
              primaryLabel="다시 시도하기"
              title="결과를 불러오지 못했어요"
              tone="error"
            />
          </View>
        ) : hasResults ? (
          <View style={styles.planSection}>
            {actionPlanGroups.map((group) => (
              <ActionGroup
                key={group.title}
                group={group}
                onActionPress={handleActionPress}
              />
            ))}

            {hasMore ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowAllResults((current) => !current)}
                style={({ pressed }) => [
                  styles.moreResultsButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.moreResultsText}>
                  {showAllResults
                    ? '최근 3개만 보기'
                    : '오늘 확인한 전체 기록 보기'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <EmptyActionPlan />
        )}

        <View style={styles.actionSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quick Check"
            onPress={() => router.push('/(tabs)/check/quick')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Quick Check</Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color={MALLO_COLORS.core.white}
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TodayPlanHeader() {
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

function ActionGroup({
  group,
  onActionPress,
}: {
  group: ActionPlanGroup;
  onActionPress: (action: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const isCompleteGroup = group.items.every(
    (item) => item.status === 'complete',
  );

  const hoverMessage = isCompleteGroup
    ? '항목을 눌러 MALLO 설명을 확인해보세요.'
    : '클릭해서 필요한 조건을 확인해보세요.';

  const groupBackgroundColor =
    Platform.OS !== 'web' && group.color === MALLO_COLORS.semantic.adjust
      ? '#FCF8F1'
      : `${group.color}12`;

  return (
    <View style={styles.group}>
      <View style={styles.groupHeading}>
        <View style={[styles.groupDot, { backgroundColor: group.color }]} />

        <View style={styles.groupHeadingCopy}>
          <Text style={styles.groupTitle}>{group.title}</Text>

          {Platform.OS !== 'web' && !isCompleteGroup ? (
            <Text style={styles.swipeGuideText}>
              오른쪽으로 밀어 필요한 조건을 확인해보세요.
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.actionListShadow,
          {
            backgroundColor: groupBackgroundColor,
          },
        ]}
      >
        <View
          onPointerEnter={() => {
            if (Platform.OS === 'web') {
              setIsHovered(true);
            }
          }}
          onPointerLeave={() => {
            if (Platform.OS === 'web') {
              setIsHovered(false);
            }
          }}
          style={[
            styles.actionList,
            {
              backgroundColor: groupBackgroundColor,
              borderColor: `${group.color}28`,
            },
          ]}
        >
          {Platform.OS === 'web' && isHovered ? (
            <View pointerEvents="none" style={styles.hoverGuide}>
              <Ionicons
                name={
                  isCompleteGroup
                    ? 'chatbubble-ellipses-outline'
                    : 'information-circle-outline'
                }
                size={13}
                color={MALLO_COLORS.core.red}
              />

              <Text style={styles.hoverGuideText}>{hoverMessage}</Text>
            </View>
          ) : null}

          {group.items.map((item, index) => {
            const showDivider = index < group.items.length - 1;

            if (item.status === 'complete') {
              return (
                <CompletedActionRow
                  key={item.checkId ?? item.action}
                  item={item}
                  showDivider={showDivider}
                />
              );
            }

            return (
              <SwipeActionRow
                key={item.action}
                item={item}
                color={group.color}
                showDivider={showDivider}
                onConfirm={() => onActionPress(item.action)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function CompletedActionRow({
  item,
  showDivider,
}: {
  item: ActionPlanItem;
  showDivider: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View
      style={[styles.completedItem, showDivider && styles.actionRowDivider]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.label} 설명 ${isOpen ? '닫기' : '보기'}`}
        onPress={() => {
          if (item.checkId) {
            router.push({
              pathname: '/(tabs)/check/result',
              params: { checkId: item.checkId },
            });
            return;
          }

          setIsOpen((prev) => !prev);
        }}
        style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
      >
        <View style={styles.actionCopy}>
          <View style={styles.completeTag}>
            <Ionicons
              name="checkmark"
              size={12}
              color={item.color ?? MALLO_COLORS.semantic.possible}
            />

            <Text
              style={[
                styles.completeTagText,
                item.color ? { color: item.color } : null,
              ]}
            >
              {item.description}
            </Text>
          </View>

          <Text style={styles.actionLabel}>{item.label}</Text>
        </View>

        <Ionicons
          name={
            item.checkId
              ? 'chevron-forward'
              : isOpen
                ? 'chevron-up'
                : 'chevron-down'
          }
          size={17}
          color={MALLO_COLORS.support.secondaryTextGray}
        />
      </Pressable>

      {isOpen && item.detail ? (
        <View style={styles.malloExplanation}>
          <Image
            source={require('../../../assets/images/mallo-chat-icon.png')}
            style={styles.malloExplanationIcon}
            resizeMode="contain"
          />

          <View style={styles.malloExplanationCopy}>
            <Text style={styles.malloExplanationName}>MALLO</Text>

            <Text style={styles.malloExplanationText}>{item.detail}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function EmptyActionPlan() {
  return (
    <View style={styles.emptyPlan}>
      <Image
        accessibilityLabel="Quick Check 결과 없음"
        resizeMode="contain"
        source={require('../../../assets/images/mallo-record-empty.png')}
        style={styles.emptyPlanImage}
      />
      <Text style={styles.emptyPlanTitle}>아직 확인한 행동이 없어요</Text>
      <Text style={styles.emptyPlanDescription}>
        Quick Check에서 오늘 궁금한 행동을 하나씩 확인해보세요.
      </Text>
    </View>
  );
}

function createActionPlanGroups(
  results: QuickCheckResult[],
): ActionPlanGroup[] {
  const decisionOrder: QuickCheckDecision[] = [
    'POSSIBLE',
    'ADJUST',
    'POSTPONE',
    'CONNECT',
  ];
  const titles: Record<QuickCheckDecision, string> = {
    POSSIBLE: '오늘 진행할 수 있어요',
    ADJUST: '조절해서 진행해요',
    POSTPONE: '오늘은 미루는 게 좋아요',
    CONNECT: '의료진 확인이 필요해요',
  };

  return decisionOrder.flatMap((decision) => {
    const matchingResults = results.filter(
      (result) => result.decision === decision,
    );

    if (matchingResults.length === 0) {
      return [];
    }

    return [
      {
        color: DECISION_COLORS[decision],
        title: titles[decision],
        items: matchingResults.map((result) => ({
          action: result.action,
          checkId: result.checkId,
          color: DECISION_COLORS[decision],
          description: DECISION_USER_LABELS[decision],
          detail: result.reason,
          label: `${ACTION_LABELS[result.action]} · ${result.contextLabel}`,
          status: 'complete' as const,
        })),
      },
    ];
  });
}

function SwipeActionRow({
  item,
  color,
  showDivider,
  onConfirm,
}: {
  item: ActionPlanItem;
  color: string;
  showDivider: boolean;
  onConfirm: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const [isPressed, setIsPressed] = useState(false);

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const completeSwipe = () => {
    Animated.timing(translateX, {
      toValue: 120,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(0);
      setIsPressed(false);
      onConfirm();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (Platform.OS === 'web') {
          return false;
        }

        return (
          gestureState.dx > 8 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },

      onPanResponderGrant: () => {
        setIsPressed(true);
      },

      onPanResponderMove: (_, gestureState) => {
        const movement = Math.max(0, Math.min(gestureState.dx, 120));

        translateX.setValue(movement);
      },

      onPanResponderRelease: (_, gestureState) => {
        setIsPressed(false);

        if (gestureState.dx >= 70) {
          completeSwipe();
          return;
        }

        resetPosition();
      },

      onPanResponderTerminate: () => {
        setIsPressed(false);
        resetPosition();
      },

      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  if (Platform.OS === 'web') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.label}, ${item.description}`}
        onPress={onConfirm}
        style={({ pressed }) => [
          styles.swipeRow,
          showDivider && styles.actionRowDivider,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.actionCopy}>
          <View style={styles.actionStatusTag}>
            <Text style={styles.actionStatusTagText}>
              {shortenStatusLabel(item.description)}
            </Text>
          </View>

          <Text style={styles.actionLabel}>{item.label}</Text>
        </View>

        <View style={styles.webCheckAction}>
          <Ionicons
            name="chevron-forward"
            size={17}
            color={MALLO_COLORS.support.secondaryTextGray}
          />
        </View>
      </Pressable>
    );
  }

  return (
    <View
      style={[styles.swipeContainer, showDivider && styles.actionRowDivider]}
    >
      <View
        style={[
          styles.swipeBackground,
          {
            backgroundColor: '#FCF8F1',
          },
        ]}
      >
        <Text style={[styles.swipeBackgroundText, { color }]}>조건 확인</Text>

        <Ionicons name="arrow-forward" size={18} color={color} />
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.swipeForeground,
          {
            backgroundColor: '#FCF8F1',
            opacity: isPressed ? 0.72 : 1,
            transform: [{ translateX }],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.label}, ${item.description}`}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          style={styles.nativeActionPressable}
        >
          <View style={styles.actionCopy}>
            <View style={styles.actionStatusTag}>
              <Text style={styles.actionStatusTagText}>
                {shortenStatusLabel(item.description)}
              </Text>
            </View>

            <Text style={styles.actionLabel}>{item.label}</Text>
          </View>

          <View style={styles.swipeHint}>
            <Ionicons name="chevron-forward" size={18} color={color} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function shortenStatusLabel(description: string) {
  const statusMap: Record<string, string> = {
    '강도 확인 필요': '강도 확인',
    '성분 확인 필요': '성분 확인',
    '제품과 방법 확인 필요': '방법 확인',
    '노출 정도 확인 필요': '노출 확인',
  };

  return statusMap[description] ?? description;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },

  scrollContent: {
    paddingHorizontal: MALLO_SPACING.xl,

    paddingTop: Platform.OS === 'web' ? MALLO_SPACING.lg : MALLO_SPACING.md,

    paddingBottom:
      Platform.OS === 'web' ? MALLO_SPACING.xxl * 4 : MALLO_SPACING.xxl * 5,
  },

  header: {
    minHeight: 54,
    justifyContent: 'center',
    paddingBottom: MALLO_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },

  headerLogo: {
    width: 112,
    height: 25,
    alignSelf: 'center',
  },

  contextSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: MALLO_SPACING.sm,
    paddingTop: MALLO_SPACING.lg,
  },

  contextChip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },

  contextText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.charcoal,
  },

  introSection: {
    marginTop: MALLO_SPACING.xl,
  },

  introTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
  },

  screenTitle: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    color: MALLO_COLORS.core.ink,
  },

  screenDescription: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  planSection: {
    marginTop: MALLO_SPACING.xl,
    gap: MALLO_SPACING.xl,
  },

  moreResultsButton: {
    alignSelf: 'center',
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.sm,
  },

  moreResultsText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.red,
  },

  emptyPlan: {
    alignItems: 'center',
    paddingHorizontal: MALLO_SPACING.lg,
    paddingTop: 28,
  },

  emptyPlanImage: {
    width: 205,
    height: 177,
  },

  emptyPlanTitle: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.core.ink,
  },

  emptyPlanDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    textAlign: 'center',
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  group: {
    width: '100%',
    position: 'relative',
  },

  groupHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MALLO_SPACING.sm,
    marginBottom: MALLO_SPACING.xs,
  },

  groupDot: {
    width: 7,
    height: 7,
    marginTop: 5,
    borderRadius: MALLO_RADIUS.full,
  },

  groupHeadingCopy: {
    flex: 1,
  },

  swipeGuideText: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: 3,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  groupTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },

  actionListShadow: {
    width: '100%',
    borderRadius: MALLO_RADIUS.md,

    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 3px 10px rgba(26, 26, 26, 0.07)',
        }
      : {
          shadowColor: MALLO_COLORS.core.ink,
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }),
  },

  actionList: {
    width: '100%',
    position: 'relative',

    overflow: Platform.OS === 'web' ? 'visible' : 'hidden',

    paddingHorizontal: MALLO_SPACING.sm,
    borderWidth: 1,
    borderRadius: MALLO_RADIUS.md,
  },

  hoverGuide: {
    position: 'absolute',
    zIndex: 30,

    top: -32,
    right: 0,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderWidth: 1,
    borderColor: 'rgba(181, 58, 43, 0.12)',
    borderRadius: MALLO_RADIUS.full,

    backgroundColor: 'rgba(255, 255, 255, 0.96)',

    shadowColor: MALLO_COLORS.core.ink,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },

  hoverGuideText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  completedItem: {
    width: '100%',
  },

  actionRow: {
    minHeight: Platform.OS === 'web' ? 64 : 56,

    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MALLO_SPACING.sm,
  },

  actionRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },

  actionCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
  },

  completeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: 'rgba(76, 143, 91, 0.08)',
  },

  completeTagText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.semantic.possible,
  },

  actionStatusTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },

  actionStatusTagText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  actionLabel: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    flexShrink: 1,
    fontWeight: '600',
    color: MALLO_COLORS.support.charcoal,
  },

  malloExplanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MALLO_SPACING.sm,

    marginBottom: MALLO_SPACING.sm,
    paddingHorizontal: MALLO_SPACING.sm,
    paddingTop: MALLO_SPACING.sm,
    paddingBottom: MALLO_SPACING.md,

    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },

  malloExplanationIcon: {
    width: 28,
    height: 28,
    borderRadius: MALLO_RADIUS.full,
  },

  malloExplanationCopy: {
    flex: 1,
  },

  malloExplanationName: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    marginBottom: 3,
    color: MALLO_COLORS.core.red,
  },

  malloExplanationText: {
    ...MALLO_TYPOGRAPHY.caption,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  swipeContainer: {
    minHeight: 56,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },

  swipeBackground: {
    ...StyleSheet.absoluteFillObject,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: MALLO_SPACING.xs,

    paddingHorizontal: MALLO_SPACING.md,
  },

  swipeBackgroundText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
  },

  swipeForeground: {
    minHeight: 56,
    width: '100%',
  },

  nativeActionPressable: {
    minHeight: 56,
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: MALLO_SPACING.sm,
  },

  swipeHint: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: MALLO_SPACING.sm,
  },

  swipeRow: {
    minHeight: Platform.OS === 'web' ? 64 : 56,

    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MALLO_SPACING.sm,
  },

  webCheckAction: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: MALLO_SPACING.sm,
  },

  actionSection: {
    marginTop: MALLO_SPACING.xxl,
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
    opacity: 0.68,
  },
});
