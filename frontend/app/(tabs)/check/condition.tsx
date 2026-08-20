import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { MALLO_COLORS } from '@/constants/colors';
import { CheckRequestState } from '@/features/check/components/CheckRequestState';
import { CONDITION_CONFIGS, isQuickCheckAction } from '@/features/check/data';
import { formatElapsedDay } from '@/features/recovery/mock-data';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import { createCheck } from '@/services/check';

type RequestState = 'idle' | 'loading' | 'error' | 'no-protocol';

export default function ConditionCheckScreen() {
  const router = useRouter();

  const { action, actionTitle, source } = useLocalSearchParams<{
    action?: string;
    actionTitle?: string;
    source?: string;
  }>();

  const { recoverySession, saveQuickCheck } = useRecoveryFlow();

  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const [requestState, setRequestState] = useState<RequestState>('idle');

  const normalizedAction =
    typeof action === 'string' && isQuickCheckAction(action)
      ? action
      : 'EXERCISE';

  const config = CONDITION_CONFIGS[normalizedAction];

  const displayTitle = actionTitle || config.actionLabel;

  const elapsedDay = recoverySession?.elapsedDay ?? 0;

  const handleLogoPress = () => {
    router.replace('/(tabs)/journey/home');
  };

  const handleSelectAnotherAction = () => {
    router.replace('/(tabs)/check/quick');
  };

  const handleResult = async () => {
    if (!selectedValue) return;

    setRequestState('loading');

    try {
      const response = await createCheck(
        {
        action: normalizedAction,
        context: {
          [config.contextKey]: selectedValue,
        },
        },
        recoverySession?.sessionId,
      );

      if (response.status === 'NO_PROTOCOL') {
        setRequestState('no-protocol');
        return;
      }

      saveQuickCheck(response.result);

      router.replace({
        pathname: '/(tabs)/check/result',
        params: {
          checkId: response.result.checkId,
          question: config.question,
          source: source || 'quick-check',
        },
      });
    } catch {
      setRequestState('error');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 MALLO Header */}
      <View style={styles.navigation}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Recovery Journey 홈으로 이동"
          onPress={handleLogoPress}
          hitSlop={12}
          style={({ pressed }) => [
            styles.logoButton,
            pressed && styles.logoPressed,
          ]}
        >
          <Image
            accessible={false}
            source={require('../../../assets/images/mallo-logo-red.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Action / Recovery Context */}
        <View style={styles.badgeRow}>
          <View style={styles.badgeBlack}>
            <Text style={styles.badgeBlackText}>{displayTitle}</Text>
          </View>

          <View style={styles.badgeGray}>
            <Text style={styles.badgeGrayText}>
              {recoverySession?.procedureName ?? 'REJURAN'} ·{' '}
              {formatElapsedDay(elapsedDay)}
            </Text>
          </View>
        </View>

        {requestState === 'idle' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.headerLabel}>필수 조건 1개 확인</Text>

              <Text style={styles.headerQuestion}>{config.question}</Text>

              <Text style={styles.headerGuide}>{config.guide}</Text>
            </View>

            <View style={styles.optionList}>
              {config.options.map((option) => {
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
                    <View
                      style={[styles.radio, isSelected && styles.radioSelected]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>

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
          </>
        ) : requestState === 'loading' ? (
          <CheckRequestState
            description="현재 회복 단계와 선택한 조건에 맞는 기준을 찾고 있어요."
            title="Recovery Protocol을 확인하고 있어요"
            tone="loading"
          />
        ) : requestState === 'error' ? (
          <CheckRequestState
            description="결과를 불러오지 못했어요. 선택한 조건을 유지한 채 다시 확인할 수 있어요."
            onPrimaryPress={handleResult}
            primaryLabel="다시 시도하기"
            title="잠시 문제가 생겼어요"
            tone="error"
          />
        ) : (
          <CheckRequestState
            description="현재 검수된 Recovery Protocol에서는 이 조건을 안내하기 어려워요."
            onPrimaryPress={handleSelectAnotherAction}
            primaryLabel="다른 행동 확인하기"
            title="아직 안내할 수 없는 조건이에요"
            tone="unsupported"
          />
        )}
      </ScrollView>

      {requestState === 'idle' ? (
        <View style={styles.bottomContainer}>
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

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSelectAnotherAction}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>← 행동 다시 선택</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },

  navigation: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },

  logoButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoPressed: {
    opacity: 0.7,
  },

  headerLogo: {
    width: 112,
    height: 25,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },

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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,

    // S07에서는 Bottom Tab을 숨기므로 기존 100px 여백 제거
    paddingBottom: 20,

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
