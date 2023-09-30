import Debug "mo:base/Debug";
import List "mo:base/List";
import Hash "mo:base/Hash";
import Result "mo:base/Result";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";

module IdManager {
    type ModelList<ModelT> = List.List<ModelT>;

    public func registerModels<ModelT>(idManager : IdManager<ModelT>, models : List.List<ModelT>, toString : ModelT -> Text) : () {
        for (model in List.toIter(models)) {
            var result = idManager.registerModel(model);

            switch result {
                case (#err(#alreadyRegistered)) {
                    Debug.print("`" # toString(model) # "` model already registered. Skipping...");
                };
                case (#ok) {};
            };
        };
    };

    public class IdManager<ModelT>(isEq : (ModelT, ModelT) -> Bool, hashOf : ModelT -> Hash.Hash) {
        let idCounter = TrieMap.TrieMap<ModelT, Nat>(isEq, hashOf);

        public func registerModel(model : ModelT) : Result.Result<(), { #alreadyRegistered }> {
            var existing = idCounter.get(model);

            switch existing {
                case (null) {
                    idCounter.put(model, 0);
                };
                case (?_) {
                    return #err(#alreadyRegistered);
                };
            };

            return #ok;
        };

        public func generateId(model : ModelT) : Nat {
            var latestId = idCounter.get(model);

            switch latestId {
                case null {
                    let id = 1;
                    idCounter.put(model, id);
                    id;
                };
                case (?val) {
                    let id = val + 1;
                    let _ = idCounter.replace(model, val + 1);

                    return id;
                };
            };
        };
    };

    public class SingleModelIdManager(initialId : ?Nat) {
        var idCounter = switch (initialId) {
            case null { 0 };
            case (?val) { val };
        };

        public func generateId() : Nat {
            idCounter += 1;
            return idCounter;
        };

        public func current() : Nat {
            idCounter;
        };

        // public func reset() : () {
        //     idCounter := 0;
        // };
    };
};
