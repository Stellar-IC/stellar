import List "mo:base/List";

import CoreTypes "../../types";

module Paginator {
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
