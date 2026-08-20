import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MALLO_COLORS } from '@/constants/colors';
import {
  MAX_PHOTO_FILE_SIZE_BYTES,
  PHOTO_FILE_SIZE_LIMIT_MESSAGE,
} from '@/constants/photo';
import { MALLO_TEXT_STYLES } from '@/constants/text-styles';
import {
  MALLO_RADIUS,
  MALLO_SPACING,
  MALLO_TYPOGRAPHY,
} from '@/constants/theme';
import { ACTION_LABELS } from '@/features/check/data';
import { formatRecoveryDate } from '@/features/recovery/date';
import { formatElapsedDay } from '@/features/recovery/mock-data';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import type {
  PhotoAttachment,
  QuickCheckAction,
  QuickCheckDecision,
  QuickCheckResult,
  RecoveryRecord,
  RecoveryRecordPerformedStatus,
} from '@/features/recovery/types';
import { ApiError, isApiError } from '@/services/api';
import { getTodayChecks } from '@/services/check';
import { uploadSessionPhoto } from '@/services/photo';
import {
  createRecord,
  getTodayRecord,
  updateRecord,
} from '@/services/record';
import {
  getPhotoConsent,
  setPhotoConsent,
} from '@/services/session-storage';

type SaveState = 'idle' | 'saving' | 'error';
type LoadState = 'loading' | 'ready' | 'error';

const ACTION_ORDER: QuickCheckAction[] = [
  'EXERCISE',
  'MAKEUP',
  'CLEANSING',
  'SKINCARE',
  'HEAT',
];
const ACTION_TAB_WIDTH = 76;
const ACTION_TAB_GAP = MALLO_SPACING.sm;
const WEB_NAVIGATION_BUTTON_SIZE = 32;
const RECORD_DAY_MISMATCH_NOTICE =
  '현재 회복 DAY와 저장된 기록 정보가 일치하지 않아요. 다시 확인해 주세요.';

const ACTION_ICONS: Record<QuickCheckAction, keyof typeof Ionicons.glyphMap> = {
  EXERCISE: 'barbell-outline',
  MAKEUP: 'color-palette-outline',
  CLEANSING: 'water-outline',
  SKINCARE: 'flask-outline',
  HEAT: 'thermometer-outline',
};

const DECISION_LABELS: Record<QuickCheckDecision, string> = {
  POSSIBLE: '진행 가능',
  ADJUST: '조절 필요',
  POSTPONE: '오늘 미루기',
  CONNECT: '의료진 확인',
};

const DECISION_COLORS: Record<QuickCheckDecision, string> = {
  POSSIBLE: MALLO_COLORS.semantic.possible,
  ADJUST: MALLO_COLORS.semantic.adjust,
  POSTPONE: MALLO_COLORS.semantic.postpone,
  CONNECT: MALLO_COLORS.semantic.connect,
};

