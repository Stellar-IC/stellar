import Map "mo:map/Map";
import Result "mo:base/Result";
import Debug "mo:base/Debug";

module Collection {
    type Result<T, E> = Result.Result<T, E>;
    type PrimaryKey = Text;

    public class Collection<T>() {
        public let data = Map.new<Text, T>();
    };

    public func add<T>(
        collection : Collection<T>,
        pk : PrimaryKey,
        input : T,
    ) : Result<(), { #PkAlreadyInUse }> {
        switch (Map.get(collection.data, Map.thash, pk)) {
            case (null) {};
            case (?_) { return #err(#PkAlreadyInUse) };
        };

        ignore Map.put(collection.data, Map.thash, pk, input);

        #ok;
    };

    public func delete<T>(collection : Collection<T>, id : Text) : () {
        Map.delete<Text, T>(
            collection.data,
            Map.thash,
            id,
        );
    };

    public func find<T>(collection : Collection<T>, id : Text) : ?T {
        let result = Map.get<Text, T>(
            collection.data,
            Map.thash,
            id,
        );

        switch result {
            case (null) { return null };
            case (?block) { return ?block };
        };
    };

    public func get<T>(collection : Collection<T>, id : Text) : T {
        let block = find(collection, id);

        switch block {
            case (?block) { return block };
            case (null) { Debug.trap("Item not found: " # id) };
        };
    };

    public func update<T>(
        collection : Collection<T>,
        pk : PrimaryKey,
        input : T,
    ) : Result.Result<(), { #NotFound }> {
        let existing = find(collection, pk);

        switch (existing) {
            case (?_) {
                ignore Map.put(collection.data, Map.thash, pk, input);
                #ok;
            };
            case (null) { #err(#NotFound) };
        };
    };
};
