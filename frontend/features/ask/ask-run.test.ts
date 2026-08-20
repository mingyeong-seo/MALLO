import { describe, expect, it } from 'vitest';

import { prepareAskRun } from './ask-run';

describe('ASK run context', () => {
  it('keeps each normalized question as its own result question', () => {
    // Given
    const firstInput = '  오늘 운동해도 될까요?  ';
    const nextInput = '오늘 세안해도 될까요?';

    // When
    const first = prepareAskRun(firstInput);
    const next = prepareAskRun(nextInput);

    // Then
    expect([first, next]).toMatchObject([
      { kind: 'ready', resultQuestion: '오늘 운동해도 될까요?' },
      { kind: 'ready', resultQuestion: '오늘 세안해도 될까요?' },
    ]);
  });

  it('rejects a normalized question longer than the AI contract limit', () => {
    // Given
    const input = '가'.repeat(501);

    // When
    const result = prepareAskRun(input);

    // Then
    expect(result).toEqual({
      kind: 'invalid',
      notice: '질문은 500자 이내로 입력해 주세요.',
    });
  });

  it('accepts a question exactly at the AI contract limit', () => {
    // Given
    const input = '가'.repeat(500);

    // When
    const result = prepareAskRun(input);

    // Then
    expect(result).toMatchObject({ kind: 'ready', resultQuestion: input });
  });
});
