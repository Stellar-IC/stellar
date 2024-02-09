import { fromShareable } from '@/modules/serializers/block';

import {
  BlockByUuidResult,
  PageByUuidResult,
  UUID,
} from '../../../../declarations/workspace/workspace.did';

export function getPageExternalId(result: PageByUuidResult): UUID | null {
  return 'ok' in result ? result.ok?.uuid : null;
}

export function getBlockExternalId(result: BlockByUuidResult): UUID | null {
  return 'ok' in result ? result.ok.uuid : null;
}

export function serializePage(result: PageByUuidResult) {
  if (!('ok' in result)) return null;
  return fromShareable(result.ok);
}

export function serializeBlock(result: BlockByUuidResult) {
  if (!('ok' in result)) return null;
  return fromShareable(result.ok);
}
