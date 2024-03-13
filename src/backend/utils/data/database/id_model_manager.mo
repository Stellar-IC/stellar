import Debug "mo:base/Debug";
import List "mo:base/List";
import Nat "mo:base/Nat";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import UUID "mo:uuid/UUID";

import QuerySet "../../../utils/data/database/query_set";

module IDModelManager {
    public class IDModelManager<DataT <: { id : Nat }>() {
        private var data = RBTree.RBTree<Nat, DataT>(Nat.compare);

        public func all() : QuerySet.QuerySet<DataT> {
            var instances = List.fromArray<DataT>([]);

            for (entry in data.entries()) {
                let pk = entry.0;
                let instance = entry.1;
                instances := List.push<DataT>(instance, instances);
            };

            return QuerySet.QuerySet<DataT>(?List.toArray<DataT>(instances));
        };

        public func get(id : Nat) : ?DataT {
            return data.get(id);
        };

        public func upsert(item : DataT) : () {
            data.put(item.id, item);
        };

        public func delete(id : Nat) : () {
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

        public func preupgrade() : RBTree.Tree<Nat, DataT> {
            return data.share();
        };

        public func postupgrade(_data : RBTree.Tree<Nat, DataT>) : () {
            data.unshare(_data);
        };
    };
};
