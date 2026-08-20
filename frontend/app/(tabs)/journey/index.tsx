import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import {
  ActivityIndicator,
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
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';

export default function JourneyScreen() {
  const {
    hasSessionHydrationError,
    isHydratingSession,
    recoverySession,
    retrySessionHydration,
  } = useRecoveryFlow();

  if (isHydratingSession) {
    return <SessionCheckingState />;
  }

  if (hasSessionHydrationError) {
    return (
      <SessionRestoreError
        onRetry={retrySessionHydration}
      />
    );
  }

  if (recoverySession?.status === 'ACTIVE') {
    return <Redirect href="/(tabs)/journey/home" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MalloBrandHeader isConnected={false} />
        <EmptySessionState />
      </ScrollView>
    </SafeAreaView>
  );
}

function SessionCheckingState() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.sessionStateScreen}>
        <MalloBrandHeader isConnected={false} />
        <View style={styles.divider} />
        <View style={styles.sessionStateBody}>
          <ActivityIndicator color={MALLO_COLORS.core.red} size="small" />
          <Text style={styles.sessionStateTitle}>
            Recovery Journey를 확인하고 있어요
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SessionRestoreError({ onRetry }: { onRetry: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.sessionStateScreen}>
        <MalloBrandHeader isConnected={false} />
        <View style={styles.divider} />
        <View style={styles.sessionStateBody}>
          <Text style={styles.sessionStateTitle}>세션을 확인하지 못했어요</Text>
          <Text style={styles.sessionStateDescription}>
            네트워크 연결을 확인하고 다시 시도해주세요.
          </Text>
          <PrimaryButton label="다시 시도하기" onPress={onRetry} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function MalloBrandHeader({ isConnected }: { isConnected: boolean }) {
  return (
    <View style={styles.brandHeader}>
      <View>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.connectionDot,
              !isConnected && styles.connectionDotDisconnected,
            ]}
          />
          <Text style={styles.eyebrow}>
            {isConnected ? 'CONNECTED TO DERNA' : 'DERNA 연결 전'}
          </Text>
        </View>

        <Text style={styles.brandTitle}>MALLO</Text>
      </View>
    </View>
  );
}

