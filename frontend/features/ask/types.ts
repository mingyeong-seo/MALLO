export type AskMalloState =
  | 'input'
  | 'loading'
  | 'behavior-follow-up'
  | 'general-result'
  | 'no-protocol'
  | 'unsupported-question'
  | 'error'
  | 'connect';

export type ActionResultDecision =
  | 'POSSIBLE'
  | 'ADJUST'
  | 'POSTPONE'
  | 'CONNECT';

export type FollowUpOption = {
  condition: string;
  decision: ActionResultDecision;
  description?: string;
  label: string;
};

export type RecoveryContext = {
  procedureName: string;
  recoveryDay: number;
};

export type QuestionComposerProps = {
  readonly attachments: readonly string[];
  readonly bottomClearance: number;
  readonly notice: string;
  readonly onChangeText: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onFocusChange?: (focused: boolean) => void;
  readonly onAddAttachment: () => void;
  readonly onRemoveAttachment: (attachment: string) => void;
  readonly suggestions: readonly string[];
  readonly value: string;
};

export type MockQuestionIntent =
  | 'exercise-follow-up'
  | 'wash-follow-up'
  | 'skincare-follow-up'
  | 'makeup-follow-up'
  | 'heat-follow-up'
  | 'general-result'
  | 'medical-connect'
  | 'mock-error'
  | 'unsupported-question';
