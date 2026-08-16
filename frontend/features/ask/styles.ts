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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  askGuideLine: {
    flex: 1,
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
    marginTop: 24,
    marginBottom: 20,
  },

  followUpIllustration: {
    width: 230,
    height: 230,
  },

  questionRecall: {
    marginTop: MALLO_SPACING.xl,
  },

  questionRecallLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.core.red,
  },

  questionRecallText: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    fontWeight: '600',
    color: MALLO_COLORS.support.charcoal,
  },

  followUpSection: {
    marginTop: 0,
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

  questionFlowLine: {
    width: 2,
    height: 18,
    marginLeft: 8,
    marginTop: 8,
    marginBottom: 18,
    borderRadius: 1,
    backgroundColor: MALLO_COLORS.support.mistGray,
  },

  followUpKeyword: {
    color: MALLO_COLORS.core.red,
  },

  optionList: {
    flexDirection: 'row',
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

  protocolNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.lg,
    paddingVertical: MALLO_SPACING.md,
  },

  protocolNoteText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    flex: 1,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  resetButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,
    marginTop: 20,

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,

    paddingLeft: MALLO_SPACING.lg,
    paddingRight: MALLO_SPACING.xs,
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

  // =====================================================
  // STATE C - 공통 스타일
  // =====================================================

  quickAnswerStateContent: {
    flex: 1,
  },

  quickAnswerSection: {
    marginTop: 0,
  },

  quickAnswerEyebrow: {
    ...MALLO_TYPOGRAPHY.caption,
    fontWeight: '600',
    color: MALLO_COLORS.core.red,
  },

  quickAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
    marginTop: 10,
  },

  quickAnswerTitle: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
    color: MALLO_COLORS.core.ink,
  },

  quickAnswerDescription: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  quickAnswerProtocol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
  },

  quickAnswerProtocolText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  quickAnswerDetailButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },

  quickAnswerDetailButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },

  quickAnswerNextGuide: {
    alignItems: 'center',
  },

  quickAnswerNextTitle: {
    ...MALLO_TYPOGRAPHY.body,
    fontWeight: '700',
    color: MALLO_COLORS.support.charcoal,
    textAlign: 'center',
  },

  quickAnswerNextDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    marginTop: 4,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
  },

  // =====================================================
  // STATE C - WEB 전용
  // =====================================================

  questionRecallWeb: {
    marginTop: 56,
  },

  quickAnswerStateRestingWeb: {
    justifyContent: 'flex-start',
    paddingBottom: 24,
  },

  quickAnswerDescriptionWeb: {
    marginTop: 28,
  },

  quickAnswerProtocolWeb: {
    marginTop: 30,
  },

  quickAnswerDetailButtonWeb: {
    marginTop: 34,
  },

  quickAnswerNextGuideWeb: {
    marginTop: 34,
    marginBottom: 24,
  },

  // =====================================================
  // STATE C - APP 전용
  // =====================================================

  quickAnswerStateRestingNative: {
    justifyContent: 'flex-start',
    paddingTop: 12,
  },

  quickAnswerDescriptionNative: {
    marginTop: 18,
  },

  quickAnswerProtocolNative: {
    marginTop: 18,
  },

  quickAnswerDetailButtonNative: {
    marginTop: 24,
  },

  quickAnswerNextGuideNative: {
    marginTop: 24,
  },
});
