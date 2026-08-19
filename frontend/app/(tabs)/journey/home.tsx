import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  type LayoutChangeEvent,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { MALLO_COLORS } from '@/constants/colors';
import { MALLO_TEXT_STYLES } from '@/constants/text-styles';
import {
  MALLO_RADIUS,
  MALLO_SPACING,
  MALLO_TYPOGRAPHY,
} from '@/constants/theme';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';

type RecoveryJourneySummary = {
  procedureName: string;
  procedureDate: string;
  recoveryDay: number;
  phase: string;
};

type QuickEntry = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: Href;
};

const QUICK_ENTRIES: QuickEntry[] = [
  {
    description: '오늘 뭘 하면 될까요?',
    icon: 'sparkles-outline',
    label: 'Today Action Plan',
    href: '/(tabs)/check',
  },
  {
    description: '지금 해도 괜찮을까요?',
    icon: 'checkmark-circle-outline',
    label: 'Quick Check',
    href: '/(tabs)/check/quick',
  },
  {
    description: '회복 중 궁금한 게 있나요?',
    icon: 'chatbubble-outline',
    label: 'ASK MALLO',
    href: '/(tabs)/ask',
  },
  {
    description: '오늘의 회복을 남겨보세요',
    icon: 'document-text-outline',
    label: '오늘 기록하기',
    href: '/(tabs)/journey/record',
  },
];

