export type AskMalloState = 'input' | 'loading' | 'behavior-follow-up';

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

export type MockQuestionIntent =
  | 'exercise-follow-up'
  | 'wash-result'
  | 'skincare-result'
  | 'unclassified';
