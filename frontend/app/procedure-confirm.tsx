import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { MALLO_COLORS } from '@/constants/colors';
import {
  MALLO_RADIUS,
  MALLO_SPACING,
  MALLO_TYPOGRAPHY,
} from '@/constants/theme';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import { createSession } from '@/services/session';
import { setSessionId } from '@/services/session-storage';

// ─── Mock Data ────────────────────────────────────────────────

interface ProcedureData {
  procedure: string;
  procedure_at: string;
  clinic_id: string;
  clinic_name: string;
}

const MOCK_PROCEDURE: ProcedureData = {
  procedure: 'REJURAN',
  procedure_at: '2026-08-12',
  clinic_id: 'clinic_001',
  clinic_name: '더나의원',
};

// ─── Screen ───────────────────────────────────────────────────

export default function ProcedureConfirmScreen() {
  const router = useRouter();
  const { setRecoverySession } = useRecoveryFlow();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery Session 생성 및 S04 이동
  const handleStart = async () => {
    try {
      setIsSubmitting(true);

      const session = await createSession({
        clinicId: MOCK_PROCEDURE.clinic_id,
        procedure: MOCK_PROCEDURE.procedure,
        procedureAt: MOCK_PROCEDURE.procedure_at,
      });

      await setSessionId(session.sessionId);
      setRecoverySession(session);
      setIsSubmitting(false);

      router.dismissTo('/');
      router.push('/(tabs)/journey/home');
    } catch {
      setIsSubmitting(false);

      Alert.alert('오류', '세션 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ───────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>시술 정보 확인</Text>

          <Text style={styles.subtitle}>
            DERNA에서 확인된 최근 시술 정보입니다.
          </Text>
        </View>

        {/* ─── Main Content ─────────────────────────── */}
        <View style={styles.content}>
          {/* 시술 정보 카드 */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DERNA에서 확인된 시술 정보</Text>

            <Text style={styles.procedureName}>{MOCK_PROCEDURE.procedure}</Text>

            <View style={styles.procedureDetails}>
              <Text style={styles.procedureDetail}>
                {formatProcedureDate(MOCK_PROCEDURE.procedure_at)} 시술
              </Text>

              <Text style={styles.procedureDetail}>
                {MOCK_PROCEDURE.clinic_name}
              </Text>
            </View>
          </View>

          {/* 안내 문구 + MALLO 캐릭터 */}
          <View style={styles.guideSection}>
            <Text style={styles.guideMessageText}>
              이 시술로 Recovery Journey를 시작해 볼까요?
            </Text>

            <Image
              accessible
              accessibilityLabel="Recovery Journey를 안내하는 MALLO 캐릭터"
              source={require('../assets/images/mallo-record-empty.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom CTA ────────────────────────────── */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color={MALLO_COLORS.core.white} />
          ) : (
            <Text style={styles.primaryButtonText}>이 시술로 시작하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function formatProcedureDate(procedureAt: string) {
  return procedureAt.replaceAll('-', '.');
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: MALLO_SPACING.xl,
    paddingBottom: MALLO_SPACING.xl,
  },

  // ─── Header ────────────────────────────────────────

  header: {
    alignItems: 'center',
    paddingTop: MALLO_SPACING.xxl,
  },

  title: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '700',
    color: MALLO_COLORS.core.ink,
    textAlign: 'center',
    marginBottom: MALLO_SPACING.md,
  },

  subtitle: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    alignSelf: 'stretch',
    fontSize: 14,
    lineHeight: 20,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
  },

  // ─── Main Content ──────────────────────────────────

  content: {
    flexGrow: 1,
    paddingTop: MALLO_SPACING.xl,
  },

  // ─── Procedure Card ────────────────────────────────

  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.support.warmGray,
    paddingVertical: MALLO_SPACING.xl,
    paddingHorizontal: MALLO_SPACING.xl,
  },

  cardLabel: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.core.red,
    marginBottom: MALLO_SPACING.lg,
    letterSpacing: 0.4,
  },

  procedureName: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    fontSize: 24,
    lineHeight: 31,
    color: MALLO_COLORS.core.ink,
  },

  procedureDetails: {
    gap: MALLO_SPACING.xs,
    marginTop: MALLO_SPACING.md,
  },

  procedureDetail: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    fontSize: 14,
    lineHeight: 20,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  // ─── Guide / Character ─────────────────────────────

  guideSection: {
    alignItems: 'center',
    marginTop: MALLO_SPACING.lg,
  },
  guideMessageText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    lineHeight: 22,
    color: MALLO_COLORS.support.charcoal,
    textAlign: 'center',
    marginTop: MALLO_SPACING.lg,

    ...Platform.select({
      web: {
        fontSize: 18,
      },
      default: {
        fontSize: 15,
      },
    }),
  },

  illustration: {
    aspectRatio: 1,

    ...Platform.select({
      web: {
        width: 250,
        maxWidth: 250,
        marginTop: -MALLO_SPACING.xxl,
      },
      default: {
        width: '42%',
        maxWidth: 300,
        marginTop: -(MALLO_SPACING.xxl * 2),
      },
    }),
  },
  // ─── Bottom CTA ────────────────────────────────────

  bottomContainer: {
    paddingHorizontal: MALLO_SPACING.xl,
    paddingTop: MALLO_SPACING.md,
    paddingBottom: MALLO_SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
    backgroundColor: MALLO_COLORS.core.white,
  },

  primaryButton: {
    height: 52,
    borderRadius: MALLO_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MALLO_COLORS.core.red,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: MALLO_COLORS.core.white,
  },
});
