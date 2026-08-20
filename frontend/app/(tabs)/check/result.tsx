import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { MALLO_COLORS } from '@/constants/colors';
import {
  MALLO_SPACING,
} from '@/constants/theme';
import { CheckRequestState } from '@/features/check/components/CheckRequestState';
import { ProtocolEvidenceCard } from '@/features/check/components/ProtocolEvidenceCard';
import { ACTION_LABELS } from '@/features/check/data';
import { styles } from '@/features/check/result-styles';
import { formatElapsedDay } from '@/features/recovery/mock-data';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import type { QuickCheckDecision } from '@/features/recovery/types';

type RouteParams = {
  checkId?: string;
  question?: string;
  source?: string;
};

const DECISION_LABELS: Record<QuickCheckDecision, string> = {
  POSSIBLE: '진행 가능',
  ADJUST: '조절 필요',
  POSTPONE: '오늘 미루기',
  CONNECT: '의료진 확인',
};

const DECISION_COLORS: Record<QuickCheckDecision, string> = {
  POSSIBLE: MALLO_COLORS.semantic.possible,
  ADJUST: MALLO_COLORS.semantic.adjust,
  POSTPONE: MALLO_COLORS.semantic.postpone,
  CONNECT: MALLO_COLORS.semantic.connect,
};

export default function QuickCheckResultScreen() {
  const params = useLocalSearchParams<RouteParams>();
  const insets = useSafeAreaInsets();
  const { findQuickCheck, recoverySession } = useRecoveryFlow();
  const result = params.checkId ? findQuickCheck(params.checkId) : undefined;
  const floatingTabClearance =
    MALLO_SPACING.xxl * 2 +
    Math.max(insets.bottom, MALLO_SPACING.md) +
    MALLO_SPACING.lg;

  if (!result) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View
          style={[
            styles.stateContainer,
            { paddingBottom: floatingTabClearance },
          ]}
        >
          <CheckRequestState
            description="저장된 Quick Check 결과를 찾지 못했어요. 행동을 다시 선택해 주세요."
            onPrimaryPress={() => router.replace('/(tabs)/check/quick')}
            primaryLabel="Quick Check로 돌아가기"
            title="결과를 불러올 수 없어요"
            tone="error"
          />
        </View>
      </SafeAreaView>
    );
  }

  const procedureName = recoverySession?.procedureName ?? 'REJURAN';
  const elapsedDay = recoverySession?.elapsedDay ?? 0;
  const actionLabel = ACTION_LABELS[result.action];
  const decisionColor = DECISION_COLORS[result.decision];
  const isConnect = result.decision === 'CONNECT';

  const handlePrimaryAction = () => {
    if (isConnect) {
      router.push({
        pathname: '/(tabs)/ask/consultation',
        params: {
          question: params.question ?? result.headline,
          source: 'quick-check-result',
        },
      });
      return;
    }

    router.replace('/(tabs)/check');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: floatingTabClearance },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Recovery Journey 홈으로 이동"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.replace('/(tabs)/journey/home')}
            style={({ pressed }) => [
              styles.logoButton,
              pressed && styles.pressed,
            ]}
          >
            <Image
              accessible={false}
              resizeMode="contain"
              source={require('../../../assets/images/mallo-logo-red.png')}
              style={styles.logo}
            />
          </Pressable>
        </View>

        <View style={styles.contextRow}>
          <View style={styles.contextChip}>
            <Text style={styles.contextText}>{procedureName}</Text>
          </View>
          <View style={styles.contextChip}>
            <Text style={styles.contextText}>
              {formatElapsedDay(elapsedDay)}
            </Text>
          </View>
          <View style={styles.contextChip}>
            <Text style={styles.contextText}>{actionLabel}</Text>
          </View>
          <View style={styles.conditionChip}>
            <Text style={styles.conditionText}>{result.contextLabel}</Text>
          </View>
        </View>

        {params.question ? (
          <View style={styles.questionRecall}>
            <Text style={styles.questionLabel}>확인한 질문</Text>
            <Text style={styles.questionText}>“{params.question}”</Text>
          </View>
        ) : null}

        <View style={styles.resultSection}>
          <View
            style={[
              styles.decisionBadge,
              {
                borderColor: decisionColor,
                backgroundColor: `${decisionColor}14`,
              },
            ]}
          >
            <Text style={[styles.decisionText, { color: decisionColor }]}>
              {DECISION_LABELS[result.decision]}
            </Text>
          </View>

          <Text style={styles.headline}>{result.headline}</Text>

          {isConnect ? (
            <Text style={styles.connectNotice}>
              일반 Recovery Protocol만으로 안내하기 어려운 내용이라 의료진
              확인이 필요해요.
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>왜 이런 결과인가요?</Text>
          <Text style={styles.bodyText}>{result.reason}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recovery Protocol 근거</Text>
          <ProtocolEvidenceCard />
          {result.protocolVersion ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Protocol version</Text>
              <Text style={styles.metaValue}>{result.protocolVersion}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>저장 시점</Text>
            <Text style={styles.metaValue}>
              {formatCreatedAt(result.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>다음 행동</Text>

          {!isConnect ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/journey/record',
                  params: { checkId: result.checkId },
                })
              }
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.pressed,
              ]}
            >
              <View>
                <Text style={styles.secondaryActionTitle}>오늘 기록하기</Text>
                <Text style={styles.secondaryActionMeta}>선택 사항</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={MALLO_COLORS.support.secondaryTextGray}
              />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={handlePrimaryAction}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isConnect ? '의료진에게 문의하기' : '확인'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={MALLO_COLORS.core.white}
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
