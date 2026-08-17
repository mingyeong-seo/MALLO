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

export function AskLoadingState({
  question,
  isComplete,
}: {
  question: string;
  isComplete: boolean;
}) {
  const [loadingStep, setLoadingStep] = useState(0);

  /**
   * 확인 중일 때만
   * thinking ↔ searching 이미지를 900ms 간격으로 반복
   *
   * isComplete === true가 되면 반복 중단하고
   * checked 이미지 표시
   */
  useEffect(() => {
    if (isComplete) {
      return;
    }

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_IMAGES.length);
    }, 900);

    return () => clearInterval(interval);
  }, [isComplete]);

  return (
    <View style={[styles.stateContent, styles.loadingStateContent]}>
      {/* 사용자가 입력한 질문 */}
      <View style={styles.questionRecall}>
        <Text style={styles.questionRecallLabel}>내 질문</Text>

        <Text style={styles.questionRecallText}>“{question}”</Text>
      </View>

      {/* Loading / 완료 영역 */}
      <View style={styles.loadingBody}>
        {/* MALLO 캐릭터 */}
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

        {/* 메인 문구 */}
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

        {/* 보조 문구 */}
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

        {/* 확인 중에만 점 표시 */}
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
