import { fromShareable } from '@/modules/blocks/serializers';

import {
  BlockByUuidResult,
  PageByUuidResult,
  UUID,
} from '../../../../declarations/workspace/workspace.did';

export function getPageExternalId(result: PageByUuidResult): UUID | null {
  return 'ok' in result ? result.ok?.page.uuid : null;
}

export function getBlockExternalId(result: BlockByUuidResult): UUID | null {
  return 'ok' in result ? result.ok.uuid : null;
}

export function serializePage(result: PageByUuidResult) {
  if (!('ok' in result)) return null;
  const pageId = result.ok.page.uuid;
  const page = result.ok._records.blocks.filter(
    (block) => block.uuid === pageId
  )[0];
  return fromShareable(page);
}

export function serializeBlock(result: BlockByUuidResult) {
  if (!('ok' in result)) return null;
  return fromShareable(result.ok);
}
