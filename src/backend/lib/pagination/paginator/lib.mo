import List "mo:base/List";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";

import CoreTypes "../../../types";

module Paginator {
    public func paginateBuffer<DataT>(items : Buffer.Buffer<DataT>) : CoreTypes.PaginatedResults<DataT> {
        let result = {
            edges = Buffer.toArray<CoreTypes.Edge<DataT>>(
                Buffer.map<DataT, CoreTypes.Edge<DataT>>(
                    items,
                    func(item) {
                        { node = item };
                    },
                )
            );
        };

        return result;
    };

    public func paginateList<DataT>(items : List.List<DataT>) : CoreTypes.PaginatedResults<DataT> {
        let result = {
            edges = List.toArray<CoreTypes.Edge<DataT>>(
                List.map<DataT, CoreTypes.Edge<DataT>>(
                    items,
                    func(item) {
                        { node = item };
                    },
                )
            );
        };

        return result;
    };
};
