import { Divider, Stack, Text, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { parse } from 'uuid';

import { useLayoutManager } from '@/LayoutManager';
import { useActivityLog } from '@/hooks/canisters/workspace/queries/useActivityLog';
import { Activity, ActivityUser } from '@/types';

import { ActivityLogBlockRenderer } from './Editor/ActivityLogBlockRenderer';
import classes from './PageInfoPanel.module.css';

export function PageInfoPanel() {
  const { pageId } = useParams<{ pageId: string }>();

  const getActivityLog = useActivityLog();
  const [activities, setActivities] = useState<Activity[]>([]);

  const { layout } = useLayoutManager();
  const isOpen = layout === 'PANEL_OPEN';

  useEffect(() => {
    if (!pageId) return;

    getActivityLog(parse(pageId)).then((result) => {
      setActivities(result);
    });
  }, [pageId, getActivityLog]);

  const getContributorsMessage = (users: ActivityUser[]) => {
    if (users.length === 1) {
      return `Edited by ${users[0].username}`;
    }

    if (users.length === 2) {
      return `Edited by ${users[0].username} and ${users[1].username}`;
    }

    return `Edited by ${users[0].username}, ${users[1].username}, and ${
      users.length - 2
    } others`;
  };

  return (
    <div className={classes.panel} style={isOpen ? {} : { width: '0' }}>
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
              <div className={classes.activity} key={activity.id}>
                <Text>{getContributorsMessage(activity.users)}</Text>
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
