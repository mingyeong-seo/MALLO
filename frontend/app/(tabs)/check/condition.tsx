import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {MALLO_COLORS} from '@/constants/colors';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ConditionOption {
  label: string;
  description: string;
  value: string;
}

// ─── Data ───────────────────────────────────────────────────────────────────────

const CONDITION_OPTIONS: ConditionOption[] = [
  {
    label: '가벼운 활동',
    description: '산책, 스트레칭 — 땀이 나지 않는 수준',
    value: 'LOW',
  },
  {
    label: '중간 강도',
    description: '조깅, 헬스 — 약간 숨이 찰 정도',
    value: 'MEDIUM',
  },
  {
    label: '고강도',
    description: 'HIIT, PT — 온몸에 땀이 나는 수준',
    value: 'HIGH',
  },
];

// ─── Screen ─────────────────────────────────────────────────────────────────────

export default function ConditionCheckScreen() {
  const router = useRouter();
  const { action, actionTitle } = useLocalSearchParams<{
    action: string;
    actionTitle: string;
  }>();

  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const displayTitle = actionTitle || '운동';

  const handleResult = () => {
    if (!selectedValue) return;

    router.push({
      pathname: '/(tabs)/check/result',
      params: {
        action: action || 'EXERCISE',
        condition: selectedValue,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── 상단 네비게이션 ─────────────────────────────────── */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>← Quick Check</Text>
        </TouchableOpacity>
        <View style={styles.logoContainer} pointerEvents="none">
          <Image
            accessible
            accessibilityLabel="MALLO"
            source={require('../../../assets/images/mallo-logo-red.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    

      {/* ─── 스크롤 콘텐츠 ─────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 뱃지 영역 */}
        <View style={styles.badgeRow}>
          <View style={styles.badgeBlack}>
            <Text style={styles.badgeBlackText}>{displayTitle}</Text>
          </View>
          <View style={styles.badgeGray}>
            <Text style={styles.badgeGrayText}>REJURAN · DAY 3</Text>
          </View>
        </View>

        {/* 헤더 영역 */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>필수 조건 1개 확인</Text>
          <Text style={styles.headerQuestion}>
            {'오늘 하려는 운동 강도는\n어느 정도인가요?'}
          </Text>
          <Text style={styles.headerGuide}>
            {'Recovery Protocol은 운동 강도에 따라\n다른 기준을 적용합니다.'}
          </Text>
        </View>

        {/* 조건 선택 리스트 */}
        <View style={styles.optionList}>
          {CONDITION_OPTIONS.map((option) => {
            const isSelected = selectedValue === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedValue(option.value)}
                activeOpacity={0.7}
              >
                {/* 라디오 버튼 */}
                <View
                  style={[
                    styles.radio,
                    isSelected && styles.radioSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                {/* 텍스트 영역 */}
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ─── 하단 버튼 ─────────────────────────────────────── */}
      <View style={styles.bottomContainer}>
        {/* 결과 확인 버튼 */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            selectedValue
              ? styles.primaryButtonActive
              : styles.primaryButtonDisabled,
          ]}
          onPress={handleResult}
          disabled={!selectedValue}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.primaryButtonText,
              selectedValue
                ? styles.primaryButtonTextActive
                : styles.primaryButtonTextDisabled,
            ]}
          >
            결과 확인 →
          </Text>
        </TouchableOpacity>

        {/* 행동 다시 선택 버튼 */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>← 행동 다시 선택</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },

  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
    position: 'relative',
  },
  backButton: {
    zIndex: 1,
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 15,
    color: MALLO_COLORS.core.ink,
    fontWeight: '500',
  },
  headerLogo: {
    width: 112,
    height: 25,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },

  // Badge
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  badgeBlack: {
    backgroundColor: MALLO_COLORS.core.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeBlackText: {
    fontSize: 13,
    fontWeight: '600',
    color: MALLO_COLORS.core.white,
  },
  badgeGray: {
    backgroundColor: MALLO_COLORS.support.warmGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeGrayText: {
    fontSize: 13,
    fontWeight: '500',
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  // Header
  header: {
    marginBottom: 28,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MALLO_COLORS.core.red,
    marginBottom: 8,
  },
  headerQuestion: {
    fontSize: 22,
    fontWeight: '700',
    color: MALLO_COLORS.core.ink,
    lineHeight: 32,
    marginBottom: 12,
  },
  headerGuide: {
    fontSize: 14,
    color: MALLO_COLORS.support.secondaryTextGray,
    lineHeight: 22,
  },

  // Option List
  optionList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: MALLO_COLORS.support.mistGray,
    backgroundColor: MALLO_COLORS.core.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: MALLO_COLORS.core.red,
    backgroundColor: MALLO_COLORS.support.redTint,
    shadowColor: MALLO_COLORS.core.red,
    shadowOpacity: 0.1,
  },

  // Radio
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: MALLO_COLORS.support.mistGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioSelected: {
    borderColor: MALLO_COLORS.core.red,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: MALLO_COLORS.core.red,
  },

  // Option Text
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: MALLO_COLORS.core.ink,
    marginBottom: 4,
  },
  optionLabelSelected: {
    fontWeight: '700',
    color: MALLO_COLORS.core.red,
  },
  optionDescription: {
    fontSize: 13,
    color: MALLO_COLORS.support.secondaryTextGray,
    lineHeight: 18,
  },

  // Bottom Buttons
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
    backgroundColor: MALLO_COLORS.core.white,
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonActive: {
    backgroundColor: MALLO_COLORS.core.red,
  },
  primaryButtonDisabled: {
    backgroundColor: MALLO_COLORS.support.mistGray,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonTextActive: {
    color: MALLO_COLORS.core.white,
  },
  primaryButtonTextDisabled: {
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: MALLO_COLORS.support.mistGray,
    backgroundColor: MALLO_COLORS.core.white,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: MALLO_COLORS.support.secondaryTextGray,
  },
});