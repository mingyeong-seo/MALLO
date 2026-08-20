import { describe, expect, it } from 'vitest';

import { askResponseSchema } from '../../api/contracts';
import { mapMatchedAskToQuickCheck } from './result-mapper';

describe('ASK result mapper', () => {
  it('maps a matched response to the existing result model when the backend omits a version', () => {
    // Given
    const response = askResponseSchema.parse({
      interaction_id: 17,
      session_id: 'b408c168-d217-49f9-9cd2-c3c487819cc9',
      status: 'MATCHED',
      action: 'EXERCISE',
      context: { intensity: 'INTENSE_ACTIVITY' },
      decision: 'POSTPONE',
      guidance: '열과 땀이 발생하는 운동은 미뤄주세요.',
      message: null,
      next_action: { type: 'VIEW_ALTERNATIVE', label: '대안 보기' },
      protocol_ref: 'REJURAN-D0-EXERCISE-03',
      photo_record_ids: [],
      created_at: '2026-08-20T17:00:00',
    });

    // When
    const result = mapMatchedAskToQuickCheck(response, 0);

    // Then
    expect(result).toEqual({
      action: 'EXERCISE',
      checkId: 'ask-17',
      context: { intensity: 'INTENSE_ACTIVITY' },
      contextLabel: '격렬한 운동',
      createdAt: '2026-08-20T17:00:00',
      decision: 'POSTPONE',
      elapsedDay: 0,
      headline: '오늘은 미루는 게 좋아요',
      nextAction: { type: 'VIEW_ALTERNATIVE', label: '대안 보기' },
      protocolRefs: ['REJURAN-D0-EXERCISE-03'],
      protocolVersion: null,
      reason: '열과 땀이 발생하는 운동은 미뤄주세요.',
    });
  });
});
