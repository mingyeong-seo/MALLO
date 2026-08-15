import type { TextStyle } from 'react-native';

export const MALLO_TYPOGRAPHY = {
  brand: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  secondaryBody: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
} as const satisfies Record<string, TextStyle>;

export const MALLO_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const MALLO_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
} as const;
