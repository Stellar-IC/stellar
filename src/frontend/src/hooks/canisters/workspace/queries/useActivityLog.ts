import { useCallback } from 'react';
import { stringify } from 'uuid';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { fromShareable } from '@/modules/blocks/serializers';
import { Activity } from '@/types';

import { UUID } from '../../../../../../declarations/workspace/workspace.did';

export const useActivityLog = () => {
  const { actor } = useWorkspaceContext();

  const activityLog = useCallback(
    (arg_0: UUID): Promise<Activity[]> =>
      actor
        .activityLog(arg_0)
        .then((result) => {
          const { edges } = result;
          const activities = edges.map((edge) => {
            const { node } = edge;

            return {
              ...node,
              blockExternalId: stringify(node.blockExternalId),
              endTime: node.endTime / BigInt(1_000_000),
              startTime: node.startTime / BigInt(1_000_000),
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
                await db.activities.put({
                  ...activity,
                  id: activity.id.toString(),
                });
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
