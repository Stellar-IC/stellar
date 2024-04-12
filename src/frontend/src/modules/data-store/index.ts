import { useEffect, useState } from 'react';

import { Block } from '@/types';

class Table<DataT> {
  _data: { [key: string]: DataT } = {};
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

export const useStoreQuery = <ReturnT>(
  queryFn: () => ReturnT | null,
  opts: {
    clone?: (data: ReturnT | null) => ReturnT | null;
    compare?: (a: ReturnT, b: ReturnT) => boolean;
  } = {}
) => {
  const [data, setData] = useState<ReturnT | null>(queryFn());
  const {
    compare = (a, b) => a === b,
    clone = (data) => structuredClone(data),
  } = opts;

  useEffect(() => {
    const subscription = store.blocks.subscribe(() => {
      const newData = clone(queryFn());

      if (newData === null && data === null) return;

      if (newData === null || data === null) {
        setData(newData);
        return;
      }
      if (compare(newData, data) === false) {
        setData(newData);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clone, compare, data, queryFn]);

  return data;
};
