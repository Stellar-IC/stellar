import { useEffect, useState } from 'react';

import { Block } from '@/types';

class Table<DataT> {
  private _data: { [key: string]: DataT } = {};
  private _subsctibers: ((table: Table<DataT>) => void)[] = [];

  bulkPut = (
    items: {
      key: string;
      value: DataT;
    }[]
  ) => {
    items.forEach(({ key, value }) => {
      this._data[key] = value;
    });

    this.publish();
  };

  get = (key: string): DataT | null => this._data[key];

  put = (key: string, value: DataT) => {
    this._data[key] = value;
    this.publish();
  };

  subscribe = (callback: (table: Table<DataT>) => void) => {
    this._subsctibers.push(callback);

    return {
      unsubscribe: () => {
        this._subsctibers = this._subsctibers.filter((cb) => cb !== callback);
      },
    };
  };

  publish = () => {
    this._subsctibers.forEach((cb) => cb(this));
  };
}

export const store: {
  blocks: Table<Block>;
} = {
  blocks: new Table(),
};

export const useStoreQuery = <ReturnT>(queryFn: () => ReturnT | null) => {
  const [data, setData] = useState<ReturnT | null>(queryFn());

  useEffect(() => {
    const subscription = store.blocks.subscribe(() => {
      const newData = queryFn();
      if (newData !== data) {
        setData(newData);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [data, queryFn]);

  return data;
};
