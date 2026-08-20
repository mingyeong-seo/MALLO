import type { AskInput } from '../../api/contracts';

export const MAX_QUESTION_LENGTH = 500;

export type PreparedAskRun =
  | {
      readonly kind: 'ready';
      readonly request: AskInput;
      readonly resultQuestion: string;
    }
  | { readonly kind: 'invalid'; readonly notice: string };

export function prepareAskRun(rawQuestion: string): PreparedAskRun {
  const resultQuestion = rawQuestion.trim();
  if (!resultQuestion) {
    return { kind: 'invalid', notice: '질문을 입력해 주세요.' };
  }
  if (resultQuestion.length > MAX_QUESTION_LENGTH) {
    return {
      kind: 'invalid',
      notice: '질문은 500자 이내로 입력해 주세요.',
    };
  }

  return {
    kind: 'ready',
    request: {
      question: resultQuestion,
      photo_record_ids: [],
    },
    resultQuestion,
  };
}
