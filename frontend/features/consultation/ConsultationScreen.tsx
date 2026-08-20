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

        {question ? (
          <View style={styles.questionRecall}>
            <Text style={styles.questionLabel}>문의할 내용</Text>
            <Text style={styles.questionText}>“{question}”</Text>
          </View>
        ) : null}

        <View style={styles.body}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="medical-outline"
              size={28}
              color={MALLO_COLORS.core.red}
            />
          </View>
          <Text style={styles.title}>의료진의 확인이 필요해요</Text>
          <Text style={styles.description}>
            현재는 의료진 문의 전송과 상담 채널 연결을 제공하지 않아요.
          </Text>

          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={MALLO_COLORS.support.secondaryTextGray}
            />
            <Text style={styles.noticeText}>
              MALLO가 입력한 내용의 정상 여부나 의료적 판단을 제공하지 않아요.
            </Text>
          </View>

          {isAskEntry ? (
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
  questionRecall: {
    marginTop: MALLO_SPACING.xl,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: MALLO_SPACING.xxl,
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
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.xl,
    padding: MALLO_SPACING.md,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  noticeText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    flex: 1,
    color: MALLO_COLORS.support.charcoal,
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
  pressed: {
    opacity: 0.68,
  },
});
