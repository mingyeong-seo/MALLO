import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { formatRecoveryDate } from '@/features/recovery/date';
import { formatElapsedDay } from '@/features/recovery/mock-data';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import type {
  PhotoAttachment,
  QuickCheckResult,
  QuickCheckDecision,
  RecoveryRecordPerformedStatus,
} from '@/features/recovery/types';
import { isApiError } from '@/services/api';
import { getCheckById } from '@/services/check';
import { getRecords } from '@/services/record';

const PERFORMED_LABELS: Record<RecoveryRecordPerformedStatus, string> = {
  ADJUSTED_DONE: '일부만 했어요',
  DONE: '했어요',
  NOT_DONE: '하지 않았어요',
};

type JournalLoadState = 'loading' | 'ready' | 'error';
const DAY_BUTTON_WIDTH = 42;
const DAY_BUTTON_GAP = MALLO_SPACING.sm;
const WEB_NAVIGATION_BUTTON_SIZE = 32;
const COLLAPSED_ACTION_LIMIT = 5;

const DECISION_LABELS: Record<QuickCheckDecision, string> = {
  POSSIBLE: '진행 가능',
  ADJUST: '조절 필요',
  POSTPONE: '오늘 미루기',
  CONNECT: '의료진 확인',
};

const DECISION_COLORS: Record<QuickCheckDecision, string> = {
  POSSIBLE: MALLO_COLORS.semantic.possible,
  ADJUST: MALLO_COLORS.semantic.adjust,
  POSTPONE: MALLO_COLORS.semantic.postpone,
  CONNECT: MALLO_COLORS.semantic.connect,
};

