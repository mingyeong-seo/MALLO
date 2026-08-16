import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { MALLO_COLORS } from '@/constants/colors';
import { MALLO_TEXT_STYLES } from '@/constants/text-styles';
import {
  MALLO_RADIUS,
  MALLO_SPACING,
  MALLO_TYPOGRAPHY,
} from '@/constants/theme';

type RecoveryJourneySummary = {
  procedureName: string;
  procedureDate: string;
  recoveryDay: number;
  phase: string;
};

type QuickEntry = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: Href;
};

const MOCK_RECOVERY_JOURNEY: RecoveryJourneySummary = {
  procedureName: 'REJURAN',
  procedureDate: '2026.08.15',
  recoveryDay: 1,
  phase: '초기 집중 관리',
};

const QUICK_ENTRIES: QuickEntry[] = [
  {
    description: '오늘 뭘 하면 될까요?',
    icon: 'sparkles-outline',
    label: 'Today Action Plan',
    href: '/(tabs)/check',
  },
  {
    description: '지금 해도 괜찮을까요?',
    icon: 'checkmark-circle-outline',
    label: 'Quick Check',
    href: '/(tabs)/check',
  },
  {
    description: '회복 중 궁금한 게 있나요?',
    icon: 'chatbubble-outline',
    label: 'ASK MALLO',
    href: '/(tabs)/ask',
  },
  {
    description: '오늘의 회복을 남겨보세요',
    icon: 'document-text-outline',
    label: '오늘 기록하기',
    href: '/(tabs)/journey/record',
  },
];

export default function JourneyHomeScreen() {
  const journey = MOCK_RECOVERY_JOURNEY;

  const [showPhaseInfo, setShowPhaseInfo] = useState(false);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePhasePress = () => {
    setShowPhaseInfo(true);

    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
    }

    phaseTimerRef.current = setTimeout(() => {
      setShowPhaseInfo(false);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
    };
  }, []);

  const progress = `${
    Math.min(Math.max(journey.recoveryDay / 7, 0), 1) * 100
  }%` as `${number}%`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <JourneyHeader />
        <View style={styles.connectionStatus}>
          <View style={styles.connectionDot} />
          <Text style={styles.connectionText}>CONNECTED TO DERNA</Text>
        </View>

        <View style={styles.recoveryCardWrapper}>
          <View style={styles.recoveryCard}>
            <View style={styles.recoveryCardTopRow}>
              <Text style={styles.procedureName}>{journey.procedureName}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${journey.phase} 설명 보기`}
                onPress={handlePhasePress}
                style={({ pressed }) => [
                  styles.phaseBadge,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.phaseBadgeText}>{journey.phase}</Text>
              </Pressable>
            </View>

            <Text style={styles.recoveryDay}>
              {formatRecoveryDay(journey.recoveryDay)}
            </Text>

            <Text style={styles.recoveryDayDescription}>
              {getRecoveryDayDescription(journey.recoveryDay)}
            </Text>

            <Text style={styles.procedureDate}>
              시술일 {journey.procedureDate}
            </Text>

            <View style={styles.progressSection}>
              <Text style={styles.progressTitle}>회복 진행 상태</Text>

              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>DAY 7</Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progress }]} />
              </View>
            </View>
          </View>

          {showPhaseInfo ? (
            <View style={styles.phaseToastWrapper} pointerEvents="none">
              <View accessibilityLiveRegion="polite" style={styles.phaseToast}>
                <View style={styles.phaseToastIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={MALLO_COLORS.core.red}
                  />
                </View>

                <Text style={styles.phaseToastText}>
                  시술 후 초기 회복에 집중해 관리하는 기간이에요.
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>빠른 메뉴</Text>

          <View style={styles.quickList}>
            {QUICK_ENTRIES.map((entry, index) => (
              <QuickEntryRow
                key={entry.label}
                entry={entry}
                showDivider={index < QUICK_ENTRIES.length - 1}
              />
            ))}
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>지난 회복 기록</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="지난 회복 기록 보기"
            onPress={() => router.push('/(tabs)/journey/journal')}
            style={({ pressed }) => [
              styles.journalEntry,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.journalIcon}>
              <Ionicons
                name="book-outline"
                size={18}
                color={MALLO_COLORS.support.charcoal}
              />
            </View>

            <View style={styles.journalCopy}>
              <Text style={styles.journalTitle}>기록 모아보기</Text>

              <Text style={styles.journalDescription}>
                지금까지 남긴 회복 기록을 확인해요.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={MALLO_COLORS.support.secondaryTextGray}
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function JourneyHeader() {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="DERNA로 돌아가기"
        hitSlop={8}
        onPress={() => router.replace('/')}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Ionicons
          name="chevron-back"
          size={18}
          color={MALLO_COLORS.support.secondaryTextGray}
        />

        <Text style={styles.dernaBackText}>DERNA로 돌아가기</Text>
      </Pressable>

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

function QuickEntryRow({
  entry,
  showDivider,
}: {
  entry: QuickEntry;
  showDivider: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.label}, ${entry.description}`}
      onPress={() => router.push(entry.href)}
      style={({ pressed }) => [
        styles.quickEntry,
        showDivider && styles.quickEntryDivider,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.quickEntryIcon}>
        <Ionicons
          name={entry.icon}
          size={18}
          color={MALLO_COLORS.support.charcoal}
        />
      </View>

      <View style={styles.quickEntryCopy}>
        <Text style={styles.quickEntryLabel} numberOfLines={1}>
          {entry.label}
        </Text>

        <Text style={styles.quickEntryDescription}>{entry.description}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color={MALLO_COLORS.support.secondaryTextGray}
      />
    </Pressable>
  );
}

