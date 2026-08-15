import { Platform, type TextStyle } from 'react-native';

type WebTextStyle = TextStyle & {
  wordBreak?: 'keep-all';
};

const koreanWordWrap: WebTextStyle =
  Platform.OS === 'web'
    ? {
        wordBreak: 'keep-all',
      }
    : {};

export const MALLO_TEXT_STYLES = {
  koreanWordWrap,
} as const;
