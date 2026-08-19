import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';
import {
  MALLO_RADIUS,
  MALLO_SPACING,
  MALLO_TYPOGRAPHY,
} from '@/constants/theme';

type CheckRequestStateProps = {
  description: string;
  onPrimaryPress?: () => void;
  primaryLabel?: string;
  title: string;
  tone: 'loading' | 'error' | 'unsupported';
};

export function CheckRequestState({
  description,
  onPrimaryPress,
  primaryLabel,
  title,
  tone,
}: CheckRequestStateProps) {
  const icon =
    tone === 'loading'
      ? 'search-outline'
      : tone === 'error'
        ? 'refresh-outline'
        : 'document-text-outline';

  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon}
          size={25}
          color={
            tone === 'error'
              ? MALLO_COLORS.semantic.connect
              : MALLO_COLORS.core.red
          }
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {onPrimaryPress && primaryLabel ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPrimaryPress}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>{primaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MALLO_SPACING.xl,
    paddingVertical: MALLO_SPACING.xxl,
  },
  iconContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: MALLO_SPACING.lg,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  title: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    color: MALLO_COLORS.core.ink,
    textAlign: 'center',
  },
  description: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    maxWidth: 310,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
  },
  button: {
    minWidth: 180,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MALLO_SPACING.xl,
    paddingHorizontal: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },
  buttonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },
  pressed: {
    opacity: 0.68,
  },
});
