export type AskMalloState =
  | 'input'
  | 'loading'
  | 'behavior-follow-up'
  | 'quick-result';
export type ActionResultDecision = 'POSSIBLE' | 'ADJUST' | 'POSTPONE';

export type QuickAnswer = {
  action: string;
  condition: string;
  decision: ActionResultDecision;
  title: string;
  description: string;
};

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
