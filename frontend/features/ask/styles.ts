import { Platform, StyleSheet } from 'react-native';

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

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: MALLO_SPACING.xl,
    paddingTop: Platform.OS === 'web' ? MALLO_SPACING.lg : MALLO_SPACING.md,
    paddingBottom: MALLO_SPACING.xl,
  },

  header: {
    minHeight: 54,
    justifyContent: 'center',
    paddingBottom: MALLO_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },

  headerLogo: {
    width: 112,
    height: 25,
    alignSelf: 'center',
  },

  contextSection: {
    flexDirection: 'row',
    alignItems: 'center',
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

  stateContent: {
    flex: 1,
  },

  introSection: {
    marginTop: MALLO_SPACING.xl,
  },

  introTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
  },

  screenTitle: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    color: MALLO_COLORS.core.ink,
  },

  screenDescription: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'web' ? 40 : 24,
    marginBottom: Platform.OS === 'web' ? 12 : 6,
  },

  askIllustration: {
    width: Platform.OS === 'web' ? 260 : 220,
    height: Platform.OS === 'web' ? 260 : 220,
  },

  askGuide: {
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 20 : 8,
    marginBottom: Platform.OS === 'web' ? 24 : 12,
  },

  askGuideTextContainer: {
    alignItems: 'center',
    paddingVertical: Platform.OS === 'web' ? 14 : 8,
  },

  askGuideTitle: {
    ...MALLO_TYPOGRAPHY.body,
    fontWeight: '700',
    color: MALLO_COLORS.support.charcoal,
    textAlign: 'center',
    marginBottom: 4,
  },

  askGuideHighlight: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: MALLO_COLORS.core.red,
    textAlign: 'center',
    marginBottom: 6,
  },

  askGuideSub: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
  },

  askGuideDivider: {
    width: '72%',
    alignItems: 'center',
  },

  askGuideLine: {
    width: '100%',
    height: 1,
    backgroundColor: MALLO_COLORS.support.mistGray,
  },

  askGuideIcon: {
    width: 30,
    height: 30,
    borderRadius: MALLO_RADIUS.full,
  },

  askGuideCopy: {
    flex: 1,
  },

  askGuideName: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.core.red,
  },

  askGuideText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: 3,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  followUpDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.sm,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  followUpIllustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',

    marginTop: Platform.OS === 'web' ? 42 : 24,
    marginBottom: Platform.OS === 'web' ? 28 : 20,
  },

  followUpIllustration: {
    width: Platform.OS === 'web' ? 230 : 200,
    height: Platform.OS === 'web' ? 230 : 200,
  },

  questionRecall: {
    marginTop: MALLO_SPACING.xl,

    minHeight: 64,
    justifyContent: 'center',

    borderLeftWidth: 3,
    borderLeftColor: '#C86A59',

    paddingLeft: MALLO_SPACING.md,
    paddingRight: MALLO_SPACING.md,
    paddingVertical: 10,

    backgroundColor:
      Platform.OS === 'web'
        ? 'rgba(180, 68, 51, 0.055)'
        : 'rgba(180, 68, 51, 0.035)',
  },

  questionRecallLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    fontSize: 14,
    lineHeight: 20,
    color: MALLO_COLORS.core.red,
  },

  questionRecallText: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: MALLO_COLORS.support.charcoal,
  },
  followUpSection: {
    marginTop: Platform.OS === 'web' ? 28 : 24,
  },

  malloIdentityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MALLO_SPACING.sm,
  },

  malloIcon: {
    width: 34,
    height: 34,
    borderRadius: MALLO_RADIUS.full,
  },

  malloIdentityCopy: {
    flex: 1,
  },

  malloName: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.core.red,
  },

  malloRole: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: 3,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  followUpTitle: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: 0,
    color: MALLO_COLORS.core.ink,
  },

  loadingStateContent: {
    flex: 1,
  },

  followUpKeyword: {
    color: MALLO_COLORS.core.red,
  },

  loadingBody: {
    flex: Platform.OS === 'web' ? 0 : 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'web' ? 40 : 28,
    paddingBottom: Platform.OS === 'web' ? MALLO_SPACING.xxl : MALLO_SPACING.xl,
  },
  loadingCharacterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },

  loadingCharacterComplete: {
    backgroundColor: 'rgba(180, 68, 51, 0.08)',
    padding: Platform.OS === 'web' ? 18 : 14,
  },

  loadingCharacter: {
    width: Platform.OS === 'web' ? 280 : 200,
    height: Platform.OS === 'web' ? 280 : 200,
  },

  loadingTitle: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,

    // 앱에서 캐릭터와 제목 사이가 조금 넓어서 줄임
    marginTop: Platform.OS === 'web' ? 8 : 8,

    fontSize: Platform.OS === 'web' ? 30 : 28,
    lineHeight: Platform.OS === 'web' ? 38 : 34,
    color: MALLO_COLORS.core.ink,
    textAlign: 'center',
  },

  loadingTitleAccent: {
    color: MALLO_COLORS.core.red,
  },

  loadingDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,

    marginTop: Platform.OS === 'web' ? MALLO_SPACING.md : 14,

    fontSize: Platform.OS === 'web' ? 15 : 14,
    lineHeight: Platform.OS === 'web' ? 22 : 20,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
  },

  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,

    // 앱에서는 설명과 점을 조금 더 붙임
    marginTop: Platform.OS === 'web' ? MALLO_SPACING.lg : 14,
  },

  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.mistGray,
  },

  loadingDotActive: {
    backgroundColor: MALLO_COLORS.core.red,
  },

  optionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: MALLO_SPACING.lg,
  },

  optionCardHovered: {
    borderColor: 'rgba(180, 68, 51, 0.28)',
    backgroundColor: 'rgba(180, 68, 51, 0.045)',
  },

  optionCardPressed: {
    borderColor: 'rgba(180, 68, 51, 0.38)',
    backgroundColor: 'rgba(180, 68, 51, 0.08)',
    opacity: 0.9,
  },

  optionCard: {
    flex: 1,
    flexBasis: '30%',
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 12,

    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.white,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,

    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 6px rgba(26, 26, 26, 0.06)',
        }
      : {}),
  },

  optionRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.md,
  },

  optionCopy: {
    flex: 1,
  },

  optionLabel: {
    ...MALLO_TYPOGRAPHY.body,
    fontWeight: '600',
    color: MALLO_COLORS.support.charcoal,
    textAlign: 'center',
  },

  optionDescription: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: 4,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },

  resetButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,

    marginTop: Platform.OS === 'web' ? 46 : 20,

    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
  },

  resetButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.support.charcoal,
  },

  suggestionPanel: {
    marginBottom: Platform.OS === 'web' ? MALLO_SPACING.sm : MALLO_SPACING.md,

    overflow: 'hidden',

    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.core.white,

    shadowColor: MALLO_COLORS.core.ink,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,

    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px -3px 12px rgba(26, 26, 26, 0.07)',
        }
      : {}),
  },

  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MALLO_SPACING.xs,
    paddingHorizontal: MALLO_SPACING.md,
    paddingTop: MALLO_SPACING.md,
    paddingBottom: MALLO_SPACING.sm,
  },

  suggestionHeaderCopy: {
    flex: 1,
  },

  suggestionTitle: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.charcoal,
  },

  suggestionList: {
    paddingHorizontal: MALLO_SPACING.md,
  },

  suggestionRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
    paddingVertical: MALLO_SPACING.sm,
  },

  suggestionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },

  suggestionText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    flex: 1,
    color: MALLO_COLORS.support.charcoal,
  },

  suggestionHint: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: 3,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  composerArea: {
    paddingHorizontal: MALLO_SPACING.xl,
    paddingTop: MALLO_SPACING.sm,
    backgroundColor: MALLO_COLORS.core.white,
  },

  inputNotice: {
    ...MALLO_TYPOGRAPHY.caption,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginBottom: MALLO_SPACING.sm,
    color: MALLO_COLORS.core.red,
  },

  composerShell: {
    minHeight: 54,
    paddingHorizontal: MALLO_SPACING.sm,
    paddingVertical: MALLO_SPACING.xs,

    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.lg,

    backgroundColor: MALLO_COLORS.support.warmGray,

    shadowColor: MALLO_COLORS.core.ink,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,

    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 8px rgba(26, 26, 26, 0.06)',
        }
      : {}),
  },

  composerInputRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
  },

  input: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    minHeight: 44,
    maxHeight: 92,
    flex: 1,
    paddingTop: 11,
    paddingBottom: 9,
    color: MALLO_COLORS.core.ink,
  },

  sendButton: {
    width: Platform.OS === 'web' ? 44 : 38,
    height: Platform.OS === 'web' ? 44 : 38,

    alignItems: 'center',
    justifyContent: 'center',

    transform: [
      {
        translateY: Platform.OS === 'web' ? -2 : 0,
      },
    ],

    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.red,
  },

  sendButtonDisabled: {
    backgroundColor: MALLO_COLORS.support.mistGray,
  },

  pressed: {
    opacity: 0.68,
  },

  loadingQuestionRecallWeb: {
    marginTop: 16,
  },

  loadingQuestionRecallLabelWeb: {
    fontSize: 14,
    lineHeight: 20,
  },

  loadingQuestionRecallTextWeb: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },

  followUpMainContent: {
    marginTop: Platform.OS === 'web' ? 0 : 1,
  },

  attachmentPreviewRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 2,
  },

  attachmentPreview: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.white,
  },

  attachmentRemoveIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },

  attachmentButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },

  askStatusBody: {
    alignItems: 'center',
    marginTop: MALLO_SPACING.xxl,
    paddingVertical: MALLO_SPACING.xl,
  },

  askStatusIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.redTint,
  },

  askStatusTitle: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.lg,
    textAlign: 'center',
    color: MALLO_COLORS.core.ink,
  },

  askStatusDescription: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    maxWidth: 320,
    marginTop: MALLO_SPACING.sm,
    textAlign: 'center',
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  askStatusPrimary: {
    minHeight: 52,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },

  askStatusPrimaryText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },

  askStatusReset: {
    alignSelf: 'stretch',
    marginTop: MALLO_SPACING.md,
  },

  matchedContextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.lg,
  },

  matchedContextChip: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },

  matchedContextText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.charcoal,
  },

  matchedConditionChip: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderWidth: 1,
    borderColor: MALLO_COLORS.core.red,
    borderRadius: MALLO_RADIUS.full,
  },

  matchedConditionText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.core.red,
  },

  matchedResultSection: {
    marginTop: MALLO_SPACING.xl,
  },

  matchedDecisionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderWidth: 1,
    borderRadius: MALLO_RADIUS.full,
  },

  matchedDecisionText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
  },

  matchedHeadline: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.lg,
    color: MALLO_COLORS.core.ink,
  },

  matchedSection: {
    marginTop: MALLO_SPACING.xl,
    paddingTop: MALLO_SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },

  matchedSectionTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },

  matchedBodyText: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  matchedProtocolCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MALLO_SPACING.md,
    marginTop: MALLO_SPACING.md,
    padding: MALLO_SPACING.lg,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },

  matchedProtocolIndex: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },

  matchedProtocolIndexText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  matchedProtocolText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    flex: 1,
    color: MALLO_COLORS.support.charcoal,
  },

  matchedResetButton: {
    marginTop: MALLO_SPACING.xl,
  },
});
