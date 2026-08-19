import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';
import { styles } from '@/features/ask/styles';

type AskStatusStateProps = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPrimaryPress?: () => void;
  onReset: () => void;
  primaryLabel?: string;
  question: string;
  title: string;
};

export function AskStatusState({
  description,
  icon,
  onPrimaryPress,
  onReset,
  primaryLabel,
  question,
  title,
}: AskStatusStateProps) {
  return (
    <View style={styles.stateContent}>
      <View style={styles.questionRecall}>
        <Text style={styles.questionRecallLabel}>오늘 내가 궁금한 것</Text>
        <Text style={styles.questionRecallText}>“{question}”</Text>
      </View>

      <View style={styles.askStatusBody}>
        <View style={styles.askStatusIcon}>
          <Ionicons name={icon} size={24} color={MALLO_COLORS.core.red} />
        </View>
        <Text style={styles.askStatusTitle}>{title}</Text>
        <Text style={styles.askStatusDescription}>{description}</Text>

        {primaryLabel && onPrimaryPress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onPrimaryPress}
            style={({ pressed }) => [
              styles.askStatusPrimary,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.askStatusPrimaryText}>{primaryLabel}</Text>
            <Ionicons name="arrow-forward" size={18} color={MALLO_COLORS.core.white} />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          style={({ pressed }) => [styles.resetButton, styles.askStatusReset, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={17} color={MALLO_COLORS.support.charcoal} />
          <Text style={styles.resetButtonText}>질문 다시 입력하기</Text>
        </Pressable>
      </View>
    </View>
  );
}
