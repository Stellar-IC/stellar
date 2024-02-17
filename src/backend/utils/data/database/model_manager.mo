import Bool "mo:base/Bool";
import List "mo:base/List";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import Order "mo:base/Order";
import DatabaseIndex "./database_index";
import QuerySet "./query_set";
import Types "./types";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";

module ModelManager {
    type FilterValue = Types.FilterValue;
    type FilterPredicate = Types.FilterPredicate;

    class Filterable() {
        public func nat(val : Nat) : FilterValue {
            return #nat(val);
        };

        public func text(val : Text) : FilterValue {
            return #text(val);
        };
    };

    class Predicate() = {
        public func equals(attr_value : FilterValue) : FilterPredicate {
            return #equals(func(other_value : FilterValue) { attr_value == other_value });
        };
    };

    public class ModelManager<PrimaryKeyT, DataT, UnsavedDataT>(
        init_args : {
            pk_attr_name : Text;
            pk_compare : (PrimaryKeyT, PrimaryKeyT) -> Order.Order;
            pk_getter : (Text, DataT) -> ?PrimaryKeyT;
            get_unique_pk : () -> PrimaryKeyT;
            prepare_obj_for_insert : (pk : PrimaryKeyT, data : UnsavedDataT) -> DataT;
            indexes : List.List<Types.IndexConfig<DataT, PrimaryKeyT>>;
            stable_data : RBTree.Tree<PrimaryKeyT, DataT>;
        }
    ) {
        let { pk_attr_name; pk_compare; pk_getter } = init_args;

        public let data = RBTree.RBTree<PrimaryKeyT, DataT>(pk_compare);

        // restore data from stable storage
        data.unshare(init_args.stable_data);

        // create indexes, which are populated at the end of this module
        let indexes = RBTree.RBTree<Text, Types.Index<Text, PrimaryKeyT>>(Text.compare);
        List.iterate<Types.IndexConfig<DataT, PrimaryKeyT>>(
            init_args.indexes,
            func _addIndexOnField(index_config : Types.IndexConfig<DataT, PrimaryKeyT>) {
                let { field_name; index_type } = index_config;
                let index_prefix = switch (index_type) {
                    case (#unique) {
                        "unique";
                    };
                };

                indexes.put(
                    index_prefix # "__" # field_name,
                    DatabaseIndex.DatabaseIndex<PrimaryKeyT>({
                        name = field_name;
                    }),
                );
            },
        );

        /**
         * Get all model instances.
         */
        public func all() : QuerySet.QuerySet<DataT> {
            let entries = data.entries();
            var instances = List.fromArray<DataT>([]);

            for (entry in entries) {
                let pk = entry.0;
                let instance = entry.1;
                instances := List.push<DataT>(instance, instances);
            };

            return QuerySet.QuerySet<DataT>(?List.toArray<DataT>(instances));
        };

        /**
         * Get a model instance by its primary key.
         */
        public func get(pk : PrimaryKeyT) : ?DataT {
            let instance = data.get(pk);
        };

        public func filter(
            getter : (obj : DataT) -> FilterValue,
            predicate : FilterPredicate,
        ) : QuerySet.QuerySet<DataT> {
            var instances = List.fromArray<DataT>([]);

            for (entry in data.entries()) {
                let pk = entry.0;
                let instance = entry.1;
                let value = getter(instance);

                switch (predicate) {
                    case (#equals(predicate)) {
                        switch (value) {
                            case (#nat(value)) {
                                if (predicate(#nat(value))) {
                                    ignore List.push<DataT>(instance, instances);
                                };
                            };
                            case (#text(value)) {
                                if (predicate(#text(value))) {
                                    ignore List.push<DataT>(instance, instances);
                                };
                            };
                        };
                    };
                };
            };

            return QuerySet.QuerySet<DataT>(?List.toArray<DataT>(instances));
        };

        public func predicateFilter(
            predicate : (instance : DataT) -> Bool
        ) : QuerySet.QuerySet<DataT> {
            var instances = List.fromArray<DataT>([]);

            for (entry in data.entries()) {
                let pk = entry.0;
                let instance = entry.1;
                if (predicate(instance)) {
                    ignore List.push<DataT>(instance, instances);
                };
            };

            return QuerySet.QuerySet<DataT>(?List.toArray<DataT>(instances));
        };

        public func indexFilter(
            attrName : Text,
            attrValue : FilterValue,
        ) : QuerySet.QuerySet<DataT> {
            let index_name = _getIndexName(#unique, attrName);
            let index = indexes.get(index_name);
            var instances = List.fromArray<DataT>([]);

            switch (index) {
                case (null) {};
                case (?index) {
                    switch (attrValue) {
                        case (#nat(attrValue)) {
                            let pks = index.get(Nat.toText(attrValue));
                            instances := _getInstancesByPk(pks);
                        };
                        case (#text(attrValue)) {
                            let pks = index.get(attrValue);
                            instances := _getInstancesByPk(pks);
                        };
                    };
                };
            };

            return QuerySet.QuerySet<DataT>(?List.toArray<DataT>(instances));
        };

        public func insert(obj : UnsavedDataT) : Result.Result<(pk : PrimaryKeyT, obj : DataT), { #keyAlreadyExists }> {
            let pk = init_args.get_unique_pk();
            let existing = data.get(pk);

            switch (existing) {
                case (?val) {
                    return #err(#keyAlreadyExists);
                };
                case null {};
            };
            let final_obj = init_args.prepare_obj_for_insert(pk, obj);
            data.put(pk, final_obj);

            store_indexed_fields(final_obj);

            return #ok(pk, final_obj);
        };

        public func update(
            obj : DataT
        ) : Result.Result<(pk : PrimaryKeyT, obj : DataT), { #primaryKeyAttrNotFound }> {
            let pk = pk_getter(pk_attr_name, obj);
            let final_pk = switch (pk) {
                case (null) { return #err(#primaryKeyAttrNotFound) };
                case (?pk) { pk };
            };

            data.put(final_pk, obj);

            return #ok(final_pk, obj);
        };

        public func delete(
            id : PrimaryKeyT
        ) : () {
            ignore data.remove(id);
        };

        private func store_indexed_fields(obj : DataT) {
            List.iterate<Types.IndexConfig<DataT, PrimaryKeyT>>(
                init_args.indexes,
                func _storeValueInIndex(index_config : Types.IndexConfig<DataT, PrimaryKeyT>) : () {
                    let {
                        field_name;
                        index_type;
                        add_value_to_index;
                    } = index_config;
                    let index_name = _getIndexName(index_type, field_name);
                    let index : ?Types.Index<Text, PrimaryKeyT> = indexes.get(index_name);

                    switch (index) {
                        case (null) {};
                        case (?index) {
                            add_value_to_index(field_name, obj, index);
                        };
                    };
                },
            );
        };

        private func _getIndexPrefix(index_type : Types.IndexType) : Text {
            return switch (index_type) {
                case (#unique) {
                    "unique";
                };
            };
        };

        private func _getIndexName(index_type : Types.IndexType, field_name : Text) : Text {
            let index_prefix = _getIndexPrefix(index_type);
            return index_prefix # "__" # field_name;
        };

        private func _getByIndex<AttrT>(attr_name : Text, value : AttrT) : List.List<DataT> {
            let index_name = _getIndexName(#unique, attr_name);
            let index = indexes.get(index_name);
            let pks : List.List<PrimaryKeyT> = switch (index) {
                case (null) { null };
                case (?index) {
                    index.get(attr_name);
                };
            };

            var model_instances = List.fromArray<DataT>([]);
            List.iterate<PrimaryKeyT>(
                pks,
                func _addModelInstance(pk : PrimaryKeyT) : () {
                    let model_instance = data.get(pk);
                    switch (model_instance) {
                        case (null) {};
                        case (?model_instance) {
                            model_instances := List.push<DataT>(model_instance, model_instances);
                        };
                    };
                },
            );

            return model_instances;
        };

        private func _getInstancesByPk(pks : List.List<PrimaryKeyT>) : List.List<DataT> {
            var instances = List.fromArray<DataT>([]);

            // Get corresponding instances
            List.iterate<PrimaryKeyT>(
                pks,
                func _get(pk : PrimaryKeyT) : () {

                    let instance = data.get(pk);
                    switch (instance) {
                        case (null) {};
                        case (?instance) {
                            instances := List.push<DataT>(instance, instances);
                        };
                    };
                },
            );

            instances;
        };

        // populate indexes
        for (entry in data.entries()) {
            let pk = entry.0;
            let instance = entry.1;
            store_indexed_fields(instance);
        };
    };
};
