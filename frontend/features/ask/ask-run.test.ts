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
    expect([first.resultQuestion, next.resultQuestion]).toEqual([
      '오늘 운동해도 될까요?',
      '오늘 세안해도 될까요?',
    ]);
  });
});