function formatRecoveryDay(day: number) {
  return `DAY ${Math.max(day, 1)}`;
}

function getRecoveryDayDescription(day: number) {
  return day === 1 ? '시술 당일' : `시술 후 ${day}일차`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },

  scrollContent: {
    paddingHorizontal: MALLO_SPACING.xl,
    paddingTop: Platform.OS === 'web' ? MALLO_SPACING.sm : 0,
    paddingBottom: MALLO_SPACING.xxl * 4,

    ...(Platform.OS !== 'web' && {
      transform: [{ translateY: -14 }],
    }),
  },

  /* Header */

  header: {
    minHeight: Platform.OS === 'web' ? 96 : 90,
    paddingBottom: MALLO_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },

  backButton: {
    minHeight: 36,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.xs,

    marginTop: 5,
    marginLeft: -MALLO_SPACING.sm,

    paddingHorizontal: MALLO_SPACING.sm,
  },

  dernaBackText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  headerLogo: {
    width: 112,
    height: 25,
    alignSelf: 'center',
    marginTop: MALLO_SPACING.sm,
  },

  /* Recovery Card */

  recoveryCardWrapper: {
    position: 'relative',
  },

  recoveryCard: {
    marginTop: MALLO_SPACING.xs,
    padding: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.core.red,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,

    marginTop: MALLO_SPACING.sm,
    marginBottom: MALLO_SPACING.sm,
  },

  connectionDot: {
    width: 5,
    height: 5,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.red,
  },

  connectionText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
    fontWeight: '600',
    letterSpacing: 0.8,
  },

  recoveryCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: MALLO_SPACING.md,
  },

  procedureName: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.redTint,
    letterSpacing: 0.9,
  },

  phaseBadge: {
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.redTint,
  },

  phaseBadgeText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.core.red,
  },

  /* Floating phase explanation */
  phaseToast: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,

    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.sm,

    borderWidth: 1,
    borderColor: 'rgba(231, 227, 223, 0.65)',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  phaseToastWrapper: {
    position: 'absolute',
    zIndex: 20,
    top: -35,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  phaseToastIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: 'rgba(244, 214, 210, 0.75)',
  },

  phaseToastText: {
    ...MALLO_TYPOGRAPHY.caption,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    flex: 1,
    color: MALLO_COLORS.support.charcoal,
  },

  recoveryDay: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    marginTop: MALLO_SPACING.lg,
    color: MALLO_COLORS.core.white,
    letterSpacing: -0.5,
  },

  recoveryDayDescription: {
    ...MALLO_TYPOGRAPHY.body,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.core.white,
  },

  procedureDate: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.mistGray,
  },

  progressSection: {
    marginTop: MALLO_SPACING.xl,
  },

  progressTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    marginBottom: MALLO_SPACING.md,
    color: MALLO_COLORS.core.white,
  },

  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: MALLO_SPACING.sm,
  },

  progressLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.mistGray,
  },

  progressTrack: {
    height: 6,
    overflow: 'hidden',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.redTint,
  },

  progressFill: {
    height: '100%',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.progress,
  },

  /* Quick Menu */

  quickSection: {
    marginTop: MALLO_SPACING.xl,
  },

  sectionTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    marginBottom: MALLO_SPACING.md,
    color: MALLO_COLORS.support.charcoal,
  },

  quickList: {
    width: '100%',
  },

  quickEntry: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MALLO_SPACING.md,
  },

  quickEntryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },

  quickEntryIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: MALLO_SPACING.lg,
  },

  quickEntryCopy: {
    flex: 1,
  },

  quickEntryLabel: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },

  quickEntryDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  /* History */

  historySection: {
    marginTop: MALLO_SPACING.xl,
  },

  historySectionTitle: {
    ...MALLO_TYPOGRAPHY.caption,
    fontWeight: '600',
    marginBottom: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  journalEntry: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MALLO_SPACING.md,
  },

  journalIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: MALLO_SPACING.md,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },

  journalCopy: {
    flex: 1,
  },

  journalTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },

  journalDescription: {
    ...MALLO_TYPOGRAPHY.caption,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  pressed: {
    opacity: 0.68,
  },
});
