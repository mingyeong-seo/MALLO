import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';

import { styles } from '@/features/ask/styles';

/**
 * 정보를 확인하는 동안 반복해서 보여줄 캐릭터
 *
 * thinking ↔ searching
 */
const LOADING_IMAGES = [
  require('../../../assets/images/mallo-character-thinking.png'),
  require('../../../assets/images/mallo-character-searching.png'),
];

/**
 * Protocol 확인 완료 상태
 */
const CHECKED_IMAGE = require('../../../assets/images/mallo-character-checked.png');

/**
 * THINK / SEARCH 각각을 약 1초씩 보여줍니다.
 * 실제 ASK API 요청이 진행되는 동안에만 반복합니다.
 */
const LOADING_IMAGE_INTERVAL_MS = 1000;

export function AskLoadingState({
  question,
  isComplete,
}: {
  question: string;
  isComplete: boolean;
}) {
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (isComplete) {
      return;
    }

    const interval = setInterval(() => {
      setLoadingStep((previous) => (previous + 1) % LOADING_IMAGES.length);
    }, LOADING_IMAGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isComplete]);

  return (
    <View style={[styles.stateContent, styles.loadingStateContent]}>
      <View style={styles.questionRecall}>
        <Text style={styles.questionRecallLabel}>오늘 내가 궁금한 것</Text>

        <Text style={styles.questionRecallText}>“{question}”</Text>
      </View>

      <View style={styles.loadingBody}>
        <View
          style={[
            styles.loadingCharacterContainer,
            isComplete && styles.loadingCharacterComplete,
          ]}
        >
          <Image
            accessible={false}
            source={isComplete ? CHECKED_IMAGE : LOADING_IMAGES[loadingStep]}
            style={styles.loadingCharacter}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.loadingTitle}>
          {isComplete ? (
            <>
              <Text style={styles.loadingTitleAccent}>확인했어요</Text>
              {'\n'}
              안내를 준비했어요
            </>
          ) : (
            <>
              <Text style={styles.loadingTitleAccent}>회복 정보</Text>를{'\n'}
              확인하고 있어요
            </>
          )}
        </Text>

        <Text style={styles.loadingDescription}>
          {isComplete ? (
            <>
              현재 회복 단계에 맞는
              {'\n'}
              내용을 찾았어요.
            </>
          ) : (
            <>
              오늘의 회복 단계와 질문에 맞는
              {'\n'}
              안내를 찾고 있어요.
            </>
          )}
        </Text>

        {!isComplete ? (
          <View
            accessible
            accessibilityLabel="회복 정보 확인 중"
            style={styles.loadingDots}
          >
            <View style={styles.loadingDot} />

            <View style={[styles.loadingDot, styles.loadingDotActive]} />

            <View style={styles.loadingDot} />
          </View>
        ) : (
          <View accessible accessibilityLabel="회복 정보 확인 완료" />
        )}
      </View>
    </View>
  );
}
