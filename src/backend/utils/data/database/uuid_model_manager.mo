import Debug "mo:base/Debug";
import List "mo:base/List";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import UUID "mo:uuid/UUID";

import QuerySet "../../../utils/data/database/query_set";

module UUIDModelManager {
    public class UUIDModelManager<DataT <: { uuid : UUID.UUID }>() {
        private var data = RBTree.RBTree<Text, DataT>(Text.compare);

        public func all() : QuerySet.QuerySet<DataT> {
            var instances = List.fromArray<DataT>([]);

            for (entry in data.entries()) {
                let pk = entry.0;
                let instance = entry.1;
                instances := List.push<DataT>(instance, instances);
            };

            Debug.print("all: " # debug_show List.size<DataT>(instances));

            return QuerySet.QuerySet<DataT>(?List.toArray<DataT>(instances));
        };

        public func get(id : Text) : ?DataT {
            return data.get(id);
        };

        public func upsert(item : DataT) : () {
            data.put(UUID.toText(item.uuid), item);
        };

        public func delete(id : Text) : () {
            ignore data.remove(id);
        };

        public func filter(
            predicate : (obj : DataT) -> Bool
        ) : QuerySet.QuerySet<DataT> {
            var instances = List.fromArray<DataT>([]);

            for (entry in data.entries()) {
                let pk = entry.0;
                let instance = entry.1;

                if (predicate(instance)) {
                    instances := List.push<DataT>(instance, instances);
                };
            };

            return QuerySet.QuerySet<DataT>(?List.toArray<DataT>(instances));
        };

        public func preupgrade() : RBTree.Tree<Text, DataT> {
            return data.share();
        };

        public func postupgrade(_data : RBTree.Tree<Text, DataT>) : () {
            data.unshare(_data);
        };
    };
};
