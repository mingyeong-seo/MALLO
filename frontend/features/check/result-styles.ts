import { StyleSheet } from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';
import { MALLO_TEXT_STYLES } from '@/constants/text-styles';
import {
  MALLO_RADIUS,
  MALLO_SPACING,
  MALLO_TYPOGRAPHY,
} from '@/constants/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },
  stateContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: MALLO_SPACING.xl,
  },
  header: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },
  logoButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 112,
    height: 25,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MALLO_SPACING.sm,
    paddingTop: MALLO_SPACING.lg,
  },
  contextChip: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  contextText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.charcoal,
  },
  conditionChip: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderWidth: 1,
    borderColor: MALLO_COLORS.core.red,
    borderRadius: MALLO_RADIUS.full,
  },
  conditionText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.core.red,
  },
  questionRecall: {
    marginTop: MALLO_SPACING.xl,
    paddingVertical: MALLO_SPACING.md,
    paddingHorizontal: MALLO_SPACING.md,
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
  resultSection: {
    marginTop: MALLO_SPACING.xl,
  },
  decisionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderWidth: 1,
    borderRadius: MALLO_RADIUS.full,
  },
  decisionText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
  },
  headline: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.lg,
    color: MALLO_COLORS.core.ink,
  },
  connectNotice: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  section: {
    marginTop: MALLO_SPACING.xl,
    paddingTop: MALLO_SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },
  sectionTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },
  bodyText: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  protocolCard: {
    gap: MALLO_SPACING.md,
    marginTop: MALLO_SPACING.md,
    padding: MALLO_SPACING.lg,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MALLO_SPACING.md,
  },
  protocolIndex: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },
  protocolIndexText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  protocolCopy: {
    flex: 1,
    gap: MALLO_SPACING.xs,
  },
  protocolTitle: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    fontWeight: '600',
    color: MALLO_COLORS.support.charcoal,
  },
  protocolText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    color: MALLO_COLORS.support.charcoal,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: MALLO_SPACING.lg,
    marginTop: MALLO_SPACING.md,
  },
  metaLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  metaValue: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.charcoal,
  },
  secondaryAction: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
  },
  secondaryActionTitle: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    color: MALLO_COLORS.support.charcoal,
  },
  secondaryActionMeta: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.lg,
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
