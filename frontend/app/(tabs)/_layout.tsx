import Ionicons from '@expo/vector-icons/Ionicons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { router, Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MALLO_COLORS } from '@/constants/colors';
import {
  MALLO_RADIUS,
  MALLO_SPACING,
  MALLO_TYPOGRAPHY,
} from '@/constants/theme';

const HIDDEN_JOURNEY_ROUTES = new Set(['index', 'record']);
const HIDDEN_CHECK_ROUTES = new Set(['quick', 'condition']);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const floatingBottomOffset = Math.max(insets.bottom, MALLO_SPACING.md);
  const visibleTabBarStyle = [
    styles.tabBar,
    Platform.OS === 'web'
      ? styles.webTabBarShadow
      : styles.nativeTabBarShadow,
    { bottom: floatingBottomOffset },
  ];

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
        tabBarStyle: visibleTabBarStyle,
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
        options={({ route }) => {
          const focusedRouteName =
            getFocusedRouteNameFromRoute(route) ?? 'index';

          return {
            title: 'Journey',
            tabBarStyle: HIDDEN_JOURNEY_ROUTES.has(focusedRouteName)
              ? styles.hiddenTabBar
              : visibleTabBarStyle,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'pulse' : 'pulse-outline'}
                size={22}
                color={color}
              />
            ),
          };
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
        options={({ route }) => {
          const focusedRouteName =
            getFocusedRouteNameFromRoute(route) ?? 'index';

          return {
            title: 'Check',
            tabBarStyle: HIDDEN_CHECK_ROUTES.has(focusedRouteName)
              ? styles.hiddenTabBar
              : visibleTabBarStyle,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={
                  focused ? 'checkmark-circle' : 'checkmark-circle-outline'
                }
                size={22}
                color={color}
              />
            ),
          };
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
