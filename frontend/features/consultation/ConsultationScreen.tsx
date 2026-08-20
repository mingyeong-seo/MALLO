import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  Alert,
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

type ConsultationScreenProps = {
  mode: 'ask-mallo' | 'journey-home';
  question?: string;
};

export function ConsultationScreen({
  mode,
  question,
}: ConsultationScreenProps) {
  const insets = useSafeAreaInsets();
  const isAskEntry = mode === 'ask-mallo';
  const displayQuestion = question?.trim();
  const floatingTabClearance =
    MALLO_SPACING.xxl * 2 +
    Math.max(insets.bottom, MALLO_SPACING.md) +
    MALLO_SPACING.lg;

  const handlePrimaryPress = () => {
    router.replace({
      pathname: '/(tabs)/ask',
      params: { reset: String(Date.now()) },
    });
  };

  const handleContactPress = () => {
    const message = '의료진 연결 기능은 준비 중입니다.';

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.alert(message);
      }

      return;
    }

    Alert.alert('안내', message);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          !isAskEntry && { paddingBottom: floatingTabClearance },
        ]}
      >
        <View style={styles.header}>
          <Image
            accessibilityLabel="MALLO"
            resizeMode="contain"
            source={require('../../assets/images/mallo-logo-red.png')}
            style={styles.logo}
          />
        </View>

        {displayQuestion ? (
          <View style={styles.questionRecall}>
            <Text style={styles.questionLabel}>문의한 내용</Text>
            <Text style={styles.questionText}>“{displayQuestion}”</Text>
          </View>
        ) : null}

        <View
          style={[styles.body, !displayQuestion && styles.bodyWithoutQuestion]}
        >
          <View style={styles.guidanceSection}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="medical-outline"
                size={28}
                color={MALLO_COLORS.core.red}
              />
            </View>
            <Text style={styles.title}>의료진 확인이 필요합니다.</Text>
            <Text style={styles.description}>
              MALLO는 의료적 판단을 생성하지 않습니다.{`\n`}
              담당 의료진에게 확인해 주세요.
            </Text>
          </View>

          <View style={styles.doctorSection}>
            <Text style={styles.sectionTitle}>담당 의료진 / 병원</Text>

            <View style={styles.doctorCard}>
              <View style={styles.doctorProfile}>
                <Image
                  accessible={false}
                  resizeMode="cover"
                  source={require('../../assets/images/doctor-placeholder.png')}
                  style={styles.doctorImage}
                />

                <View style={styles.doctorCopy}>
                  <Text style={styles.doctorTitle}>담당 의료진 정보</Text>
                  <Text style={styles.doctorDescription}>
                    의료진 정보 확인 후 표시됩니다.
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel="의료진에게 문의하기"
                accessibilityRole="button"
                onPress={handleContactPress}
                style={({ pressed }) => [
                  styles.contactButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.contactButtonText}>
                  의료진에게 문의하기
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color={MALLO_COLORS.core.red}
                />
              </Pressable>
            </View>
          </View>

          {isAskEntry ? (
            <View style={styles.footerAction}>
              <Pressable
                accessibilityLabel="질문 다시 입력하기"
                accessibilityRole="button"
                onPress={handlePrimaryPress}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>질문 다시 입력하기</Text>
              </Pressable>
            </View>
          ) : null}
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
  content: {
    flexGrow: 1,
    paddingHorizontal: MALLO_SPACING.xl,
    paddingBottom: MALLO_SPACING.xl,
  },
  header: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },
  logo: {
    width: 112,
    height: 25,
  },
  screenTitle: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    marginTop: MALLO_SPACING.xl,
    color: MALLO_COLORS.core.ink,
  },
  questionRecall: {
    marginTop: MALLO_SPACING.lg,
    paddingLeft: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: MALLO_COLORS.core.red,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  questionLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.core.red,
  },
  questionText: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    fontWeight: '600',
    color: MALLO_COLORS.core.ink,
  },
  body: {
    flex: 1,
    alignSelf: 'stretch',
    paddingTop: MALLO_SPACING.xxl,
    paddingBottom: MALLO_SPACING.xl,
  },
  bodyWithoutQuestion: {
    justifyContent: 'center',
    paddingTop: MALLO_SPACING.xl,
  },
  guidanceSection: {
    alignItems: 'center',
    paddingVertical: MALLO_SPACING.xl,
  },
  iconCircle: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.redTint,
  },
  title: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.lg,
    textAlign: 'center',
    color: MALLO_COLORS.core.ink,
  },
  description: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    maxWidth: 330,
    marginTop: MALLO_SPACING.md,
    textAlign: 'center',
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  doctorSection: {
    width: '90%',
    alignSelf: 'center',
    marginTop: MALLO_SPACING.xxl,
  },
  sectionTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.core.ink,
  },
  doctorCard: {
    marginTop: MALLO_SPACING.md,
    padding: MALLO_SPACING.lg,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.core.white,
  },
  doctorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.md,
  },
  doctorImage: {
    width: 60,
    height: 60,
    flexShrink: 0,
    borderRadius: MALLO_RADIUS.full,
  },
  doctorCopy: {
    flex: 1,
    minWidth: 0,
  },
  doctorTitle: {
    ...MALLO_TYPOGRAPHY.body,
    fontWeight: '600',
    color: MALLO_COLORS.core.ink,
  },
  doctorDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  contactButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.xs,
    marginTop: MALLO_SPACING.lg,
    borderWidth: 1,
    borderColor: MALLO_COLORS.core.red,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.white,
  },
  contactButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.red,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },
  footerAction: {
    marginTop: 'auto',
    paddingTop: MALLO_SPACING.xxl,
  },
  primaryButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },
  pressed: {
    opacity: 0.68,
  },
});
