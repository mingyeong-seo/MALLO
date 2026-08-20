import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createQuickCheck } from '@/api/client';
import { CheckRequestState } from '@/features/check/components/CheckRequestState';
import { styles } from '@/features/check/condition-styles';
import { CONDITION_CONFIGS, isQuickCheckAction } from '@/features/check/data';
import { resolveQuickCheckResponse } from '@/features/check/quick-check-resolution';
import { formatElapsedDay } from '@/features/recovery/mock-data';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';

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
    if (!selectedValue || recoverySession === null) {
      setRequestState('error');
      return;
    }

    setRequestState('loading');

    try {
      const response = await createQuickCheck(recoverySession.sessionId, {
        action: normalizedAction,
        context: {
          [config.contextKey]: selectedValue,
        },
      });
      const resolution = resolveQuickCheckResponse(response);

      if (resolution.kind === 'no-protocol') {
        setRequestState('no-protocol');
        return;
      }

      saveQuickCheck(resolution.result);

      router.replace({
        pathname: '/(tabs)/check/result',
        params: {
          checkId: resolution.result.checkId,
          question: config.question,
          source: source || 'quick-check',
        },
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
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
