import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export type ActionType = 'EXERCISE' | 'MAKEUP' | 'CLEANSING' | 'SKINCARE' | 'HEAT';

interface ActionItem {
  id: ActionType;
  emoji: string;
  actionTitle: string;
  requiresCondition: boolean;
}

const ACTION_LIST: ActionItem[] = [
  { id: 'EXERCISE', emoji: '🏃', actionTitle: '운동', requiresCondition: true },
  { id: 'MAKEUP', emoji: '💄', actionTitle: '화장', requiresCondition: true },
  { id: 'CLEANSING', emoji: '💧', actionTitle: '세안', requiresCondition: true },
  { id: 'SKINCARE', emoji: '🧴', actionTitle: '스킨케어', requiresCondition: true },
  { id: 'HEAT', emoji: '🔥', actionTitle: '열 자극', requiresCondition: false },
];

export default function QuickCheckScreen() {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);

  const handleNext = () => {
    if (!selectedAction) return;

    if (selectedAction.requiresCondition) {
      router.push({
        pathname: '/(tabs)/check/condition',
        params: {
          action: selectedAction.id,
          actionTitle: selectedAction.actionTitle,
        },
      });
    } else {
      router.push({
        pathname: '/(tabs)/check/result',
        params: {
          action: selectedAction.id,
          condition: 'NONE',
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 상단 네비게이션 */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>← 이전</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Quick Check</Text>
        <View style={styles.backButton} />
      </View>

      {/* 스크롤 콘텐츠 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>어떤 행동을 확인할까요?</Text>
          <Text style={styles.headerDescription}>
            {'REJURAN · DAY 3 Recovery Protocol 기준으로 확인합니다.\n하나의 행동을 선택해주세요.'}
          </Text>
        </View>

        {/* 2열 그리드 */}
        <View style={styles.grid}>
          {ACTION_LIST.map((item) => {
            const isSelected = selectedAction?.id === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
                onPress={() => setSelectedAction(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <Text
                  style={[
                    styles.cardTitle,
                    isSelected && styles.cardTitleSelected,
                  ]}
                >
                  {item.actionTitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 하단 버튼 영역 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.bottomButton,
            selectedAction ? styles.bottomButtonActive : styles.bottomButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedAction}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.bottomButtonText,
              selectedAction
                ? styles.bottomButtonTextActive
                : styles.bottomButtonTextDisabled,
            ]}
          >
            {selectedAction
              ? '다음으로 이동'
              : '행동을 선택하면 다음으로 이동합니다'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navigation: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    lineHeight: 30,
  },
  headerDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48%',
    aspectRatio: 1.15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: '#111111',
    backgroundColor: '#FAFAFA',
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardTitleSelected: {
    fontWeight: '700',
    color: '#000000',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90, // 플로팅 하단 탭바 겹침 방지
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bottomButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonActive: {
    backgroundColor: '#111111',
  },
  bottomButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  bottomButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomButtonTextActive: {
    color: '#FFFFFF',
  },
  bottomButtonTextDisabled: {
    color: '#8E8E93',
  },
});