function EmptySessionState() {
  return (
    <View style={styles.emptyStateContent}>
      <View style={styles.divider} />

      <View style={styles.emptyStateBody}>
        <View style={styles.emptyStatePanel}>
          <View
            style={styles.connectionImageFrame}
            accessible
            accessibilityRole="image"
            accessibilityLabel="DERNA에서 MALLO로 시술 정보 연결"
          >
            <Image
              source={require('../../../assets/images/derna-mallo-connection.png')}
              style={styles.connectionImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.emptyStateTitle}>
            DERNA의 시술 정보를 불러올까요?
          </Text>
          <Text style={styles.emptyStateText}>
            최근 시술 정보를 확인하고 맞춤 회복관리를 시작할 수 있어요.
          </Text>
        </View>

        <View style={styles.emptyStateActionGap} />

        <PrimaryButton
          label="시술 정보 불러오기"
          onPress={() => router.push('/consent')}
        />
      </View>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  inverted = false,
}: {
  label: string;
  onPress: () => void;
  inverted?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        inverted && styles.primaryButtonInverted,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.primaryButtonText,
          inverted && styles.primaryButtonTextInverted,
        ]}
      >
        {label}
      </Text>
      <Ionicons
        name="arrow-forward"
        size={16}
        color={inverted ? MALLO_COLORS.core.ink : MALLO_COLORS.core.white}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: MALLO_SPACING.xl,
    paddingTop: MALLO_SPACING.md,
    paddingBottom: MALLO_SPACING.xxl,
  },
  sessionStateScreen: {
    flex: 1,
    paddingHorizontal: MALLO_SPACING.xl,
    paddingTop: MALLO_SPACING.md,
    paddingBottom: MALLO_SPACING.xxl,
  },
  sessionStateBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.md,
    paddingBottom: MALLO_SPACING.xxl,
  },
  sessionStateTitle: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    color: MALLO_COLORS.core.ink,
    textAlign: 'center',
  },
  sessionStateDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginBottom: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
  },
  brandHeader: {
    alignItems: 'flex-start',
  },
  eyebrow: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
    letterSpacing: 0.8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
    marginBottom: MALLO_SPACING.xs,
  },
  connectionDot: {
    width: 5,
    height: 5,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.red,
  },

  connectionDotDisconnected: {
    backgroundColor: MALLO_COLORS.support.secondaryTextGray,
  },
  brandTitle: {
    ...MALLO_TYPOGRAPHY.brand,
    color: MALLO_COLORS.core.red,
    letterSpacing: -0.6,
  },
  stateContent: {
    gap: MALLO_SPACING.xl,

    ...(Platform.OS === 'web' && {
      gap: MALLO_SPACING.xxl + MALLO_SPACING.sm,
      paddingTop: MALLO_SPACING.sm,
    }),
  },
  divider: {
    height: 1,
    marginTop: MALLO_SPACING.lg,
    backgroundColor: MALLO_COLORS.support.mistGray,
  },
  sectionLabel: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    marginBottom: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  activeSessionCard: {
    padding: MALLO_SPACING.lg,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.core.red,
  },
  sessionProcedure: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    marginBottom: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.redTint,
    letterSpacing: 0.8,
  },
  sessionDay: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    marginBottom: MALLO_SPACING.xs,
    color: MALLO_COLORS.core.white,
    letterSpacing: -0.5,
  },
  sessionMeta: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.mistGray,
  },
  progressSection: {
    marginVertical: MALLO_SPACING.lg,
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
    height: 4,
    overflow: 'hidden',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.redTint,
  },
  progressFill: {
    height: '100%',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,
    paddingHorizontal: MALLO_SPACING.lg,
    borderWidth: 1,
    borderColor: MALLO_COLORS.core.red,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },
  primaryButtonInverted: {
    borderColor: MALLO_COLORS.core.white,
    backgroundColor: MALLO_COLORS.core.white,
  },
  primaryButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },
  primaryButtonTextInverted: {
    color: MALLO_COLORS.core.ink,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  previewCard: {
    gap: MALLO_SPACING.lg,
    padding: MALLO_SPACING.lg,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.warmGray,

    ...(Platform.OS === 'web' && {
      minHeight: 160,
      justifyContent: 'center',
    }),
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewStatus: {
    width: 8,
    height: 8,
    marginRight: MALLO_SPACING.md,
    borderRadius: MALLO_RADIUS.full,
  },
  previewStatusPossible: {
    backgroundColor: MALLO_COLORS.semantic.possible,
  },
  previewStatusAdjust: {
    backgroundColor: MALLO_COLORS.semantic.adjust,
  },
  previewStatusPostpone: {
    backgroundColor: MALLO_COLORS.semantic.postpone,
  },
  previewLabel: {
    ...MALLO_TYPOGRAPHY.body,
    flex: 1,
    color: MALLO_COLORS.support.charcoal,
  },
  previewResult: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.charcoal,
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: MALLO_SPACING.md,

    ...(Platform.OS === 'web' && {
      marginTop: MALLO_SPACING.xl,
    }),
  },
  quickAccessCard: {
    minHeight: 68,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.white,

    ...(Platform.OS === 'web' && {
      minHeight: 80,
    }),
  },
  quickAccessIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  quickAccessLabel: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.charcoal,
  },
  emptyStateContent: {
    flex: 1,
  },
  emptyStateBody: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: MALLO_SPACING.xxl * 3,
  },
  emptyStateActionGap: {
    height: MALLO_SPACING.xl,
  },
  emptyStatePanel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MALLO_SPACING.xl,
    paddingVertical: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  connectionImageFrame: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 840 / 471,
    alignSelf: 'center',
    marginBottom: MALLO_SPACING.xl,
  },
  connectionImage: {
    width: '100%',
    height: '100%',
  },
  emptyStateTitle: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    fontSize: 20,
    lineHeight: 28,
    color: MALLO_COLORS.core.ink,
    textAlign: 'center',
  },
  emptyStateText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    fontSize: 15,
    lineHeight: 22,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
  },
  progressSectionTitle: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    marginBottom: MALLO_SPACING.sm,
    color: MALLO_COLORS.core.white,
  },
});
