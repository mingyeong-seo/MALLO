import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { formatElapsedDay } from '@/features/recovery/mock-data';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import type {
  QuickCheckAction,
  QuickCheckDecision,
  RecoveryRecordPerformedStatus,
} from '@/features/recovery/types';

type SaveState = 'idle' | 'saving' | 'error';

const ACTION_ORDER: QuickCheckAction[] = [
  'EXERCISE',
  'MAKEUP',
  'CLEANSING',
  'SKINCARE',
  'HEAT',
];

const ACTION_ICONS: Record<QuickCheckAction, keyof typeof Ionicons.glyphMap> = {
  EXERCISE: 'barbell-outline',
  MAKEUP: 'color-palette-outline',
  CLEANSING: 'water-outline',
  SKINCARE: 'flask-outline',
  HEAT: 'thermometer-outline',
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

export default function RecoveryRecordScreen() {
  const params = useLocalSearchParams<{
    day?: string;
    simulate?: string;
  }>();

  const {
    findRecoveryRecord,
    quickChecks,
    recoverySession,
    upsertRecoveryRecord,
  } = useRecoveryFlow();

  const elapsedDay = Number.isFinite(Number(params.day))
    ? Number(params.day)
    : (recoverySession?.elapsedDay ?? 0);

  const existing = findRecoveryRecord(elapsedDay);

  const todayQuickChecks = useMemo(
    () => quickChecks.filter((result) => result.elapsedDay === elapsedDay),
    [elapsedDay, quickChecks],
  );

  const actionCounts = useMemo(
    () =>
      ACTION_ORDER.reduce<Record<QuickCheckAction, number>>(
        (counts, action) => {
          counts[action] = todayQuickChecks.filter(
            (result) => result.action === action,
          ).length;
          return counts;
        },
        {
          EXERCISE: 0,
          MAKEUP: 0,
          CLEANSING: 0,
          SKINCARE: 0,
          HEAT: 0,
        },
      ),
    [todayQuickChecks],
  );

  const firstActionWithResult =
    ACTION_ORDER.find((action) => actionCounts[action] > 0) ?? 'EXERCISE';

  const [selectedAction, setSelectedAction] = useState<QuickCheckAction>(
    firstActionWithResult,
  );

  const [performedByCheckId, setPerformedByCheckId] = useState<
    Record<string, RecoveryRecordPerformedStatus>
  >(() =>
    Object.fromEntries(
      (existing?.actions ?? []).map((item) => [
        item.checkId,
        item.performedStatus,
      ]),
    ),
  );

  const [memo, setMemo] = useState(existing?.memo ?? '');
  const [attachments, setAttachments] = useState<string[]>(
    existing?.attachments ?? [],
  );
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [failedOnce, setFailedOnce] = useState(false);
  const [notice, setNotice] = useState('');

  const selectedChecks = todayQuickChecks.filter(
    (result) => result.action === selectedAction,
  );

  const allChecked =
    todayQuickChecks.length === 0 ||
    todayQuickChecks.every((result) => performedByCheckId[result.checkId]);

  const handleLogoPress = () => {
    router.replace('/(tabs)/journey/home');
  };

  const setPerformedStatus = (
    checkId: string,
    performedStatus: RecoveryRecordPerformedStatus,
  ) => {
    setPerformedByCheckId((current) => ({
      ...current,
      [checkId]: performedStatus,
    }));
    setNotice('');
  };

  const addMockPhoto = () => {
    if (attachments.length >= 5) {
      setNotice('사진은 최대 5장까지 추가할 수 있어요.');
      return;
    }

    setAttachments((current) => [
      ...current,
      `mock-recovery-photo-${Date.now()}-${current.length + 1}`,
    ]);
    setNotice('');
  };

  const saveRecord = () => {
    if (!allChecked) {
      setNotice('오늘 확인한 행동의 수행 여부를 모두 선택해 주세요.');
      return;
    }

    setSaveState('saving');
    setNotice('');

    setTimeout(() => {
      if (params.simulate === 'error' && !failedOnce) {
        setFailedOnce(true);
        setSaveState('error');
        return;
      }

      upsertRecoveryRecord({
        actions: todayQuickChecks.map((result) => ({
          checkId: result.checkId,
          performedStatus: performedByCheckId[result.checkId] ?? 'NOT_DONE',
        })),
        attachments,
        elapsedDay,
        id: existing?.id ?? `mock-record-${elapsedDay}`,
        memo: memo.trim(),
        updatedAt: new Date().toISOString(),
      });

      router.replace({
        pathname: '/(tabs)/journey/journal',
        params: {
          day: String(elapsedDay),
          saved: 'true',
        },
      });
    }, 500);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Recovery Journey 홈으로 이동"
            accessibilityRole="button"
            hitSlop={12}
            onPress={handleLogoPress}
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

        <View style={styles.contextRow}>
          <Text style={styles.contextText}>
            {recoverySession?.procedureName ?? 'REJURAN'}
          </Text>
          <Text style={styles.contextText}>{formatElapsedDay(elapsedDay)}</Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>오늘 확인한 행동을 기록해주세요.</Text>
          <Text style={styles.description}>
            오늘 확인했던 행동을 실제로 했는지 체크해주세요.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.actionTabs}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {ACTION_ORDER.map((action) => {
            const selected = action === selectedAction;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={action}
                onPress={() => setSelectedAction(action)}
                style={({ pressed }) => [
                  styles.actionTab,
                  selected && styles.actionTabSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={ACTION_ICONS[action]}
                  size={22}
                  color={
                    selected
                      ? MALLO_COLORS.core.white
                      : MALLO_COLORS.support.secondaryTextGray
                  }
                />
                <Text
                  style={[
                    styles.actionTabLabel,
                    selected && styles.actionTabLabelSelected,
                  ]}
                >
                  {ACTION_LABELS[action]}
                </Text>
                <Text
                  style={[
                    styles.actionTabCount,
                    selected && styles.actionTabCountSelected,
                  ]}
                >
                  {actionCounts[action]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>
            {ACTION_LABELS[selectedAction]} 관련 행동 ({selectedChecks.length})
          </Text>

          {selectedChecks.length ? (
            <View style={styles.checkList}>
              {selectedChecks.map((result) => {
                const performedStatus = performedByCheckId[result.checkId];
                const decisionColor = DECISION_COLORS[result.decision];

                return (
                  <View key={result.checkId} style={styles.checkCard}>
                    <View style={styles.checkCopy}>
                      <Text style={styles.checkTitle}>
                        {result.contextLabel}
                      </Text>
                      <Text
                        style={[styles.decisionLabel, { color: decisionColor }]}
                      >
                        {DECISION_LABELS[result.decision]}
                      </Text>
                    </View>

                    <View style={styles.performanceChoices}>
                      <Choice
                        label="했어요"
                        onPress={() =>
                          setPerformedStatus(result.checkId, 'DONE')
                        }
                        selected={performedStatus === 'DONE'}
                      />
                      <Choice
                        label="하지 않았어요"
                        onPress={() =>
                          setPerformedStatus(result.checkId, 'NOT_DONE')
                        }
                        selected={performedStatus === 'NOT_DONE'}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noActionState}>
              <Text style={styles.noActionTitle}>
                오늘 확인한 {ACTION_LABELS[selectedAction]} 행동이 없어요.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/check/quick')}
                style={({ pressed }) => [
                  styles.inlineButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.inlineButtonText}>Quick Check 하기</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>메모</Text>
            <Text style={styles.optionalLabel}>(선택)</Text>
          </View>

          <TextInput
            accessibilityLabel="회복 메모"
            maxLength={300}
            multiline
            onChangeText={setMemo}
            placeholder="오늘 피부 느낌이나 자유롭게 적어주세요."
            placeholderTextColor={MALLO_COLORS.support.secondaryTextGray}
            style={styles.memoInput}
            textAlignVertical="top"
            value={memo}
          />

          <Text style={styles.characterCount}>{memo.length}/300</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>사진</Text>
            <Text style={styles.optionalLabel}>(선택)</Text>
          </View>

          <View style={styles.photoRow}>
            {attachments.map((attachment, index) => (
              <Pressable
                accessibilityLabel={`사진 ${index + 1} 제거`}
                accessibilityRole="button"
                key={attachment}
                onPress={() =>
                  setAttachments((current) =>
                    current.filter((item) => item !== attachment),
                  )
                }
                style={styles.photoPreview}
              >
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={MALLO_COLORS.core.red}
                />
                <Text style={styles.photoNumber}>{index + 1}</Text>
                <Ionicons
                  name="close-circle"
                  size={17}
                  color={MALLO_COLORS.support.secondaryTextGray}
                  style={styles.removeIcon}
                />
              </Pressable>
            ))}

            {attachments.length < 5 ? (
              <Pressable
                accessibilityLabel="사진 추가"
                accessibilityRole="button"
                onPress={addMockPhoto}
                style={({ pressed }) => [
                  styles.photoButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="camera-outline"
                  size={22}
                  color={MALLO_COLORS.support.charcoal}
                />
                <Text style={styles.photoButtonText}>사진 추가</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.photoCount}>{attachments.length}/5</Text>
        </View>

        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.noticeText}>
            {notice}
          </Text>
        ) : null}

        {saveState === 'error' ? (
          <View style={styles.errorBox}>
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>
              기록을 저장하지 못했어요. 다시 시도해 주세요.
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={saveState === 'saving'}
          onPress={saveRecord}
          style={({ pressed }) => [
            styles.primaryButton,
            !allChecked && styles.primaryButtonDisabled,
            pressed && saveState !== 'saving' && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {saveState === 'saving' ? '저장하고 있어요' : '오늘 기록 저장하기'}
          </Text>
        </Pressable>

        <Text style={styles.saveGuide}>
          저장한 기록은 Recovery Journal에서 확인할 수 있어요.
        </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Choice({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioCenter} /> : null}
      </View>
      <Text style={styles.choiceLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: MALLO_SPACING.xl,
    paddingBottom: 48,
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
  contextRow: {
    flexDirection: 'row',
    gap: MALLO_SPACING.sm,
    paddingTop: MALLO_SPACING.lg,
  },
  contextText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.sm,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
    color: MALLO_COLORS.support.charcoal,
  },
  intro: {
    marginTop: MALLO_SPACING.xl,
  },
  title: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    color: MALLO_COLORS.core.ink,
  },
  description: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  actionTabs: {
    gap: MALLO_SPACING.sm,
    paddingVertical: MALLO_SPACING.xl,
  },
  actionTab: {
    width: 76,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MALLO_SPACING.sm,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.white,
  },
  actionTabSelected: {
    borderColor: MALLO_COLORS.core.red,
    backgroundColor: MALLO_COLORS.core.red,
  },
  actionTabLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.charcoal,
  },
  actionTabLabelSelected: {
    color: MALLO_COLORS.core.white,
  },
  actionTabCount: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: 2,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  actionTabCountSelected: {
    color: MALLO_COLORS.core.white,
  },
  actionSection: {
    marginTop: MALLO_SPACING.xs,
  },
  section: {
    marginTop: MALLO_SPACING.xl,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: MALLO_SPACING.xs,
  },
  sectionTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },
  optionalLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  checkList: {
    marginTop: MALLO_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },
  checkCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },
  checkCopy: {
    flex: 1,
  },
  checkTitle: {
    ...MALLO_TYPOGRAPHY.body,
    fontWeight: '600',
    color: MALLO_COLORS.core.ink,
  },
  decisionLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    fontWeight: '600',
  },
  performanceChoices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.md,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.xs,
  },
  choiceLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.charcoal,
  },
  radio: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.secondaryTextGray,
    borderRadius: MALLO_RADIUS.full,
  },
  radioSelected: {
    borderColor: MALLO_COLORS.core.red,
  },
  radioCenter: {
    width: 10,
    height: 10,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.red,
  },
  noActionState: {
    marginTop: MALLO_SPACING.md,
    padding: MALLO_SPACING.lg,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  noActionTitle: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    marginTop: MALLO_SPACING.sm,
  },
  inlineButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.red,
  },
  memoInput: {
    minHeight: 108,
    marginTop: MALLO_SPACING.sm,
    padding: MALLO_SPACING.md,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
    ...MALLO_TYPOGRAPHY.body,
    color: MALLO_COLORS.core.ink,
    backgroundColor: MALLO_COLORS.core.white,
  },
  characterCount: {
    ...MALLO_TYPOGRAPHY.caption,
    alignSelf: 'flex-end',
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.sm,
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
  removeIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  photoButton: {
    minWidth: 116,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.xs,
    paddingHorizontal: MALLO_SPACING.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
  },
  photoButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.support.charcoal,
  },
  photoCount: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  noticeText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    marginTop: MALLO_SPACING.lg,
    color: MALLO_COLORS.core.red,
  },
  errorBox: {
    marginTop: MALLO_SPACING.lg,
    padding: MALLO_SPACING.md,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.redTint,
  },
  errorText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    color: MALLO_COLORS.semantic.connect,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },
  saveGuide: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.sm,
    textAlign: 'center',
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  pressed: {
    opacity: 0.68,
  },
});