export default function RecoveryJournalScreen() {
  const params = useLocalSearchParams<{ day?: string; saved?: string }>();
  const insets = useSafeAreaInsets();
  const {
    findQuickCheck,
    findRecoveryRecord,
    hasSessionHydrationError,
    isHydratingSession,
    quickChecks,
    recoveryRecords,
    recoverySession,
    retrySessionHydration,
    saveQuickCheck,
    setRecoveryRecords,
  } = useRecoveryFlow();
  const quickChecksRef = useRef<QuickCheckResult[]>(quickChecks);
  const dayScrollRef = useRef<ScrollView>(null);
  const [loadState, setLoadState] = useState<JournalLoadState>('loading');
  const [loadNotice, setLoadNotice] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedActionsDay, setExpandedActionsDay] = useState<number | null>(
    null,
  );

  const currentDay = recoverySession?.elapsedDay ?? 0;
  const parsedRouteDay = Number(params.day);
  const routeDay = Number.isFinite(parsedRouteDay)
    ? Math.max(Math.trunc(parsedRouteDay), 0)
    : null;

  const [selectedElapsedDay, setSelectedElapsedDay] = useState(
    routeDay ?? currentDay,
  );

  useEffect(() => {
    quickChecksRef.current = quickChecks;
  }, [quickChecks]);

  useEffect(() => {
    if (isHydratingSession) {
      setLoadState('loading');
      setLoadNotice('');
      return;
    }

    const sessionId = recoverySession?.sessionId;

    if (!sessionId) {
      setLoadState('error');
      setLoadNotice('Recovery Session을 확인하지 못했어요.');
      return;
    }

    let active = true;

    const loadJournal = async () => {
      setLoadState('loading');
      setLoadNotice('');

      try {
        const records = await getRecords(sessionId);

        if (!active) {
          return;
        }

        setRecoveryRecords(records);

        const cachedCheckIds = new Set(
          quickChecksRef.current.map((check) => check.checkId),
        );
        const missingCheckIds = [
          ...new Set(
            records.flatMap((record) =>
              record.actions.map((action) => action.checkId),
            ),
          ),
        ].filter((checkId) => !cachedCheckIds.has(checkId));
        const checkResponses = await Promise.allSettled(
          missingCheckIds.map((checkId) => getCheckById(checkId, sessionId)),
        );

        if (!active) {
          return;
        }

        let unresolvedCount = 0;

        checkResponses.forEach((response) => {
          if (response.status === 'fulfilled') {
            if (response.value.status === 'MATCHED') {
              saveQuickCheck(response.value.result);
            } else {
              unresolvedCount += 1;
            }
          } else {
            unresolvedCount += 1;
          }
        });

        if (unresolvedCount > 0) {
          setLoadNotice('일부 Quick Check 정보를 불러오지 못했어요.');
        }

        setLoadState('ready');
      } catch (error) {
        if (!active) {
          return;
        }

        setLoadState('error');
        setLoadNotice(
          isApiError(error)
            ? error.message
            : '회복 기록을 불러오지 못했어요.',
        );
      }
    };

    void loadJournal();

    return () => {
      active = false;
    };
  }, [
    isHydratingSession,
    recoverySession?.sessionId,
    reloadToken,
    saveQuickCheck,
    setRecoveryRecords,
  ]);

  useEffect(() => {
    if (!recoverySession) {
      return;
    }

    setSelectedElapsedDay(
      routeDay === null ? currentDay : Math.min(routeDay, currentDay),
    );
  }, [currentDay, recoverySession, routeDay]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    requestAnimationFrame(() => {
      dayScrollRef.current?.scrollTo({
        animated: true,
        x: selectedElapsedDay * (DAY_BUTTON_WIDTH + DAY_BUTTON_GAP),
        y: 0,
      });
    });
  }, [selectedElapsedDay]);

  useEffect(() => {
    setExpandedActionsDay(null);
  }, [selectedElapsedDay]);

  const selectedRecord = findRecoveryRecord(selectedElapsedDay);
  const actionsExpanded = expandedActionsDay === selectedElapsedDay;
  const visibleActions = selectedRecord
    ? actionsExpanded
      ? selectedRecord.actions
      : selectedRecord.actions.slice(0, COLLAPSED_ACTION_LIMIT)
    : [];
  const hiddenActionCount = Math.max(
    (selectedRecord?.actions.length ?? 0) - COLLAPSED_ACTION_LIMIT,
    0,
  );
  const isFuture = selectedElapsedDay > currentDay;
  const canEdit = selectedElapsedDay === currentDay;
  const floatingTabClearance =
    MALLO_SPACING.xxl * 2 +
    Math.max(insets.bottom, MALLO_SPACING.md) +
    MALLO_SPACING.lg;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: floatingTabClearance },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Recovery Journey 홈으로 이동"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.replace('/(tabs)/journey/home')}
            style={({ pressed }) => [
              styles.logoButton,
              pressed && styles.pressed,
            ]}
          >
            <Image
              accessible={false}
              resizeMode="contain"
              source={require('../../../assets/images/mallo-logo-red.png')}
              style={styles.logo}
            />
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>회복 기록</Text>
          <Text style={styles.description}>
            DAY별로 남긴 회복 기록을 모아볼 수 있어요.
          </Text>
        </View>

        <View
          style={[
            styles.dayListWrapper,
            Platform.OS === 'web' && styles.dayListWrapperWeb,
          ]}
        >
          {Platform.OS === 'web' ? (
            <DayNavigationButton
              direction="previous"
              disabled={selectedElapsedDay === 0}
              onPress={() =>
                setSelectedElapsedDay((day) => Math.max(day - 1, 0))
              }
            />
          ) : null}

          <ScrollView
            contentContainerStyle={styles.dayList}
            horizontal
            ref={dayScrollRef}
            showsHorizontalScrollIndicator={false}
            style={
              Platform.OS === 'web' ? styles.dayListScrollWeb : undefined
            }
          >
            {Array.from(
              { length: Math.max(7, currentDay + 1) },
              (_, elapsedDay) => {
                const selected = elapsedDay === selectedElapsedDay;
                const future = elapsedDay > currentDay;
                const recorded = recoveryRecords.some(
                  (record) => record.elapsedDay === elapsedDay,
                );

                return (
                  <Pressable
                    accessibilityLabel={`DAY ${elapsedDay + 1}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: future, selected }}
                    disabled={future}
                    key={elapsedDay}
                    onPress={() => setSelectedElapsedDay(elapsedDay)}
                    style={({ pressed }) => [
                      styles.dayButton,
                      selected && styles.dayButtonSelected,
                      future && styles.dayButtonDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {elapsedDay + 1}
                    </Text>
                    {recorded && !selected ? (
                      <Ionicons
                        accessible={false}
                        color={MALLO_COLORS.support.secondaryTextGray}
                        name="checkmark"
                        size={11}
                        style={styles.recordIndicator}
                      />
                    ) : null}
                  </Pressable>
                );
              },
            )}
          </ScrollView>

          {Platform.OS === 'web' ? (
            <DayNavigationButton
              direction="next"
              disabled={selectedElapsedDay === currentDay}
              onPress={() =>
                setSelectedElapsedDay((day) =>
                  Math.min(day + 1, currentDay),
                )
              }
            />
          ) : null}
        </View>

        <View style={styles.selectedContext}>
          <View>
            <Text style={styles.contextDay}>
              {formatElapsedDay(selectedElapsedDay)}
            </Text>
            {recoverySession ? (
              <Text style={styles.contextDate}>
                {formatRecoveryDate(
                  recoverySession.procedureDate,
                  selectedElapsedDay,
                )}
              </Text>
            ) : null}
          </View>
          <Text style={styles.contextProcedure}>
            {recoverySession?.procedureName ?? 'REJURAN'}
          </Text>
        </View>

        {params.saved === 'true' && selectedRecord ? (
          <Text accessibilityLiveRegion="polite" style={styles.savedMessage}>
            오늘 기록을 저장했어요.
          </Text>
        ) : null}

        {loadState === 'loading' ? (
          <Text accessibilityLiveRegion="polite" style={styles.loadNotice}>
            회복 기록을 불러오고 있어요.
          </Text>
        ) : null}

        {loadNotice ? (
          <Text accessibilityLiveRegion="polite" style={styles.loadNotice}>
            {loadNotice}
          </Text>
        ) : null}

        {loadState === 'error' ? (
          <Pressable
            accessibilityLabel="회복 기록 다시 불러오기"
            accessibilityRole="button"
            onPress={() => {
              if (!recoverySession || hasSessionHydrationError) {
                retrySessionHydration();
                return;
              }

              setReloadToken((current) => current + 1);
            }}
            style={({ pressed }) => [
              styles.loadRetry,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.loadRetryText}>다시 불러오기</Text>
          </Pressable>
        ) : null}

        {selectedRecord ? (
          <View style={styles.recordDetail}>
            {selectedRecord.actions.length ? (
              <>
                <Text style={styles.detailLabel}>오늘 확인한 행동</Text>

                <View style={styles.actionList}>
                  {visibleActions.map((actionRecord) => {
                    const quickCheck = findQuickCheck(actionRecord.checkId);

                    if (!quickCheck) {
                      return (
                        <View
                          key={actionRecord.checkId}
                          style={styles.actionRecord}
                        >
                          <Text style={styles.actionRecordTitle}>
                            Quick Check 정보를 불러오지 못했어요.
                          </Text>
                          <Text style={styles.performedValue}>
                            {PERFORMED_LABELS[actionRecord.performedStatus]}
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <View
                        key={actionRecord.checkId}
                        style={styles.actionRecord}
                      >
                        <View style={styles.actionRecordCopy}>
                          <Text style={styles.actionRecordTitle}>
                            {quickCheck.contextLabel}
                          </Text>
                          <Text
                            style={[
                              styles.actionDecision,
                              {
                                color: DECISION_COLORS[quickCheck.decision],
                              },
                            ]}
                          >
                            MALLO 안내 · {DECISION_LABELS[quickCheck.decision]}
                          </Text>
                        </View>

                        <Text style={styles.performedValue}>
                          {PERFORMED_LABELS[actionRecord.performedStatus]}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {selectedRecord.actions.length > COLLAPSED_ACTION_LIMIT ? (
                  <Pressable
                    accessibilityLabel={
                      actionsExpanded
                        ? '행동 목록 접기'
                        : `행동 ${hiddenActionCount}개 더 보기`
                    }
                    accessibilityRole="button"
                    accessibilityState={{ expanded: actionsExpanded }}
                    onPress={() =>
                      setExpandedActionsDay(
                        actionsExpanded ? null : selectedElapsedDay,
                      )
                    }
                    style={({ pressed }) => [
                      styles.actionListToggle,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.actionListToggleText}>
                      {actionsExpanded
                        ? '접기 ↑'
                        : `${hiddenActionCount}개 더 보기 ↓`}
                    </Text>
                  </Pressable>
                ) : null}

                <View style={styles.divider} />
              </>
            ) : null}

            <Text style={styles.detailLabel}>회복 메모</Text>
            <Text style={styles.memo}>
              {selectedRecord.memo || '남긴 메모가 없어요.'}
            </Text>

            <View style={styles.divider} />

            <Text style={styles.detailLabel}>사진</Text>

            {selectedRecord.attachments.length ? (
              <View style={styles.photoGrid}>
                {selectedRecord.attachments.map((attachment) => {
                  return (
                    <JournalPhoto
                      attachment={attachment}
                      key={attachment.clientId}
                      sessionId={recoverySession?.sessionId}
                    />
                  );
                })}
              </View>
            ) : (
              <Text style={styles.memo}>남긴 사진이 없어요.</Text>
            )}

            {canEdit ? (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/journey/record',
                    params: { day: String(selectedElapsedDay) },
                  })
                }
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>
                  오늘 기록 수정하기
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Image
              accessibilityLabel="회복 기록 없음"
              resizeMode="contain"
              source={require('../../../assets/images/mallo-record-empty.png')}
              style={styles.emptyImage}
            />
            <Text style={styles.emptyTitle}>
              {isFuture
                ? '아직 기록할 수 없는 DAY예요'
                : '아직 남긴 기록이 없어요'}
            </Text>
            <Text style={styles.emptyDescription}>
              {isFuture
                ? '회복 DAY가 되면 기록을 남길 수 있어요.'
                : '오늘의 회복을 간단히 남겨보세요.'}
            </Text>

            {canEdit ? (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/journey/record',
                    params: { day: String(selectedElapsedDay) },
                  })
                }
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>오늘 기록하기</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function JournalPhoto({
  attachment,
  sessionId,
}: {
  attachment: PhotoAttachment;
  sessionId?: string;
}) {
  const sourceUri = attachment.photoUrl ?? attachment.localUri;
  const [webObjectUri, setWebObjectUri] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);

    if (Platform.OS !== 'web' || !sourceUri) {
      return;
    }

    if (!attachment.photoUrl) {
      setWebObjectUri(sourceUri);
      return;
    }

    if (!sessionId) {
      setWebObjectUri(null);
      setHasError(true);
      return;
    }

    let active = true;
    let objectUri: string | null = null;

    const loadPhoto = async () => {
      try {
        const response = await fetch(attachment.photoUrl as string, {
          headers: { 'X-Session-Id': sessionId },
        });

        if (!response.ok) {
          throw new Error(`Photo request failed: ${response.status}`);
        }

        const blob = await response.blob();
        objectUri = URL.createObjectURL(blob);

        if (active) {
          setWebObjectUri(objectUri);
        }
      } catch {
        if (active) {
          setWebObjectUri(null);
          setHasError(true);
        }
      }
    };

    void loadPhoto();

    return () => {
      active = false;

      if (objectUri) {
        URL.revokeObjectURL(objectUri);
      }
    };
  }, [attachment.photoUrl, sessionId, sourceUri]);

  const displayUri = Platform.OS === 'web' ? webObjectUri : sourceUri;
  const nativeSource =
    displayUri && Platform.OS !== 'web'
      ? {
          headers:
            attachment.photoUrl && sessionId
              ? { 'X-Session-Id': sessionId }
              : undefined,
          uri: displayUri,
        }
      : displayUri
        ? { uri: displayUri }
        : null;

  return (
    <View style={styles.photoPreview}>
      {nativeSource && !hasError ? (
        <Image
          accessible={false}
          onError={() => setHasError(true)}
          resizeMode="cover"
          source={nativeSource}
          style={styles.photoImage}
        />
      ) : (
        <Ionicons
          name="image-outline"
          size={24}
          color={MALLO_COLORS.core.red}
        />
      )}
    </View>
  );
}

function DayNavigationButton({
  direction,
  disabled,
  onPress,
}: {
  direction: 'previous' | 'next';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={direction === 'previous' ? '이전 DAY 보기' : '다음 DAY 보기'}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.webNavigationButton,
        disabled && styles.webNavigationButtonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Ionicons
        color={MALLO_COLORS.support.charcoal}
        name={direction === 'previous' ? 'chevron-back' : 'chevron-forward'}
        size={17}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },
  content: {
    paddingHorizontal: MALLO_SPACING.xl,
  },
  header: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },
  logoButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 112,
    height: 25,
  },
  intro: {
    marginTop: MALLO_SPACING.xl,
  },
  title: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    color: MALLO_COLORS.core.ink,
  },
  description: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  dayListWrapper: {
    position: 'relative',
  },
  dayListWrapperWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
  },
  dayList: {
    gap: DAY_BUTTON_GAP,
    paddingVertical: MALLO_SPACING.xl,
  },
  dayListScrollWeb: {
    flex: 1,
    minWidth: 0,
  },
  dayButton: {
    width: DAY_BUTTON_WIDTH,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
  },
  dayButtonSelected: {
    borderColor: MALLO_COLORS.core.red,
    backgroundColor: MALLO_COLORS.support.redTint,
  },
  dayButtonDisabled: {
    opacity: 0.35,
  },
  webNavigationButton: {
    width: WEB_NAVIGATION_BUTTON_SIZE,
    height: WEB_NAVIGATION_BUTTON_SIZE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },
  webNavigationButtonDisabled: {
    opacity: 0.35,
  },
  dayText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  dayTextSelected: {
    color: MALLO_COLORS.core.red,
  },
  recordIndicator: {
    marginTop: 2,
  },
  selectedContext: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: MALLO_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },
  contextDay: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    color: MALLO_COLORS.core.ink,
  },
  contextProcedure: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  contextDate: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  savedMessage: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.semantic.possible,
  },
  loadNotice: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  loadRetry: {
    alignSelf: 'flex-start',
    marginTop: MALLO_SPACING.sm,
  },
  loadRetryText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.red,
  },
  recordDetail: {
    marginTop: MALLO_SPACING.xl,
  },
  detailLabel: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  actionList: {
    marginTop: MALLO_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },
  actionRecord: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },
  actionRecordCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionRecordTitle: {
    ...MALLO_TYPOGRAPHY.body,
    fontWeight: '600',
    color: MALLO_COLORS.core.ink,
  },
  actionDecision: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    fontWeight: '500',
  },
  performedValue: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    flexShrink: 0,
    fontWeight: '600',
    textAlign: 'right',
    color: MALLO_COLORS.support.charcoal,
  },
  actionListToggle: {
    alignSelf: 'center',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MALLO_SPACING.md,
  },
  actionListToggleText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    fontWeight: '600',
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  divider: {
    height: 1,
    marginVertical: MALLO_SPACING.lg,
    backgroundColor: MALLO_COLORS.support.mistGray,
  },
  memo: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.charcoal,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.md,
  },
  photoPreview: {
    width: 120,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.redTint,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: MALLO_RADIUS.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: MALLO_SPACING.md,
  },
  emptyImage: {
    width: 156,
    height: 134,
  },
  emptyTitle: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.core.ink,
  },
  emptyDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    marginTop: MALLO_SPACING.xs,
    textAlign: 'center',
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  primaryButton: {
    minHeight: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },
  primaryButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MALLO_SPACING.xl,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
  },
  secondaryButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.red,
  },
  pressed: {
    opacity: 0.68,
  },
});
