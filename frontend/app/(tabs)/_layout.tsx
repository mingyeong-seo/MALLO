import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
        }}
      />

      <Tabs.Screen
        name="check"
        options={{
          title: 'Check',
        }}
      />

      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
        }}
      />

      <Tabs.Screen
        name="my"
        options={{
          title: 'My',
        }}
      />
    </Tabs>
  );
}
