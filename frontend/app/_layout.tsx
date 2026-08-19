import { Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { RecoveryFlowProvider } from '@/features/recovery/RecoveryFlowProvider';

export default function RootLayout() {
  return (
    <RecoveryFlowProvider>
      <View style={styles.appBackground}>
        <View style={styles.mobileViewport}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />

            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen name="consent" options={{ headerShown: false }} />

            <Stack.Screen
              name="consultation"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="procedure-confirm"
              options={{ headerShown: false }}
            />
          </Stack>
        </View>
      </View>
    </RecoveryFlowProvider>
  );
}

const styles = StyleSheet.create({
  appBackground: {
    flex: 1,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    backgroundColor: Platform.OS === 'web' ? '#f2f2f2' : 'transparent',
  },
  mobileViewport: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    backgroundColor: '#ffffff',
  },
});
