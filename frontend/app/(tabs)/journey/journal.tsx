import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image,
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
import { ACTION_LABELS } from '@/features/check/data';
import { formatElapsedDay } from '@/features/recovery/mock-data';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import type {
  QuickCheckDecision,
  RecoveryRecordPerformedStatus,
} from '@/features/recovery/types';

const PERFORMED_LABELS: Record<RecoveryRecordPerformedStatus, string> = {
  DONE: '했어요',
  NOT_DONE: '하지 않았어요',
};

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
    recoveryRecords,
    recoverySession,
  } = useRecoveryFlow();

  const currentDay = recoverySession?.elapsedDay ?? 0;
  const initialDay = Number.isFinite(Number(params.day))
    ? Math.min(Math.max(Number(params.day), 0), 6)
    : currentDay;

  const [selectedDay, setSelectedDay] = useState(initialDay);
  const selectedRecord = findRecoveryRecord(selectedDay);
  const isFuture = selectedDay > currentDay;
  const canEdit = selectedDay === currentDay;
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

        <ScrollView
          contentContainerStyle={styles.dayList}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {Array.from({ length: Math.max(7, currentDay + 1) }, (_, day) => {
            const selected = day === selectedDay;
            const future = day > currentDay;
            const recorded = recoveryRecords.some(
              (record) => record.elapsedDay === day,
            );

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: future, selected }}
                disabled={future}
                key={day}
                onPress={() => setSelectedDay(day)}
                style={({ pressed }) => [
                  styles.dayButton,
                  selected && styles.dayButtonSelected,
                  future && styles.dayButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.dayText, selected && styles.dayTextSelected]}
                >
                  {day + 1}
                </Text>
                {recorded ? <View style={styles.recordDot} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.selectedContext}>
          <Text style={styles.contextDay}>{formatElapsedDay(selectedDay)}</Text>
          <Text style={styles.contextProcedure}>
            {recoverySession?.procedureName ?? 'REJURAN'}
          </Text>
        </View>

        {params.saved === 'true' && selectedRecord ? (
          <Text accessibilityLiveRegion="polite" style={styles.savedMessage}>
            오늘 기록을 저장했어요.
          </Text>
        ) : null}

        {selectedRecord ? (
          <View style={styles.recordDetail}>
            {selectedRecord.actions.length ? (
              <>
                <Text style={styles.detailLabel}>오늘 확인한 행동</Text>

                <View style={styles.actionList}>
                  {selectedRecord.actions.map((actionRecord) => {
                    const quickCheck = findQuickCheck(actionRecord.checkId);

                    if (!quickCheck) {
                      return null;
                    }

                    return (
                      <View
                        key={actionRecord.checkId}
                        style={styles.actionRecord}
                      >
                        <View style={styles.actionRecordCopy}>
                          <Text style={styles.actionRecordTitle}>
                            {ACTION_LABELS[quickCheck.action]} ·{' '}
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
                            {DECISION_LABELS[quickCheck.decision]}
                          </Text>
                        </View>

                        <Text style={styles.performedValue}>
                          {PERFORMED_LABELS[actionRecord.performedStatus]}
                        </Text>
                      </View>
                    );
                  })}
                </View>

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
                {selectedRecord.attachments.map((attachment, index) => (
                  <View key={attachment} style={styles.photoPreview}>
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={MALLO_COLORS.core.red}
                    />
                    <Text style={styles.photoNumber}>{index + 1}</Text>
                  </View>
                ))}
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
                    params: { day: String(selectedDay) },
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
                    params: { day: String(selectedDay) },
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
  dayList: {
    gap: MALLO_SPACING.sm,
    paddingVertical: MALLO_SPACING.xl,
  },
  dayButton: {
    width: 42,
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
  dayText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  dayTextSelected: {
    color: MALLO_COLORS.core.red,
  },
  recordDot: {
    width: 4,
    height: 4,
    marginTop: 2,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.red,
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
  savedMessage: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.semantic.possible,
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
  },
  actionRecordTitle: {
    ...MALLO_TYPOGRAPHY.body,
    fontWeight: '600',
    color: MALLO_COLORS.core.ink,
  },
  actionDecision: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    fontWeight: '600',
  },
  performedValue: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    fontWeight: '600',
    color: MALLO_COLORS.support.charcoal,
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
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.md,
  },
  photoPreview: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.redTint,
  },
  photoNumber: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: 2,
    color: MALLO_COLORS.core.red,
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
