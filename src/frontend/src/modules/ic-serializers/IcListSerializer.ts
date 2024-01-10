import { IcShareableList } from './types';

export class IcListSerializer<DataT, SerializedDataT> {
  serialize = (
    list: IcShareableList<DataT>,
    opts: {
      fromShareable: (data: DataT) => SerializedDataT;
    }
  ): SerializedDataT[] => {
    if (list.length === 0) {
      return list;
    }

    const final: SerializedDataT[] = [];
    const maxIterations = 1000;

    let currentItem = list[0][0];
    let remaining = list[0][1];
    let i = 1;

    final.push(opts.fromShareable(currentItem));

    while (i < maxIterations && remaining[0]) {
      // eslint-disable-next-line prefer-destructuring
      currentItem = remaining[0][0];
      // eslint-disable-next-line prefer-destructuring
      remaining = remaining[0][1];
      final.push(opts.fromShareable(currentItem));
      i += 1;
    }

    return final;
  };
}
