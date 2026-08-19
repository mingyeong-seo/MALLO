import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
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
import { formatElapsedDay } from '@/features/recovery/mock-data';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';

const DEMO_PROFILE = {
  description: 'DERNA Recovery Journey 이용 중',
  image: require('../../../assets/images/demo-profile.png'),
  name: '김서연',
} as const;

export default function MyScreen() {
  const insets = useSafeAreaInsets();
  const { recoverySession } = useRecoveryFlow();
  const floatingTabClearance =
    MALLO_SPACING.xxl * 2 +
    Math.max(insets.bottom, MALLO_SPACING.md) +
    MALLO_SPACING.xl;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: floatingTabClearance },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            accessibilityLabel="MALLO"
            resizeMode="contain"
            source={require('../../../assets/images/mallo-logo-red.png')}
            style={styles.headerLogo}
          />
        </View>

        <View style={styles.profileSection}>
          <Image
            accessibilityLabel={`${DEMO_PROFILE.name} 프로필`}
            resizeMode="cover"
            source={DEMO_PROFILE.image}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{DEMO_PROFILE.name}</Text>
          <Text style={styles.profileDescription}>
            {DEMO_PROFILE.description}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>현재 Recovery Journey</Text>

          {recoverySession ? (
            <View style={styles.journeyCard}>
              <View style={styles.journeyHeading}>
                <View>
                  <Text style={styles.procedureName}>
                    {recoverySession.procedureName}
                  </Text>
                  <Text style={styles.procedureDate}>
                    시술일 {recoverySession.procedureDate}
                  </Text>
                </View>

                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>
                    {formatElapsedDay(recoverySession.elapsedDay)}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel="Recovery Journey 보기"
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/journey/home')}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  Recovery Journey 보기
                </Text>
                <Ionicons
                  color={MALLO_COLORS.core.white}
                  name="arrow-forward"
                  size={17}
                />
              </Pressable>
            </View>
          ) : (
            <Text style={styles.emptyJourneyText}>
              진행 중인 Recovery Journey가 없어요.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 회복 기록</Text>
          <Pressable
            accessibilityLabel="회복 기록 모아보기"
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/journey/journal')}
            style={({ pressed }) => [
              styles.listAction,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.listActionIcon}>
              <Ionicons
                color={MALLO_COLORS.core.red}
                name="book-outline"
                size={20}
              />
            </View>
            <Text style={styles.listActionText}>회복 기록 모아보기</Text>
            <Ionicons
              color={MALLO_COLORS.support.secondaryTextGray}
              name="chevron-forward"
              size={17}
            />
          </Pressable>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>MALLO 소개</Text>
          <Text style={styles.aboutText}>
            시술 후 고민을, 오늘의 행동으로.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },
  scrollContent: {
    paddingHorizontal: MALLO_SPACING.xl,
  },
  header: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },
  headerLogo: {
    width: 112,
    height: 25,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: MALLO_SPACING.xxl,
  },
  profileImage: {
    width: 88,
    height: 88,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.full,
  },
  profileName: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.core.ink,
  },
  profileDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  section: {
    marginTop: MALLO_SPACING.xl,
  },
  sectionTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },
  journeyCard: {
    marginTop: MALLO_SPACING.sm,
    padding: MALLO_SPACING.lg,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  journeyHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: MALLO_SPACING.md,
  },
  procedureName: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    color: MALLO_COLORS.core.ink,
  },
  procedureDate: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  dayBadge: {
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.redTint,
  },
  dayBadgeText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.core.red,
  },
  primaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.lg,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },
  primaryButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },
  emptyJourneyText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  listAction: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.md,
    marginTop: MALLO_SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
  },
  listActionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.redTint,
  },
  listActionText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    flex: 1,
    color: MALLO_COLORS.support.charcoal,
  },
  aboutSection: {
    marginTop: MALLO_SPACING.xxl,
    paddingTop: MALLO_SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },
  aboutText: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  pressed: {
    opacity: 0.68,
  },
});