export default function JourneyHomeScreen() {
  const { scrollToTop } = useLocalSearchParams<{ scrollToTop?: string }>();
  const { findRecoveryRecord, recoverySession } = useRecoveryFlow();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const carouselRef = useRef<ScrollView>(null);
  const notificationProgress = useRef(new Animated.Value(0)).current;
  const lastScrollResetRef = useRef<string | null>(null);
  const elapsedDay = recoverySession?.elapsedDay ?? 0;
  const todayRecord = findRecoveryRecord(elapsedDay);
  const hasTodayFacePhoto = Boolean(todayRecord?.attachments.length);
  const journey: RecoveryJourneySummary = {
    procedureName: recoverySession?.procedureName ?? 'REJURAN',
    procedureDate: recoverySession?.procedureDate ?? '2026.08.15',
    recoveryDay: elapsedDay + 1,
    phase: recoverySession?.phase ?? '초기 집중 관리',
  };

  const [showPhaseInfo, setShowPhaseInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [mainCarouselCardHeight, setMainCarouselCardHeight] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePhasePress = () => {
    setShowPhaseInfo(true);

    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
    }

    phaseTimerRef.current = setTimeout(() => {
      setShowPhaseInfo(false);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      typeof scrollToTop !== 'string' ||
      lastScrollResetRef.current === scrollToTop
    ) {
      return;
    }

    lastScrollResetRef.current = scrollToTop;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ animated: false, y: 0 });
      carouselRef.current?.scrollTo({ animated: false, x: 0, y: 0 });
      setActiveCardIndex(0);
    });
  }, [scrollToTop]);

  const openNotifications = () => {
    setShowNotifications(true);
    setHasUnreadNotification(false);
    notificationProgress.setValue(0);
    Animated.timing(notificationProgress, {
      duration: 220,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const closeNotifications = () => {
    Animated.timing(notificationProgress, {
      duration: 180,
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowNotifications(false);
      }
    });
  };

  const handleNotificationPress = () => {
    if (showNotifications) {
      closeNotifications();
      return;
    }

    openNotifications();
  };

  const handleCardScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!carouselMaxOffset) {
      return;
    }

    setActiveCardIndex(
      event.nativeEvent.contentOffset.x >= carouselMaxOffset / 2 ? 1 : 0,
    );
  };

  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  };

  const carouselPageWidth = Math.max(cardWidth - MALLO_SPACING.xl, 0);
  const carouselMaxOffset = Math.max(
    cardWidth - MALLO_SPACING.xxl - MALLO_SPACING.sm,
    0,
  );
  const floatingTabClearance =
    MALLO_SPACING.xxl * 2 +
    Math.max(insets.bottom, MALLO_SPACING.md) +
    MALLO_SPACING.lg;

  const progress = `${
    Math.min(Math.max(journey.recoveryDay / 7, 0), 1) * 100
  }%` as `${number}%`;

  return (
    <SafeAreaView
      edges={['top']}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: floatingTabClearance + MALLO_SPACING.xl },
        ]}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
      >
        <JourneyHeader
          hasUnreadNotification={hasUnreadNotification}
          onLayout={handleHeaderLayout}
          onNotificationPress={handleNotificationPress}
        />

        <View style={styles.connectionStatus}>
          <View style={styles.connectionDot} />
          <Text style={styles.connectionText}>CONNECTED TO DERNA</Text>
        </View>

        <View
          onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
          style={styles.recoveryCardWrapper}
        >
          <ScrollView
            accessibilityLabel="Recovery Journey와 TODAY 얼굴 기록"
            decelerationRate="fast"
            disableIntervalMomentum
            horizontal
            onMomentumScrollEnd={handleCardScrollEnd}
            ref={carouselRef}
            snapToOffsets={[0, carouselMaxOffset]}
            showsHorizontalScrollIndicator={false}
          >
            <View
              style={[
                styles.cardPage,
                styles.firstCardPage,
                carouselPageWidth ? { width: carouselPageWidth } : null,
              ]}
            >
              <View
                onLayout={(event) =>
                  setMainCarouselCardHeight(event.nativeEvent.layout.height)
                }
                style={styles.recoveryCard}
              >
                <View style={styles.recoveryCardTopRow}>
                  <Text style={styles.procedureName}>
                    {journey.procedureName}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${journey.phase} 확인`}
                    hitSlop={8}
                    onPress={handlePhasePress}
                    style={({ pressed }) => [
                      styles.phaseBadge,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.phaseBadgeText}>{journey.phase}</Text>
                    <Ionicons
                      color={MALLO_COLORS.core.red}
                      name="chevron-forward"
                      size={12}
                    />
                  </Pressable>
                </View>

                <Text style={styles.recoveryDay}>
                  {formatRecoveryDay(journey.recoveryDay)}
                </Text>

                <Text style={styles.procedureDate}>
                  시술일 {journey.procedureDate}
                </Text>

                <View style={styles.progressSection}>
                  <Text style={styles.progressTitle}>회복 진행 상태</Text>

                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>DAY 7</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: progress }]} />
                  </View>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.cardPage,
                carouselPageWidth ? { width: carouselPageWidth } : null,
              ]}
            >
              <View
                style={[
                  styles.todayFaceCard,
                  mainCarouselCardHeight > 0
                    ? { height: mainCarouselCardHeight }
                    : null,
                ]}
              >
                <View style={styles.todayFaceTopRow}>
                  <View>
                    <Text style={styles.todayFaceEyebrow}>TODAY</Text>
                    <Text style={styles.todayFaceTitle}>오늘 얼굴 기록</Text>
                  </View>

                  <View style={styles.todayFaceIcon}>
                    <Ionicons
                      color={MALLO_COLORS.core.red}
                      name={hasTodayFacePhoto ? 'checkmark' : 'camera-outline'}
                      size={22}
                    />
                  </View>
                </View>

                <Text style={styles.todayFaceDescription}>
                  {hasTodayFacePhoto
                    ? '오늘 등록한 얼굴 사진과 회복 기록을 확인해보세요.'
                    : '오늘 얼굴 사진을 남기고 회복 변화를 기록해보세요.'}
                </Text>

                <Pressable
                  accessibilityLabel={
                    hasTodayFacePhoto
                      ? '오늘 얼굴 기록 확인하기'
                      : '오늘 얼굴 사진 등록하기'
                  }
                  accessibilityRole="button"
                  onPress={() =>
                    router.push(
                      hasTodayFacePhoto
                        ? {
                            pathname: '/(tabs)/journey/journal',
                            params: { day: String(elapsedDay) },
                          }
                        : {
                            pathname: '/(tabs)/journey/record',
                            params: { day: String(elapsedDay) },
                          },
                    )
                  }
                  style={({ pressed }) => [
                    styles.todayFaceAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.todayFaceActionText}>
                    {hasTodayFacePhoto ? '기록 확인하기' : '사진 등록하기'}
                  </Text>
                  <Ionicons
                    color={MALLO_COLORS.core.white}
                    name="arrow-forward"
                    size={17}
                  />
                </Pressable>
              </View>
            </View>
          </ScrollView>

          {showPhaseInfo ? (
            <View style={styles.phaseToastWrapper} pointerEvents="none">
              <View accessibilityLiveRegion="polite" style={styles.phaseToast}>
                <View style={styles.phaseToastIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={MALLO_COLORS.core.red}
                  />
                </View>

                <Text style={styles.phaseToastText}>
                  시술 후 초기 회복에 집중해 관리하는 기간이에요.
                </Text>
              </View>
            </View>
          ) : null}

          <View accessibilityElementsHidden style={styles.cardPagination}>
            {[0, 1].map((index) => (
              <View
                key={index}
                style={[
                  styles.cardPaginationDot,
                  activeCardIndex === index && styles.cardPaginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>빠른 메뉴</Text>

          <View style={styles.quickList}>
            {QUICK_ENTRIES.map((entry, index) => (
              <QuickEntryRow
                key={entry.label}
                entry={entry}
                showDivider={index < QUICK_ENTRIES.length - 1}
              />
            ))}
          </View>

          <Pressable
            accessibilityLabel="의료진에게 문의하기"
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/(tabs)/ask/consultation',
                params: { source: 'journey-home' },
              })
            }
            style={({ pressed }) => [
              styles.consultationAction,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="medical-outline"
              size={17}
              color={MALLO_COLORS.support.secondaryTextGray}
            />

            <Text style={styles.consultationActionText}>
              의료진에게 문의하기
            </Text>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={MALLO_COLORS.support.secondaryTextGray}
            />
          </Pressable>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>지난 회복 기록</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="지난 회복 기록 보기"
            onPress={() => router.push('/(tabs)/journey/journal')}
            style={({ pressed }) => [
              styles.journalEntry,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.journalIcon}>
              <Ionicons
                name="book-outline"
                size={18}
                color={MALLO_COLORS.support.charcoal}
              />
            </View>

            <View style={styles.journalCopy}>
              <Text style={styles.journalTitle}>기록 모아보기</Text>

              <Text style={styles.journalDescription}>
                지금까지 남긴 회복 기록을 확인해요.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={MALLO_COLORS.support.secondaryTextGray}
            />
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        animationType="none"
        onRequestClose={closeNotifications}
        statusBarTranslucent
        transparent
        visible={showNotifications}
      >
        <View style={styles.notificationModalRoot}>
          <View style={styles.notificationModalViewport}>
            <View
              pointerEvents="box-none"
              style={[
                styles.notificationLayer,
                {
                  top:
                    insets.top +
                    (Platform.OS === 'web' ? MALLO_SPACING.sm : 0) +
                    headerHeight,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.notificationOverlay,
                  {
                    opacity: notificationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.18],
                    }),
                  },
                ]}
              >
                <Pressable
                  accessibilityLabel="알림 닫기"
                  accessibilityRole="button"
                  onPress={closeNotifications}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              <Animated.View
                accessibilityLiveRegion="polite"
                style={[
                  styles.notificationDrawer,
                  {
                    width: viewportWidth * 0.84,
                    transform: [
                      {
                        translateX: notificationProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [viewportWidth * 0.84, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.notificationDrawerTitle}>알림</Text>
                <View style={styles.notificationPanel}>
                  <Ionicons
                    color={MALLO_COLORS.core.red}
                    name="notifications-outline"
                    size={18}
                  />
                  <View style={styles.notificationCopy}>
                    <Text style={styles.notificationTitle}>
                      오늘의 회복 안내
                    </Text>
                    <Text style={styles.notificationDescription}>
                      오늘 확인할 회복 가이드와 기록을 살펴보세요.
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </View>

            <Pressable
              accessibilityLabel="알림 닫기"
              accessibilityRole="button"
              hitSlop={8}
              onPress={closeNotifications}
              style={[
                styles.notificationModalClose,
                {
                  top:
                    insets.top +
                    (Platform.OS === 'web' ? MALLO_SPACING.sm : 0) +
                    MALLO_SPACING.sm,
                },
              ]}
            >
              <Ionicons
                color={MALLO_COLORS.support.charcoal}
                name="notifications-outline"
                size={22}
              />
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function JourneyHeader({
  hasUnreadNotification,
  onLayout,
  onNotificationPress,
}: {
  hasUnreadNotification: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  onNotificationPress: () => void;
}) {
  return (
    <View onLayout={onLayout} style={styles.header}>
      <Pressable
        accessibilityLabel="DERNA로 돌아가기"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.replace('/')}
        style={({ pressed }) => [
          styles.dernaBackButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          color={MALLO_COLORS.support.charcoal}
          name="chevron-back"
          size={18}
        />
        <Text style={styles.dernaBackText}>DERNA</Text>
      </Pressable>

      <Image
        accessible
        accessibilityLabel="MALLO"
        source={require('../../../assets/images/mallo-logo-red.png')}
        style={styles.headerLogo}
        resizeMode="contain"
      />

      <Pressable
        accessibilityLabel={
          hasUnreadNotification ? '새 알림 확인하기' : '알림 확인하기'
        }
        accessibilityRole="button"
        hitSlop={8}
        onPress={onNotificationPress}
        style={({ pressed }) => [
          styles.notificationButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          color={MALLO_COLORS.support.charcoal}
          name="notifications-outline"
          size={22}
        />
        {hasUnreadNotification ? <View style={styles.unreadDot} /> : null}
      </Pressable>
    </View>
  );
}

function QuickEntryRow({
  entry,
  showDivider,
}: {
  entry: QuickEntry;
  showDivider: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.label}, ${entry.description}`}
      onPress={() => router.push(entry.href)}
      style={({ pressed }) => [
        styles.quickEntry,
        showDivider && styles.quickEntryDivider,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.quickEntryIcon}>
        <Ionicons
          name={entry.icon}
          size={18}
          color={MALLO_COLORS.support.charcoal}
        />
      </View>

      <View style={styles.quickEntryCopy}>
        <Text style={styles.quickEntryLabel} numberOfLines={1}>
          {entry.label}
        </Text>

        <Text style={styles.quickEntryDescription}>{entry.description}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color={MALLO_COLORS.support.secondaryTextGray}
      />
    </Pressable>
  );
}

