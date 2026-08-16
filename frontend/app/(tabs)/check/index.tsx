import { Redirect } from 'expo-router';

export default function CheckScreen() {
  return <Redirect href="/(tabs)/check/result?decision=CONNECT" />;
}
