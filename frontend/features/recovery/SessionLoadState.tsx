import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MALLO_COLORS } from '@/constants/colors';
import { CheckRequestState } from '@/features/check/components/CheckRequestState';

type SessionLoadStateProps = {
  readonly isLoading: boolean;
  readonly onRetry: () => void;
};

export function SessionLoadState({
  isLoading,
  onRetry,
}: SessionLoadStateProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <CheckRequestState
        description={
          isLoading
            ? '현재 Recovery Journey를 확인하고 있어요.'
            : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
        }
        onPrimaryPress={isLoading ? undefined : onRetry}
        primaryLabel={isLoading ? undefined : '다시 불러오기'}
        title={
          isLoading
            ? '시술 정보를 불러오고 있어요'
            : '시술 정보를 불러오지 못했어요'
        }
        tone={isLoading ? 'loading' : 'error'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },
});
