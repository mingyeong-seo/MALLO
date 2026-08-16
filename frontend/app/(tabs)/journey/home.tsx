import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
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
    href: '/(tabs)/journey/today-plan',
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

  const progress = `${
    Math.min(Math.max((journey.recoveryDay - 1) / 6, 0), 1) * 100
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

        <View style={styles.recoveryCard}>
          <View style={styles.recoveryCardTopRow}>
            <Text style={styles.procedureName}>{journey.procedureName}</Text>

            <View style={styles.phaseBadge}>
              <Text style={styles.phaseBadgeText}>{journey.phase}</Text>
            </View>
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
              <Text style={styles.progressLabel}>DAY 1</Text>
              <Text style={styles.progressLabel}>DAY 7</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progress }]} />
            </View>
          </View>
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
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/journey');
  };

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="MALLO 홈으로 돌아가기"
        hitSlop={8}
        onPress={handleBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={MALLO_COLORS.support.secondaryTextGray}
        />

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

  header: {
    minHeight: Platform.OS === 'web' ? 44 : 36,
    justifyContent: 'center',
  },

  backButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.xs,
    marginLeft: -MALLO_SPACING.sm,
    paddingHorizontal: MALLO_SPACING.sm,
  },

  headerLogo: {
    width: 68,
    height: 16,
  },

  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
    marginTop: MALLO_SPACING.xs,
    marginBottom: MALLO_SPACING.md,
  },

  connectionDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: MALLO_COLORS.core.red,
  },

  connectionText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
    fontWeight: '600',
    letterSpacing: 0.8,
    textAlign: 'right',
  },

  recoveryCard: {
    marginTop: MALLO_SPACING.xs,
    padding: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.core.red,
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
    justifyContent: 'space-between',
    marginBottom: MALLO_SPACING.sm,
  },

  progressLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.mistGray,
  },

  progressTrack: {
    height: 5,
    overflow: 'hidden',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.redTint,
  },

  progressFill: {
    height: '100%',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },

  quickSection: {
    marginTop: MALLO_SPACING.xxl + MALLO_SPACING.md,
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