export default function RecoveryRecordScreen() {
  const params = useLocalSearchParams<{ day?: string }>();

  const {
    findRecoveryRecord,
    recoverySession,
    setQuickChecks,
    upsertRecoveryRecord,
  } = useRecoveryFlow();

  const parsedRouteDay = Number(params.day);
  const routeDay = Number.isFinite(parsedRouteDay)
    ? Math.max(Math.trunc(parsedRouteDay), 0)
    : null;
  const elapsedDay = routeDay ?? recoverySession?.elapsedDay ?? 0;
  const canSaveCurrentDay =
    recoverySession !== null &&
    recoverySession !== undefined &&
    elapsedDay === recoverySession.elapsedDay;

  const existing = findRecoveryRecord(elapsedDay);

  const [todayQuickChecks, setTodayQuickChecks] = useState<
    QuickCheckResult[]
  >([]);

  const actionCounts = useMemo(
    () =>
      ACTION_ORDER.reduce<Record<QuickCheckAction, number>>(
        (counts, action) => {
          counts[action] = todayQuickChecks.filter(
            (result) => result.action === action,
          ).length;
          return counts;
        },
        {
          EXERCISE: 0,
          MAKEUP: 0,
          CLEANSING: 0,
          SKINCARE: 0,
          HEAT: 0,
        },
      ),
    [todayQuickChecks],
  );

  const firstActionWithResult =
    ACTION_ORDER.find((action) => actionCounts[action] > 0) ?? 'EXERCISE';

  const [selectedAction, setSelectedAction] = useState<QuickCheckAction>(
    firstActionWithResult,
  );
  const actionScrollRef = useRef<ScrollView>(null);

  const [performedByCheckId, setPerformedByCheckId] = useState<
    Record<string, RecoveryRecordPerformedStatus>
  >(() =>
    Object.fromEntries(
      (existing?.actions ?? []).map((item) => [
        item.checkId,
        item.performedStatus,
      ]),
    ),
  );

  const [memo, setMemo] = useState(existing?.memo ?? '');
  const [attachments, setAttachments] = useState<PhotoAttachment[]>(
    existing?.attachments ?? [],
  );
  const attachmentsRef = useRef(attachments);
  const initialServerPhotoIdsRef = useRef(
    getPhotoIds(existing?.attachments ?? []),
  );
  const webPhotoFilesRef = useRef<Map<string, File>>(new Map());
  const [serverRecord, setServerRecord] = useState<RecoveryRecord | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [shouldRecheckBeforeSave, setShouldRecheckBeforeSave] = useState(false);
  const [recordDayMismatch, setRecordDayMismatch] = useState(false);
  const [notice, setNotice] = useState('');
  const [photoConsentVisible, setPhotoConsentVisible] = useState(false);
  const [photoConsentSaving, setPhotoConsentSaving] = useState(false);

  const selectedChecks = todayQuickChecks.filter(
    (result) => result.action === selectedAction,
  );

  const allChecked =
    todayQuickChecks.length > 0 &&
    todayQuickChecks.every((result) => performedByCheckId[result.checkId]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const selectedIndex = ACTION_ORDER.indexOf(selectedAction);

    requestAnimationFrame(() => {
      actionScrollRef.current?.scrollTo({
        animated: true,
        x: selectedIndex * (ACTION_TAB_WIDTH + ACTION_TAB_GAP),
        y: 0,
      });
    });
  }, [selectedAction]);

  const loadRecordData = useCallback(async () => {
    const sessionId = recoverySession?.sessionId;
    const currentElapsedDay = recoverySession?.elapsedDay;

    if (!sessionId || currentElapsedDay === undefined) {
      setLoadState('error');
      setNotice('Recovery Session을 확인하지 못했어요.');
      return;
    }

    setLoadState('loading');
    setRecordDayMismatch(false);
    setNotice('');

    try {
      const [record, checkResults] = await Promise.all([
        getTodayRecord(sessionId),
        getTodayChecks(sessionId),
      ]);
      const matchedChecks = checkResults.flatMap((result) =>
        result.status === 'MATCHED' ? [result.result] : [],
      );

      setTodayQuickChecks(matchedChecks);
      setQuickChecks(matchedChecks);

      if (record && record.elapsedDay !== currentElapsedDay) {
        setServerRecord(null);
        setPerformedByCheckId({});
        setMemo('');
        setRecordDayMismatch(true);
        setShouldRecheckBeforeSave(false);
        setLoadState('error');
        setNotice(RECORD_DAY_MISMATCH_NOTICE);
        return;
      }

      if (record) {
        const mergedAttachments = mergePhotoAttachments(
          record.attachments,
          attachmentsRef.current,
        );
        const hydratedRecord = {
          ...record,
          attachments: mergedAttachments,
        };

        attachmentsRef.current = mergedAttachments;
        initialServerPhotoIdsRef.current = getPhotoIds(record.attachments);
        setAttachments(mergedAttachments);
        setServerRecord(hydratedRecord);
        upsertRecoveryRecord(hydratedRecord);
        setPerformedByCheckId(
          Object.fromEntries(
            record.actions.map((action) => [
              action.checkId,
              action.performedStatus,
            ]),
          ),
        );
        setMemo(record.memo);
      } else {
        initialServerPhotoIdsRef.current = [];
        setServerRecord(null);
        setPerformedByCheckId({});
        setMemo('');
      }

      setRecordDayMismatch(false);

      const firstMatchedAction = ACTION_ORDER.find((action) =>
        matchedChecks.some((check) => check.action === action),
      );

      if (firstMatchedAction) {
        setSelectedAction(firstMatchedAction);
      }

      setShouldRecheckBeforeSave(false);
      setLoadState('ready');
    } catch (error) {
      setLoadState('error');
      setNotice(getRecordErrorMessage(error, '기록을 불러오지 못했어요.'));
    }
  }, [
    recoverySession?.elapsedDay,
    recoverySession?.sessionId,
    setQuickChecks,
    upsertRecoveryRecord,
  ]);

  useEffect(() => {
    void loadRecordData();
  }, [loadRecordData]);

  const handleLogoPress = () => {
    router.replace('/(tabs)/journey/home');
  };

  const setPerformedStatus = (
    checkId: string,
    performedStatus: RecoveryRecordPerformedStatus,
  ) => {
    setPerformedByCheckId((current) => ({
      ...current,
      [checkId]: performedStatus,
    }));
    setNotice('');
  };

  const pickPhotos = async () => {
    const remainingSlots = 5 - attachments.length;

    if (remainingSlots <= 0) {
      setNotice('사진은 최대 5장까지 추가할 수 있어요.');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setNotice(
            '회복 사진을 기록하려면 사진 접근 권한이 필요해요.',
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images'],
        selectionLimit: remainingSlots,
      });

      if (result.canceled) {
        return;
      }

      const selectedAt = Date.now();
      const acceptedAssets = result.assets.filter(
        (asset) =>
          asset.fileSize == null ||
          asset.fileSize <= MAX_PHOTO_FILE_SIZE_BYTES,
      );
      const hasOversizedPhoto = acceptedAssets.length < result.assets.length;
      const selectedPhotos: PhotoAttachment[] = acceptedAssets.map(
        (asset, index) => {
          const clientId = `local-photo-${selectedAt}-${index}`;

          if (Platform.OS === 'web' && asset.file) {
            webPhotoFilesRef.current.set(clientId, asset.file);
          }

          return {
            clientId,
            fileName: asset.fileName ?? undefined,
            fileSize: asset.fileSize,
            height: asset.height,
            localUri: asset.uri,
            mimeType: asset.mimeType ?? undefined,
            uploadStatus: 'local',
            width: asset.width,
          };
        },
      );

      setAttachments((current) => {
        const next = [
          ...current,
          ...selectedPhotos.slice(0, Math.max(5 - current.length, 0)),
        ];
        attachmentsRef.current = next;
        return next;
      });
      setNotice(hasOversizedPhoto ? PHOTO_FILE_SIZE_LIMIT_MESSAGE : '');
    } catch {
      setNotice('사진을 불러오지 못했어요. 다시 시도해 주세요.');
    }
  };

  const addPhoto = async () => {
    if (attachments.length >= 5) {
      setNotice('사진은 최대 5장까지 추가할 수 있어요.');
      return;
    }

    const sessionId = recoverySession?.sessionId;

    if (!sessionId) {
      setNotice('Recovery Session을 확인하지 못했어요.');
      return;
    }

    try {
      const consented = await getPhotoConsent(sessionId);

      if (consented) {
        await pickPhotos();
        return;
      }

      setPhotoConsentVisible(true);
    } catch {
      setNotice('사진 동의 상태를 확인하지 못했어요. 다시 시도해 주세요.');
    }
  };

  const acceptPhotoConsent = async () => {
    const sessionId = recoverySession?.sessionId;

    if (!sessionId) {
      setPhotoConsentVisible(false);
      setNotice('Recovery Session을 확인하지 못했어요.');
      return;
    }

    try {
      setPhotoConsentSaving(true);
      await setPhotoConsent(sessionId);
      setPhotoConsentVisible(false);
      await pickPhotos();
    } catch {
      setNotice('사진 동의 상태를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setPhotoConsentSaving(false);
    }
  };

  const removePhoto = (clientId: string) => {
    webPhotoFilesRef.current.delete(clientId);
    setAttachments((current) => {
      const next = current.filter((item) => item.clientId !== clientId);
      attachmentsRef.current = next;
      return next;
    });
    setNotice('');
  };

  const uploadPendingPhotos = async (sessionId: string) => {
    let nextAttachments = attachmentsRef.current;
    const pendingAttachments = nextAttachments.filter(
      (attachment) =>
        attachment.uploadStatus === 'local' ||
        attachment.uploadStatus === 'error',
    );

    for (const pendingAttachment of pendingAttachments) {
      nextAttachments = updatePhotoAttachment(
        nextAttachments,
        pendingAttachment.clientId,
        { uploadStatus: 'uploading' },
      );
      attachmentsRef.current = nextAttachments;
      setAttachments(nextAttachments);

      try {
        const uploadedPhoto = await uploadSessionPhoto(sessionId, {
          file: webPhotoFilesRef.current.get(pendingAttachment.clientId),
          fileName: pendingAttachment.fileName,
          localUri: pendingAttachment.localUri,
          mimeType: pendingAttachment.mimeType,
        });

        nextAttachments = updatePhotoAttachment(
          nextAttachments,
          pendingAttachment.clientId,
          {
            createdAt: uploadedPhoto.createdAt,
            observation: uploadedPhoto.observation,
            photoId: uploadedPhoto.photoId,
            photoUrl: uploadedPhoto.photoUrl,
            uploadStatus: 'uploaded',
          },
        );
        webPhotoFilesRef.current.delete(pendingAttachment.clientId);
        attachmentsRef.current = nextAttachments;
        setAttachments(nextAttachments);
      } catch (error) {
        nextAttachments = updatePhotoAttachment(
          nextAttachments,
          pendingAttachment.clientId,
          { uploadStatus: 'error' },
        );
        attachmentsRef.current = nextAttachments;
        setAttachments(nextAttachments);
        throw error;
      }
    }

    if (
      nextAttachments.some(
        (attachment) =>
          attachment.uploadStatus !== 'uploaded' ||
          attachment.photoId === undefined,
      )
    ) {
      throw new ApiError(
        'INVALID_RESPONSE',
        '사진 업로드를 완료하지 못했어요. 다시 시도해 주세요.',
      );
    }

    return nextAttachments;
  };

  const saveRecord = async () => {
    if (!canSaveCurrentDay) {
      setNotice('현재 DAY의 회복 기록만 저장하거나 수정할 수 있어요.');
      return;
    }

    if (recordDayMismatch) {
      setNotice(RECORD_DAY_MISMATCH_NOTICE);
      return;
    }

    if (loadState !== 'ready') {
      setNotice('오늘 기록을 먼저 불러와 주세요.');
      return;
    }

    if (todayQuickChecks.length === 0) {
      setNotice('오늘 확인한 Quick Check가 없어요.');
      return;
    }

    if (!allChecked) {
      setNotice('오늘 확인한 행동의 수행 여부를 모두 선택해 주세요.');
      return;
    }

    const sessionId = recoverySession?.sessionId;

    if (!sessionId) {
      setNotice('Recovery Session을 확인하지 못했어요.');
      return;
    }

    setSaveState('saving');
    setNotice('');

    try {
      let recordToUpdate = serverRecord;

      if (shouldRecheckBeforeSave) {
        recordToUpdate = await getTodayRecord(sessionId);

        if (
          recordToUpdate &&
          recordToUpdate.elapsedDay !== recoverySession.elapsedDay
        ) {
          setServerRecord(null);
          setRecordDayMismatch(true);
          setSaveState('idle');
          setNotice(RECORD_DAY_MISMATCH_NOTICE);
          return;
        }

        if (recordToUpdate) {
          const serverPhotoIds = getPhotoIds(recordToUpdate.attachments);
          const mergedAttachments = mergePhotoAttachments(
            recordToUpdate.attachments,
            attachmentsRef.current,
          );
          recordToUpdate = {
            ...recordToUpdate,
            attachments: mergedAttachments,
          };
          initialServerPhotoIdsRef.current = serverPhotoIds;
          attachmentsRef.current = mergedAttachments;
          setAttachments(mergedAttachments);
        } else {
          initialServerPhotoIdsRef.current = [];
        }

        setServerRecord(recordToUpdate);
        setRecordDayMismatch(false);
      }

      let uploadedAttachments: PhotoAttachment[];

      try {
        uploadedAttachments = await uploadPendingPhotos(sessionId);
      } catch (error) {
        setShouldRecheckBeforeSave(true);
        setSaveState('error');
        setNotice(getPhotoUploadErrorMessage(error));
        return;
      }

      const photoRecordIds = getPhotoIds(uploadedAttachments);
      const photoRecordIdsChanged = !areNumberArraysEqual(
        photoRecordIds,
        initialServerPhotoIdsRef.current,
      );

      const actions = todayQuickChecks.map((result) => ({
        checkId: result.checkId,
        performedStatus: performedByCheckId[result.checkId],
      }));
      const trimmedMemo = memo.trim();
      const savedRecord = recordToUpdate
          ? await updateRecord(sessionId, recordToUpdate.recordId, {
              actions,
              memo: trimmedMemo,
              ...(photoRecordIdsChanged ? { photoRecordIds } : {}),
            })
          : await createRecord(sessionId, {
              actions,
              elapsedDay,
              memo: trimmedMemo,
              photoRecordIds,
            });
      const hydratedRecord = savedRecord;

      attachmentsRef.current = hydratedRecord.attachments;
      initialServerPhotoIdsRef.current = getPhotoIds(
        hydratedRecord.attachments,
      );
      setAttachments(hydratedRecord.attachments);
      setServerRecord(hydratedRecord);
      setRecordDayMismatch(false);
      setShouldRecheckBeforeSave(false);
      upsertRecoveryRecord(hydratedRecord);

      router.replace({
        pathname: '/(tabs)/journey/journal',
        params: {
          day: String(elapsedDay),
          saved: 'true',
        },
      });
    } catch (error) {
      setShouldRecheckBeforeSave(true);
      setSaveState('error');
      setNotice(getRecordErrorMessage(error, '기록을 저장하지 못했어요.'));
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Recovery Journey 홈으로 이동"
            accessibilityRole="button"
            hitSlop={12}
            onPress={handleLogoPress}
            style={({ pressed }) => [
              styles.logoButton,
              pressed && styles.pressed,
            ]}
          >
            <Image
              accessible={false}
              resizeMode="contain"
              source={require('../../../assets/images/mallo-logo-red.png')}
              style={styles.logo}
            />
          </Pressable>
        </View>

        <View style={styles.contextRow}>
          <Text style={styles.contextText}>
            {recoverySession?.procedureName ?? 'REJURAN'}
          </Text>
          <Text style={styles.contextText}>{formatElapsedDay(elapsedDay)}</Text>
          {recoverySession ? (
            <Text style={styles.contextText}>
              {formatRecoveryDate(
                recoverySession.procedureDate,
                elapsedDay,
              )}
            </Text>
          ) : null}
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>오늘 확인한 행동을 기록해주세요.</Text>
          <Text style={styles.description}>
            오늘 확인했던 행동을 실제로 했는지 체크해주세요.
          </Text>
        </View>

        <View
          style={[
            styles.actionTabsWrapper,
            Platform.OS === 'web' && styles.actionTabsWrapperWeb,
          ]}
        >
          {Platform.OS === 'web' ? (
            <ActionNavigationButton
              direction="previous"
              disabled={selectedAction === ACTION_ORDER[0]}
              onPress={() => {
                const index = ACTION_ORDER.indexOf(selectedAction);
                setSelectedAction(ACTION_ORDER[Math.max(index - 1, 0)]);
              }}
            />
          ) : null}

          <ScrollView
            contentContainerStyle={styles.actionTabs}
            horizontal
            ref={actionScrollRef}
            showsHorizontalScrollIndicator={false}
            style={
              Platform.OS === 'web' ? styles.actionTabsScrollWeb : undefined
            }
          >
            {ACTION_ORDER.map((action) => {
              const selected = action === selectedAction;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={action}
                  onPress={() => setSelectedAction(action)}
                  style={({ pressed }) => [
                    styles.actionTab,
                    selected && styles.actionTabSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={ACTION_ICONS[action]}
                    size={22}
                    color={
                      selected
                        ? MALLO_COLORS.core.white
                        : MALLO_COLORS.support.secondaryTextGray
                    }
                  />
                  <Text
                    style={[
                      styles.actionTabLabel,
                      selected && styles.actionTabLabelSelected,
                    ]}
                  >
                    {ACTION_LABELS[action]}
                  </Text>
                  <Text
                    style={[
                      styles.actionTabCount,
                      selected && styles.actionTabCountSelected,
                    ]}
                  >
                    {actionCounts[action]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {Platform.OS === 'web' ? (
            <ActionNavigationButton
              direction="next"
              disabled={
                selectedAction === ACTION_ORDER[ACTION_ORDER.length - 1]
              }
              onPress={() => {
                const index = ACTION_ORDER.indexOf(selectedAction);
                setSelectedAction(
                  ACTION_ORDER[Math.min(index + 1, ACTION_ORDER.length - 1)],
                );
              }}
            />
          ) : null}
        </View>

        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>
            {ACTION_LABELS[selectedAction]} 관련 행동 ({selectedChecks.length})
          </Text>

          {selectedChecks.length ? (
            <View style={styles.checkList}>
              {selectedChecks.map((result) => {
                const performedStatus = performedByCheckId[result.checkId];
                const decisionColor = DECISION_COLORS[result.decision];

                return (
                  <View key={result.checkId} style={styles.checkCard}>
                    <View style={styles.checkCopy}>
                      <Text style={styles.checkTitle}>
                        {result.contextLabel}
                      </Text>
                      <Text
                        style={[styles.decisionLabel, { color: decisionColor }]}
                      >
                        {DECISION_LABELS[result.decision]}
                      </Text>
                    </View>

                    <View style={styles.performanceChoices}>
                      <Choice
                        label="했어요"
                        onPress={() =>
                          setPerformedStatus(result.checkId, 'DONE')
                        }
                        selected={performedStatus === 'DONE'}
                      />
                      <Choice
                        label="하지 않았어요"
                        onPress={() =>
                          setPerformedStatus(result.checkId, 'NOT_DONE')
                        }
                        selected={performedStatus === 'NOT_DONE'}
                      />
                      <Choice
                        label="조절해서 했어요"
                        onPress={() =>
                          setPerformedStatus(result.checkId, 'ADJUSTED_DONE')
                        }
                        selected={performedStatus === 'ADJUSTED_DONE'}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noActionState}>
              <Text style={styles.noActionTitle}>
                오늘 확인한 {ACTION_LABELS[selectedAction]} 행동이 없어요.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/check/quick')}
                style={({ pressed }) => [
                  styles.inlineButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.inlineButtonText}>Quick Check 하기</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>메모</Text>
            <Text style={styles.optionalLabel}>(선택)</Text>
          </View>

          <TextInput
            accessibilityLabel="회복 메모"
            maxLength={300}
            multiline
            onChangeText={setMemo}
            placeholder="오늘 피부 느낌이나 자유롭게 적어주세요."
            placeholderTextColor={MALLO_COLORS.support.secondaryTextGray}
            style={styles.memoInput}
            textAlignVertical="top"
            value={memo}
          />

          <Text style={styles.characterCount}>{memo.length}/300</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>사진</Text>
            <Text style={styles.optionalLabel}>(선택)</Text>
          </View>

          <View style={styles.photoRow}>
            {attachments.map((attachment, index) => {
              const previewUri = attachment.photoUrl ?? attachment.localUri;

              return (
                <Pressable
                  accessibilityLabel={`사진 ${index + 1} 제거`}
                  accessibilityRole="button"
                  key={attachment.clientId}
                  onPress={() => removePhoto(attachment.clientId)}
                  style={styles.photoPreview}
                >
                  {previewUri ? (
                    <Image
                      accessible={false}
                      resizeMode="cover"
                      source={{ uri: previewUri }}
                      style={styles.photoImage}
                    />
                  ) : (
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={MALLO_COLORS.core.red}
                    />
                  )}
                  <Ionicons
                    name="close-circle"
                    size={17}
                    color={MALLO_COLORS.support.secondaryTextGray}
                    style={styles.removeIcon}
                  />
                </Pressable>
              );
            })}

            {attachments.length < 5 ? (
              <Pressable
                accessibilityLabel="사진 추가"
                accessibilityRole="button"
                onPress={addPhoto}
                style={({ pressed }) => [
                  styles.photoButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="camera-outline"
                  size={22}
                  color={MALLO_COLORS.support.charcoal}
                />
                <Text style={styles.photoButtonText}>사진 추가</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.photoCount}>{attachments.length}/5</Text>
        </View>

        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.noticeText}>
            {notice}
          </Text>
        ) : null}

        {loadState === 'loading' ? (
          <View style={styles.errorBox}>
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>
              오늘 기록을 불러오고 있어요.
            </Text>
          </View>
        ) : null}

        {loadState === 'error' ? (
          <View style={styles.errorBox}>
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>
              오늘 기록을 불러오지 못했어요.
            </Text>
            <Pressable
              accessibilityLabel="오늘 기록 다시 불러오기"
              accessibilityRole="button"
              onPress={() => void loadRecordData()}
              style={({ pressed }) => [
                styles.inlineButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.inlineButtonText}>다시 불러오기</Text>
            </Pressable>
          </View>
        ) : null}

        {saveState === 'error' ? (
          <View style={styles.errorBox}>
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>
              기록을 저장하지 못했어요. 다시 시도해 주세요.
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={
            saveState === 'saving' ||
            loadState !== 'ready' ||
            recordDayMismatch
          }
          onPress={() => void saveRecord()}
          style={({ pressed }) => [
            styles.primaryButton,
            (!allChecked || loadState !== 'ready' || recordDayMismatch) &&
              styles.primaryButtonDisabled,
            pressed && saveState !== 'saving' && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {saveState === 'saving'
              ? '저장하고 있어요'
              : saveState === 'error'
                ? '다시 저장하기'
                : '오늘 기록 저장하기'}
          </Text>
        </Pressable>

        <Text style={styles.saveGuide}>
          저장한 기록은 Recovery Journal에서 확인할 수 있어요.
        </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        onRequestClose={() => setPhotoConsentVisible(false)}
        transparent
        visible={photoConsentVisible}
      >
        <View style={styles.consentOverlay}>
          <View style={styles.consentModal}>
            <Text style={styles.consentTitle}>사진 수집·이용 안내</Text>
            <Text style={styles.consentDescription}>
              선택한 사진은 현재 Recovery Session의 회복 기록을 남기는 데
              사용해요. 사진을 선택하지 않아도 기록을 계속 작성할 수 있어요.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={photoConsentSaving}
              onPress={acceptPhotoConsent}
              style={({ pressed }) => [
                styles.consentPrimaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.consentPrimaryButtonText}>
                동의하고 사진 추가
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={photoConsentSaving}
              onPress={() => setPhotoConsentVisible(false)}
              style={({ pressed }) => [
                styles.consentSecondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.consentSecondaryButtonText}>다음에 하기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Choice({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioCenter} /> : null}
      </View>
      <Text style={styles.choiceLabel}>{label}</Text>
    </Pressable>
  );
}

function ActionNavigationButton({
  direction,
  disabled,
  onPress,
}: {
  direction: 'previous' | 'next';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={
        direction === 'previous'
          ? '이전 행동 Category 보기'
          : '다음 행동 Category 보기'
      }
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.webNavigationButton,
        disabled && styles.webNavigationButtonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Ionicons
        color={MALLO_COLORS.support.charcoal}
        name={direction === 'previous' ? 'chevron-back' : 'chevron-forward'}
        size={17}
      />
    </Pressable>
  );
}

function mergePhotoAttachments(
  serverAttachments: PhotoAttachment[],
  localAttachments: PhotoAttachment[],
) {
  const serverPhotoIds = new Set(
    serverAttachments.flatMap((attachment) =>
      attachment.photoId === undefined ? [] : [attachment.photoId],
    ),
  );

  return [
    ...serverAttachments,
    ...localAttachments.filter(
      (attachment) =>
        attachment.photoId === undefined ||
        !serverPhotoIds.has(attachment.photoId),
    ),
  ];
}

function updatePhotoAttachment(
  attachments: PhotoAttachment[],
  clientId: string,
  updates: Partial<PhotoAttachment>,
) {
  return attachments.map((attachment) =>
    attachment.clientId === clientId
      ? { ...attachment, ...updates }
      : attachment,
  );
}

function getPhotoIds(attachments: PhotoAttachment[]) {
  return attachments.flatMap((attachment) =>
    attachment.photoId === undefined ? [] : [attachment.photoId],
  );
}

function areNumberArraysEqual(left: number[], right: number[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function getPhotoUploadErrorMessage(error: unknown) {
  if (!isApiError(error)) {
    return '사진을 업로드하지 못했어요. 다시 시도해 주세요.';
  }

  switch (error.status) {
    case 400:
      return '사진을 업로드하지 못했어요. 다른 사진을 선택해 주세요.';
    case 401:
      return 'Recovery Session이 만료되었어요. 다시 시작해 주세요.';
    case 413:
      return PHOTO_FILE_SIZE_LIMIT_MESSAGE;
    default:
      return error.message || '사진을 업로드하지 못했어요. 다시 시도해 주세요.';
  }
}

function getRecordErrorMessage(error: unknown, fallback: string) {
  if (!isApiError(error)) {
    return fallback;
  }

  switch (error.status) {
    case 400:
      return error.message || '기록 내용을 다시 확인해 주세요.';
    case 401:
      return 'Recovery Session이 만료되었어요. 다시 시작해 주세요.';
    case 403:
      return '지난 회복 기록은 수정할 수 없어요.';
    case 404:
      return '저장할 기록이나 Quick Check를 찾지 못했어요.';
    default:
      return error.message || fallback;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: MALLO_SPACING.xl,
    paddingBottom: 48,
  },
  header: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },
  logoButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 112,
    height: 25,
  },
  contextRow: {
    flexDirection: 'row',
    gap: MALLO_SPACING.sm,
    paddingTop: MALLO_SPACING.lg,
  },
  contextText: {
    ...MALLO_TYPOGRAPHY.statusLabel,
    paddingHorizontal: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.sm,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.support.warmGray,
    color: MALLO_COLORS.support.charcoal,
  },
  intro: {
    marginTop: MALLO_SPACING.xl,
  },
  title: {
    ...MALLO_TYPOGRAPHY.screenTitle,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    color: MALLO_COLORS.core.ink,
  },
  description: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  actionTabsWrapper: {
    position: 'relative',
  },
  actionTabsWrapperWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.sm,
  },
  actionTabs: {
    gap: ACTION_TAB_GAP,
    paddingVertical: MALLO_SPACING.xl,
  },
  actionTabsScrollWeb: {
    flex: 1,
    minWidth: 0,
  },
  actionTab: {
    width: ACTION_TAB_WIDTH,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MALLO_SPACING.sm,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.white,
  },
  actionTabSelected: {
    borderColor: MALLO_COLORS.core.red,
    backgroundColor: MALLO_COLORS.core.red,
  },
  actionTabLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.charcoal,
  },
  actionTabLabelSelected: {
    color: MALLO_COLORS.core.white,
  },
  actionTabCount: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: 2,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  actionTabCountSelected: {
    color: MALLO_COLORS.core.white,
  },
  actionSection: {
    marginTop: MALLO_SPACING.xs,
  },
  section: {
    marginTop: MALLO_SPACING.xl,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: MALLO_SPACING.xs,
  },
  sectionTitle: {
    ...MALLO_TYPOGRAPHY.sectionTitle,
    color: MALLO_COLORS.support.charcoal,
  },
  optionalLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  checkList: {
    marginTop: MALLO_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
  },
  checkCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: MALLO_SPACING.md,
    paddingVertical: MALLO_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: MALLO_COLORS.support.mistGray,
  },
  checkCopy: {
    flex: 1,
  },
  checkTitle: {
    ...MALLO_TYPOGRAPHY.body,
    fontWeight: '600',
    color: MALLO_COLORS.core.ink,
  },
  decisionLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    fontWeight: '600',
  },
  performanceChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: MALLO_SPACING.md,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MALLO_SPACING.xs,
  },
  choiceLabel: {
    ...MALLO_TYPOGRAPHY.caption,
    color: MALLO_COLORS.support.charcoal,
  },
  radio: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.secondaryTextGray,
    borderRadius: MALLO_RADIUS.full,
  },
  radioSelected: {
    borderColor: MALLO_COLORS.core.red,
  },
  radioCenter: {
    width: 10,
    height: 10,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.red,
  },
  noActionState: {
    marginTop: MALLO_SPACING.md,
    padding: MALLO_SPACING.lg,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.warmGray,
  },
  noActionTitle: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    marginTop: MALLO_SPACING.sm,
  },
  inlineButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.red,
  },
  memoInput: {
    minHeight: 108,
    marginTop: MALLO_SPACING.sm,
    padding: MALLO_SPACING.md,
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
    ...MALLO_TYPOGRAPHY.body,
    color: MALLO_COLORS.core.ink,
    backgroundColor: MALLO_COLORS.core.white,
  },
  characterCount: {
    ...MALLO_TYPOGRAPHY.caption,
    alignSelf: 'flex-end',
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MALLO_SPACING.sm,
    marginTop: MALLO_SPACING.sm,
  },
  photoPreview: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.redTint,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: MALLO_RADIUS.md,
  },
  removeIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  photoButton: {
    minWidth: 116,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: MALLO_SPACING.xs,
    paddingHorizontal: MALLO_SPACING.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.md,
  },
  photoButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.support.charcoal,
  },
  photoCount: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.xs,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  noticeText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    marginTop: MALLO_SPACING.lg,
    color: MALLO_COLORS.core.red,
  },
  errorBox: {
    marginTop: MALLO_SPACING.lg,
    padding: MALLO_SPACING.md,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.support.redTint,
  },
  errorText: {
    ...MALLO_TYPOGRAPHY.secondaryBody,
    color: MALLO_COLORS.semantic.connect,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },
  saveGuide: {
    ...MALLO_TYPOGRAPHY.caption,
    marginTop: MALLO_SPACING.sm,
    textAlign: 'center',
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  consentOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MALLO_SPACING.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  consentModal: {
    width: '100%',
    maxWidth: 382,
    padding: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.lg,
    backgroundColor: MALLO_COLORS.core.white,
  },
  webNavigationButton: {
    width: WEB_NAVIGATION_BUTTON_SIZE,
    height: WEB_NAVIGATION_BUTTON_SIZE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MALLO_COLORS.support.mistGray,
    borderRadius: MALLO_RADIUS.full,
    backgroundColor: MALLO_COLORS.core.white,
  },
  webNavigationButtonDisabled: {
    opacity: 0.35,
  },
  consentTitle: {
    ...MALLO_TYPOGRAPHY.cardTitle,
    color: MALLO_COLORS.core.ink,
  },
  consentDescription: {
    ...MALLO_TYPOGRAPHY.body,
    ...MALLO_TEXT_STYLES.koreanWordWrap,
    marginTop: MALLO_SPACING.md,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  consentPrimaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MALLO_SPACING.xl,
    borderRadius: MALLO_RADIUS.md,
    backgroundColor: MALLO_COLORS.core.red,
  },
  consentPrimaryButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.core.white,
  },
  consentSecondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MALLO_SPACING.sm,
  },
  consentSecondaryButtonText: {
    ...MALLO_TYPOGRAPHY.buttonLabel,
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  pressed: {
    opacity: 0.68,
  },
});
