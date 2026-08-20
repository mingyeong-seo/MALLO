export type AskMalloState =
  | 'input'
  | 'loading'
  | 'resolved'
  | 'error';

export type RecoveryContext = {
  procedureName: string;
  recoveryDay: number;
};
