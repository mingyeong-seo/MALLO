import { CommonActions } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import { MALLO_COLORS } from '@/constants/colors';

// ─── Mock Data (가이드 문서 스펙 일치) ──────────────────────────

interface ProcedureData {
  procedure: string; // 시술 종류
  procedure_at: string; // 시술일
  clinic_id: string; // 시술 병원 ID
  clinic_name: string; // 시술 병원 표기명
}

const MOCK_PROCEDURE: ProcedureData = {
  procedure: 'REJURAN',
  procedure_at: '2026.08.12 시술',
  clinic_id: 'clinic_001',
  clinic_name: '더나의원',
};

// ─── Screen ───────────────────────────────────────────────────

export default function ProcedureConfirmScreen() {
  const router = useRouter();
  const rootNavigation = useNavigation('/');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery Session 생성 및 S04 이동 핸들러
  const handleStart = async () => {
    try {
      setIsSubmitting(true);

      // TODO: 추후 백엔드 Session 생성 API 연동
      // 1. API 호출 후 response로 { session_id, elapsed_day, status } 수신
      // 2. await SecureStore.setItemAsync('session_id', response.session_id);

      // 현재는 mock 성공 딜레이 후 S04로 이동
      setTimeout(() => {
        setIsSubmitting(false);
        rootNavigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: '(tabs)',
                state: {
                  index: 0,
                  routes: [
                    {
                      name: 'journey',
                      state: {
                        index: 0,
                        routes: [{ name: 'home' }],
                      },
                    },
                  ],
                },
              },
            ],
          }),
        );
      }, 500);
    } catch {
      setIsSubmitting(false);
      Alert.alert('오류', '세션 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ─── 상단 네비게이션 ────────────────────────── */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={isSubmitting}
        >
          <Text style={styles.backText}>← 이전</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 헤더 ──────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>시술 정보 확인</Text>
          <Text style={styles.subtitle}>
            DERNA에서 확인된 최근 시술 정보입니다.{'\n'}내용을 확인해주세요.
          </Text>
        </View>

        {/* ─── 시술 정보 카드 ────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DERNA에서 불러온 시술 정보</Text>
          <Text style={styles.procedureName}>{MOCK_PROCEDURE.procedure}</Text>
          <Text style={styles.procedureDetail}>
            {MOCK_PROCEDURE.procedure_at}
          </Text>
          <Text style={styles.procedureDetail}>
            {MOCK_PROCEDURE.clinic_name}
          </Text>
        </View>
      </ScrollView>

      {/* ─── 하단 CTA 버튼 ─────────────────────────── */}
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

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },
  navigation: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: MALLO_COLORS.core.ink,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Header
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: MALLO_COLORS.core.ink,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Card
  card: {
    borderWidth: 1.5,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: 16,
    backgroundColor: MALLO_COLORS.core.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MALLO_COLORS.support.secondaryTextGray,
    marginBottom: 14,
  },
  procedureName: {
    fontSize: 22,
    fontWeight: '700',
    color: MALLO_COLORS.core.ink,
    marginBottom: 8,
  },
  procedureDetail: {
    fontSize: 14,
    color: MALLO_COLORS.support.secondaryTextGray,
    lineHeight: 22,
  },

  // Bottom Buttons
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
    backgroundColor: MALLO_COLORS.core.white,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MALLO_COLORS.core.ink,
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