function formatRecoveryDay(day: number) {
  return `DAY ${Math.max(day, 1)}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },

  scrollContent: {
    paddingHorizontal: MALLO_SPACING.xl,
    paddingTop: Platform.OS === 'web' ? MALLO_SPACING.sm : 0,
  },

  /* Header */

  header: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },

  dernaBackButton: {
    position: 'absolute',
    left: 0,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.xs,
  },

  dernaBackText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.charcoal,
  },

  notificationButton: {
    position: 'absolute',
    right: 0,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unreadDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: MALLO_COLORS.core.white,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.red,
  },

  headerLogo: {
    width: 112,
    height: 25,
  },

  notificationPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MALLO_SPACING.md,
    padding: MALLO_SPACING.md,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },

  notificationLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },

  notificationModalRoot: {
    flex: 1,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },

  notificationModalViewport: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
  },

  notificationModalClose: {
    position: 'absolute',
    zIndex: 50,
    right: MALLO_SPACING.xl,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: MALLO_COLORS.core.ink,
  },

  notificationDrawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    padding: MALLO_SPACING.xl,
    backgroundColor: MALLO_COLORS.core.white,
  },

  notificationDrawerTitle: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    marginBottom: MALLO_SPACING.xl,
    color: MALLO_COLORS.core.ink,
  },

  notificationCopy: {
    flex: 1,
  },

  notificationTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },

  notificationDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  /* Recovery Card */

  recoveryCardWrapper: {
    position: 'relative',
  },

  cardPage: {
    paddingBottom: MALLO_SPACING.xs,
  },

  firstCardPage: {
    marginRight: MALLO_SPACING.sm,
  },

  recoveryCard: {
    minHeight: 220,
    marginTop: MALLO_SPACING.xs,
    padding: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.core.red,
  },

  todayFaceCard: {
    minHeight: 220,
    justifyContent: 'space-between',
    marginTop: MALLO_SPACING.xs,
    padding: MALLO_SPACING.xl,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.support.redTint,
  },

  todayFaceTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: MALLO_SPACING.md,
  },

  todayFaceEyebrow: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.core.red,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  todayFaceTitle: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.core.ink,
  },

  todayFaceIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },

  todayFaceDescription: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginVertical: MALLO_SPACING.lg,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  todayFaceAction: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.sm,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },

  todayFaceActionText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },

  cardPagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.xs,
    marginTop: MALLO_SPACING.sm,
  },

  cardPaginationDot: {
    width: 6,
    height: 6,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.mistGray,
  },

  cardPaginationDotActive: {
    width: 16,
    backgroundColor: MALLO_COLORS.core.red,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,

    marginTop: MALLO_SPACING.sm,
    marginBottom: MALLO_SPACING.sm,
  },

  connectionDot: {
    width: 5,
    height: 5,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.red,
  },

  connectionText: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
    fontWeight: '600',
    letterSpacing: 0.8,
  },

  recoveryCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: MALLO_SPACING.md,
  },

  procedureName: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.support.redTint,
    letterSpacing: 0.9,
  },

  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.xs,
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.xs,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.redTint,
  },

  phaseBadgeText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    color: MALLO_COLORS.core.red,
  },

  /* Floating phase explanation */
  phaseToast: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,

    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.sm,

    borderWidth: 1,
    borderColor: 'rgba(231, 227, 223, 0.65)',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  phaseToastWrapper: {
    position: 'absolute',
    zIndex: 20,
    top: -35,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  phaseToastIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: 'rgba(244, 214, 210, 0.75)',
  },

  phaseToastText: {
    ...MALLO_TYPOGRAPHY.caption,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    flex: 1,
    color: MALLO_COLORS.support.charcoal,
  },

  recoveryDay: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    marginTop: MALLO_SPACING.lg,
    color: MALLO_COLORS.core.white,
    letterSpacing: -0.5,
  },

  procedureDate: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.mistGray,
  },

  progressSection: {
    marginTop: MALLO_SPACING.xl,
  },

  progressTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    marginBottom: MALLO_SPACING.md,
    color: MALLO_COLORS.core.white,
  },

  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: MALLO_SPACING.sm,
  },

  progressLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.mistGray,
  },

  progressTrack: {
    height: 6,
    overflow: 'hidden',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.redTint,
  },

  progressFill: {
    height: '100%',
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.progress,
  },

  /* Quick Menu */

  quickSection: {
    marginTop: MALLO_SPACING.md,
  },

  sectionTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    marginBottom: MALLO_SPACING.md,
    color: MALLO_COLORS.support.charcoal,
  },

  quickList: {
    width: '100%',
  },

  quickEntry: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MALLO_SPACING.md,
  },

  quickEntryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },

  quickEntryIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: MALLO_SPACING.lg,
  },

  quickEntryCopy: {
    flex: 1,
  },

  quickEntryLabel: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },

  quickEntryDescription: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  consultationAction: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.sm,
    paddingHorizontal: MALLO_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },

  consultationActionText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    flex: 1,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  /* History */

  historySection: {
    marginTop: MALLO_SPACING.xl,
  },

  historySectionTitle: {
    ...MALLO_TYPOGRAPHY.caption,
    fontWeight: '600',
    marginBottom: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  journalEntry: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MALLO_SPACING.md,
  },

  journalIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: MALLO_SPACING.md,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },

  journalCopy: {
    flex: 1,
  },

  journalTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },

  journalDescription: {
    ...MALLO_TYPOGRAPHY.caption,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  pressed: {
    opacity: 0.68,
  },
});
