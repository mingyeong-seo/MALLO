import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';

import { askMallo, createQuickCheck } from '@/api/client';
import type { AskResponseWire } from '@/api/contracts';
import { CONDITION_CONFIGS } from '@/features/check/data';
import type { ConditionOption } from '@/features/check/types';
import { useRecoveryFlow } from '@/features/recovery/RecoveryFlowProvider';
import type { QuickCheckAction } from '@/features/recovery/types';

import type { AskMalloState } from './types';
import { prepareAskRun } from './ask-run';
import { wait, waitForPaint } from './flow-timing';
import {
  mapMatchedAskToQuickCheck,
  mapMatchedCheckToQuickCheck,
} from './result-mapper';

const INITIAL_LOADING_DELAY_MS = 2800;
const FOLLOW_UP_LOADING_MIN_MS = 2200;
const CHECKED_HOLD_MS = 700;

export function useAskFlow() {
  const { question: previewQuestion, state: previewState, reset: resetRequest } =
    useLocalSearchParams<{
      question?: string;
      state?: string;
      reset?: string;
    }>();
  const rootNavigation = useNavigation('/');
  const { recoverySession, saveQuickCheck } = useRecoveryFlow();
  const isLoadingPreview = previewState === 'loading';
  const loadingPreviewQuestion =
    typeof previewQuestion === 'string' && previewQuestion.trim()
      ? previewQuestion.trim()
      : '세안해도 될까?';
  const [screenState, setScreenState] = useState<AskMalloState>(
    isLoadingPreview ? 'loading' : 'input',
  );
  const [question, setQuestion] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [inputNotice, setInputNotice] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [pendingAction, setPendingAction] =
    useState<QuickCheckAction>('EXERCISE');
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const recoveryContext = useMemo(
    () => ({
      procedureName: recoverySession?.procedureName ?? 'REJURAN',
      recoveryDay: (recoverySession?.elapsedDay ?? 0) + 1,
    }),
    [recoverySession],
  );

  const resetQuestion = useCallback(() => {
    Keyboard.dismiss();
    setScreenState('input');
    setQuestion('');
    setSubmittedQuestion('');
    setInputNotice('');
    setStatusMessage('');
    setIsComposerFocused(false);
    setIsLoadingComplete(false);
  }, []);

  useEffect(() => {
    if (typeof resetRequest === 'string' && !isLoadingPreview) {
      resetQuestion();
    }
  }, [isLoadingPreview, resetQuestion, resetRequest]);

  const showCheckedThen = useCallback(async (next: () => void) => {
    setIsLoadingComplete(true);
    await waitForPaint();
    await wait(CHECKED_HOLD_MS);
    next();
  }, []);

  const openStoredResult = useCallback(
    (checkId: string, resultQuestion: string) => {
      router.push({
        pathname: '/(tabs)/check/result',
        params: { checkId, question: resultQuestion, source: 'ask-mallo' },
      });
    },
    [],
  );

  const applyAskResponse = useCallback(
    async (response: AskResponseWire, resultQuestion: string) => {
      switch (response.status) {
        case 'MATCHED': {
          const result = mapMatchedAskToQuickCheck(
            response,
            recoverySession?.elapsedDay ?? 0,
          );
          saveQuickCheck(result);
          await showCheckedThen(() =>
            openStoredResult(result.checkId, resultQuestion),
          );
          return;
        }
        case 'CLARIFY':
          if (response.action === null) {
            throw new InvalidClarifyResponseError();
          }
          setPendingAction(response.action);
          setStatusMessage(response.message ?? '행동 조건을 선택해 주세요.');
          setScreenState('behavior-follow-up');
          return;
        case 'CONNECT':
          setStatusMessage(response.message ?? '의료진의 확인이 필요해요.');
          await showCheckedThen(() => setScreenState('connect'));
          return;
        case 'NO_PROTOCOL':
          setStatusMessage(response.message ?? '현재 제공할 수 있는 안내가 없어요.');
          await showCheckedThen(() => setScreenState('no-protocol'));
          return;
        case 'GENERAL':
          setStatusMessage(response.message ?? '회복 안내를 확인해 주세요.');
          await showCheckedThen(() => setScreenState('general-result'));
          return;
        case 'UNSUPPORTED':
          setStatusMessage(response.message ?? '이 질문은 아직 확인하기 어려워요.');
          await showCheckedThen(() => setScreenState('unsupported-question'));
          return;
        default:
          return assertNever(response.status);
      }
    },
    [
      openStoredResult,
      recoverySession?.elapsedDay,
      saveQuickCheck,
      showCheckedThen,
    ],
  );

  const runQuestion = useCallback(
    async (rawQuestion: string) => {
      const prepared = prepareAskRun(rawQuestion);
      if (!prepared.resultQuestion) {
        setInputNotice('질문을 입력해 주세요.');
        return;
      }
      if (recoverySession === null) {
        setInputNotice('먼저 Recovery Journey를 시작해 주세요.');
        return;
      }
      setQuestion(prepared.resultQuestion);
      setSubmittedQuestion(prepared.resultQuestion);
      setInputNotice('');
      setIsLoadingComplete(false);
      setScreenState('loading');
      Keyboard.dismiss();

      try {
        const [response] = await Promise.all([
          askMallo(recoverySession.sessionId, prepared.request),
          wait(INITIAL_LOADING_DELAY_MS),
        ]);
        await applyAskResponse(response, prepared.resultQuestion);
      } catch (error) {
        if (!(error instanceof Error)) {
          throw error;
        }
        setScreenState('error');
      }
    },
    [applyAskResponse, recoverySession],
  );

  const completeConditionCheck = useCallback(
    async (option: ConditionOption) => {
      if (recoverySession === null) {
        setScreenState('error');
        return;
      }
      const config = CONDITION_CONFIGS[pendingAction];
      Keyboard.dismiss();
      setIsLoadingComplete(false);
      setScreenState('loading');

      try {
        const [response] = await Promise.all([
          createQuickCheck(recoverySession.sessionId, {
            action: pendingAction,
            context: { [config.contextKey]: option.value },
          }),
          wait(FOLLOW_UP_LOADING_MIN_MS),
        ]);
        if (response.status === 'NO_PROTOCOL') {
          setStatusMessage('현재 조건에 맞는 Recovery Protocol이 없어요.');
          setScreenState('no-protocol');
          return;
        }
        const result = mapMatchedCheckToQuickCheck(response);
        saveQuickCheck(result);
        await showCheckedThen(() =>
          openStoredResult(result.checkId, submittedQuestion),
        );
      } catch (error) {
        if (!(error instanceof Error)) {
          throw error;
        }
        setScreenState('error');
      }
    },
    [
      openStoredResult,
      pendingAction,
      recoverySession,
      saveQuickCheck,
      showCheckedThen,
      submittedQuestion,
    ],
  );

  return {
    completeConditionCheck,
    inputNotice,
    isComposerFocused,
    isLoadingComplete,
    isLoadingPreview,
    loadingPreviewQuestion,
    pendingAction,
    question,
    recoveryContext,
    resetQuestion,
    rootNavigation,
    runQuestion,
    screenState,
    setInputNotice,
    setIsComposerFocused,
    setQuestion,
    statusMessage,
    submittedQuestion,
  };
}

class InvalidClarifyResponseError extends Error {
  constructor() {
    super('CLARIFY response requires an action');
    this.name = 'InvalidClarifyResponseError';
  }
}

function assertNever(value: never): never {
  throw new UnreachableAskStatusError(value);
}

class UnreachableAskStatusError extends Error {
  readonly status: never;

  constructor(status: never) {
    super('Unreachable ASK status');
    this.name = 'UnreachableAskStatusError';
    this.status = status;
  }
}
