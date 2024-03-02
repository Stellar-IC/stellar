import { Divider, Stack, Text, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { parse } from 'uuid';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useActivityLog } from '@/hooks/documents/queries/useActivityLog';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { Activity } from '@/types';

import { ActivityLogBlockRenderer } from './Editor/ActivityLogBlockRenderer';
import classes from './PageInfoPanel.module.css';

export function PageInfoPanel() {
  const { pageId } = useParams<{ pageId: string }>();
  const { workspaceId } = useWorkspaceContext();
  const { identity } = useAuthContext();

  const getActivityLog = useActivityLog({ identity, workspaceId });
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!pageId) return;

    getActivityLog(parse(pageId)).then((result) => {
      setActivities(result);
    });
  }, [pageId, getActivityLog]);

  return (
    <div className={classes.panel}>
      <div className={classes.inner}>
        <Title size="xs" ml="sm" mb="sm" mt="sm">
          Activity Log
        </Title>
        <Divider />
        <div className={classes.activityList}>
          {activities.map((activity) => {
            const blockBeforeEdit = activity.edits[0]?.blockValue.before;
            const blockAfterEdit =
              activity.edits[activity.edits.length - 1].blockValue.after;

            return (
              <div className={classes.activity}>
                <Text size="sm">
                  {dayjs(new Date(Number(activity.endTime))).fromNow()}
                </Text>
                <Stack gap="xs">
                  {/* <div>
                    Before:{' '}
                    {blockBeforeEdit
                      ? Tree.toText(blockBeforeEdit.properties.title)
                      : null}
                  </div> */}
                  {/* <div>{Tree.toText(blockAfterEdit.properties.title)}</div> */}
                  <ActivityLogBlockRenderer
                    blockValue={{
                      before: blockBeforeEdit,
                      after: blockAfterEdit,
                    }}
                  />
                  {/* <div>{stringify(activity.blockExternalId)}</div> */}
                </Stack>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
