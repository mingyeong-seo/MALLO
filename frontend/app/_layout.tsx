import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen name="consent" options={{ headerShown: false }} />

      <Stack.Screen name="procedure-confirm" options={{ headerShown: false }} />
    </Stack>
  );
}
