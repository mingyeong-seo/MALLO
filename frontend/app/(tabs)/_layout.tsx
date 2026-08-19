import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs, usePathname } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MALLO_COLORS } from '@/constants/colors';
import {
  MALLO_RADIUS,
  MALLO_SPACING,
  MALLO_TYPOGRAPHY,
} from '@/constants/theme';

const HIDDEN_TAB_PATHS = new Set([
  '/check/quick',
  '/check/condition',
  '/journey/record',
]);

export default function TabLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const floatingBottomOffset = Math.max(insets.bottom, MALLO_SPACING.md);
  const shouldHideTabBar = HIDDEN_TAB_PATHS.has(pathname);

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: MALLO_COLORS.core.red,
        tabBarInactiveTintColor: MALLO_COLORS.support.secondaryTextGray,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: styles.tabBarLabel,
        sceneStyle: {
          backgroundColor: MALLO_COLORS.core.white,
        },
        tabBarStyle: shouldHideTabBar
          ? styles.hiddenTabBar
          : [
              styles.tabBar,
              Platform.OS === 'web'
                ? styles.webTabBarShadow
                : styles.nativeTabBarShadow,
              { bottom: floatingBottomOffset },
            ],
      }}
    >
      <Tabs.Screen
        name="journey"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.replace({
              pathname: '/(tabs)/journey/home',
              params: { scrollToTop: String(Date.now()) },
            });
          },
        }}
        options={{
          title: 'Journey',
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
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.replace('/(tabs)/check');
          },
        }}
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
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.replace({
              pathname: '/(tabs)/ask',
              params: { reset: String(Date.now()) },
            });
          },
        }}
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
    position: 'absolute',
    left: 0,
    right: 0,
    width: 'auto',
    height: MALLO_SPACING.xxl * 2,
    marginHorizontal: MALLO_SPACING.lg,
    paddingTop: MALLO_SPACING.xs,
    paddingBottom: MALLO_SPACING.xs,
    paddingHorizontal: MALLO_SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(220, 220, 220, 0.65)',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  nativeTabBarShadow: {
    shadowColor: MALLO_COLORS.core.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: MALLO_SPACING.sm,
    elevation: 2,
  },
  webTabBarShadow: {
    boxShadow: `0px ${MALLO_SPACING.xs / 2}px ${MALLO_SPACING.sm}px ${MALLO_COLORS.core.ink}0F`,
  },
  tabBarLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    fontSize: 10,
  },
  hiddenTabBar: {
    display: 'none',
  },
});
