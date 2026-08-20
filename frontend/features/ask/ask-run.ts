import type { AskInput } from '../../api/contracts';

export type PreparedAskRun = {
  readonly request: AskInput;
  readonly resultQuestion: string;
};

export function prepareAskRun(rawQuestion: string): PreparedAskRun {
  const resultQuestion = rawQuestion.trim();
  return {
    request: {
      question: resultQuestion,
      photo_record_ids: [],
    },
    resultQuestion,
  };
}
