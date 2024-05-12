// eslint-disable-next-line max-classes-per-file
import Dexie, { Table } from 'dexie';

import { Tree } from '@/modules/lseq';

import { SerializedBlockEvent } from './modules/events/types';
import { LocalStorageActivity, LocalStorageBlock } from './types';

class AppDatabase extends Dexie {
  public activities!: Table<LocalStorageActivity, string>;
  public blocks!: Table<LocalStorageBlock, string>;
  public blockEvents!: Table<SerializedBlockEvent, string>;

  public constructor() {
    super('AppDatabase');
    this.version(1).stores({
      blocks: '&uuid,&id,parent',
      activities: '&id,startTime,endTime,blockExternalId',
      blockEvents: '&uuid,blockExternalId,user,timestamp',
    });
  }
}

export const db = new AppDatabase();

db.blocks.hook('reading', (obj) => {
  if (!obj) return undefined;

  return {
    ...obj,
    content: Tree.clone(obj.content),
    properties: {
      ...obj.properties,
      title: Tree.clone(obj.properties.title),
    },
  };
});
