import type { QuickCheckResponseWire } from '../../api/contracts';
import type { QuickCheckResult } from '../recovery/types';
import { mapMatchedCheckToQuickCheck } from '../ask/result-mapper';

export type QuickCheckResolution =
  | { readonly kind: 'matched'; readonly result: QuickCheckResult }
  | { readonly kind: 'no-protocol' };

export function resolveQuickCheckResponse(
  response: QuickCheckResponseWire,
): QuickCheckResolution {
  if (response.status === 'NO_PROTOCOL') {
    return { kind: 'no-protocol' };
  }

  return {
    kind: 'matched',
    result: mapMatchedCheckToQuickCheck(response),
  };
}
