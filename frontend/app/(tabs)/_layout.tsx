import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';
import { MALLO_SPACING, MALLO_TYPOGRAPHY } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: MALLO_COLORS.core.red,
        tabBarInactiveTintColor: MALLO_COLORS.support.secondaryTextGray,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: [
          styles.tabBar,
          Platform.OS === 'web' ? styles.webTabBar : undefined,
        ],
      }}
    >
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'pulse' : 'pulse-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="check"
        options={{
          title: 'Check',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              size={21}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="my/index"
        options={{
          title: 'My',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
    backgroundColor: MALLO_COLORS.core.white,
    paddingTop: MALLO_SPACING.xs,
  },
  tabBarLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    fontSize: 10,
  },
  webTabBar: {
    height: 76,
    paddingTop: MALLO_SPACING.xs,
    paddingBottom: MALLO_SPACING.md,
  },
});
