import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function DernaHomeScreen() {
  return (
    <View>
      <Text>DERNA Home</Text>

      <Button
        title="내 관리 기준 확인하기"
        onPress={() => router.push('/(tabs)/journey')}
      />
    </View>
  );
}
