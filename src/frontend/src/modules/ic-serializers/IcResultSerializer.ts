type IcResult<DataT, ErrorT> = { ok: DataT } | { err: ErrorT };

export class IcResultSerializer<DataT, ErrorT, SerializedDataT> {
  serialize = (
    result: IcResult<DataT, ErrorT>,
    opts: {
      fromShareable: (data: DataT) => SerializedDataT;
    }
  ): SerializedDataT | null => {
    // TODO: Handle errors
    if (!('ok' in result)) return null;

    return opts.fromShareable(result.ok);
  };
}
