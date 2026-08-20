import { StyleSheet } from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';

export const styles = StyleSheet.create({
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
