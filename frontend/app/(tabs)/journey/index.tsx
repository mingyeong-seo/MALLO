import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import {
  Image,
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
  const { isHydratingSession, recoverySession } = useRecoveryFlow();

  if (isHydratingSession) {
    return null;
  }

  // 이미 시술 정보가 있으면 Recovery Journey Home(S04)으로 바로 이동
  if (recoverySession) {
    return <Redirect href="/(tabs)/journey/home" />;
  }

  // 시술 정보가 없을 때만 DERNA 연결 전 화면 표시
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
  divider: {
    height: 1,
    marginTop: MALLO_SPACING.lg,
    backgroundColor: MALLO_COLORS.support.mistGray,
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
});
