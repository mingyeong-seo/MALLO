import { router } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';

export default function DernaHomeScreen() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/derna-home.png')}
        style={styles.background}
        resizeMode="stretch"
      >
        <Pressable
          style={styles.malloButton}
          onPress={() => router.push('/(tabs)/journey')}
          accessibilityRole="button"
          accessibilityLabel="내 관리 기준 확인하기"
          hitSlop={4}
        />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  malloButton: {
    position: 'absolute',

    // DERNA 이미지 속
    // "내 관리 기준 확인하기" 버튼 영역
    left: '8.5%',
    top: '67.2%',
    width: '47%',
    height: '5.8%',

    // 최종에서는 투명
    backgroundColor: 'transparent',
  },
});
