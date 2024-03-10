import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { stringify } from 'uuid';

import { db } from '@/db';
import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { fromShareable } from '@/modules/blocks/serializers';
import { CanisterId } from '@/types';

import { UUID } from '../../../../../../declarations/workspace/workspace.did';

export const useActivityLog = (opts: {
  identity: Identity;
  workspaceId: CanisterId;
}) => {
  const { identity, workspaceId } = opts;
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const activityLog = useCallback(
    (arg_0: UUID) =>
      actor
        .activityLog(arg_0)
        .then((result) => {
          const { edges } = result;
          const activities = edges.map((edge) => {
            const { node } = edge;

            return {
              ...node,
              uuid: stringify(node.uuid),
              blockExternalId: stringify(node.blockExternalId),
              endTime: node.endTime,
              startTime: node.startTime,
              edits: node.edits.map((edit) => ({
                ...edit,
                blockValue: {
                  ...edit.blockValue,
                  before: edit.blockValue.before[0]
                    ? fromShareable(edit.blockValue.before[0])
                    : null,
                  after: fromShareable(edit.blockValue.after),
                },
                startTime: edit.startTime,
              })),
              users: node.users,
            };
          });

          return activities;
        })
        .then(async (activities) => {
          await db.transaction('rw', db.activities, async () => {
            await Promise.all(
              activities.map(async (activity) => {
                await db.activities.put(activity);
              })
            );
          });

          return activities;
        })
        .catch((err) => {
          throw err;
        }),
    [actor]
  );

  return activityLog;
};
