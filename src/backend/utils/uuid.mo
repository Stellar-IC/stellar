import Iter "mo:base/Iter";
import List "mo:base/List";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Order "mo:base/Order";
import Nat8 "mo:base/Nat8";
import Hex "mo:encoding/Hex";
import UUID "mo:uuid/UUID";

module UUIDUtils {
    public func compare(a : UUID.UUID, b : UUID.UUID) : Order.Order {
        let listA : List.List<Nat8> = List.fromArray(a);
        let listB : List.List<Nat8> = List.fromArray(b);

        return List.compare<Nat8>(listA, listB, Nat8.compare);
    };

    public func fromText(t : Text) : Result.Result<UUID.UUID, Text> {
        var uuid = List.fromArray<Nat8>([]);
        let parts = Iter.toList(
            Text.split(t, #char '-')
        );

        if (List.size(parts) != 5) {
            return #err("Invalid UUID format");
        };

        for (part in List.toIter(parts)) {
            let x = Hex.decode(part);
            switch (x) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(xs)) {
                    uuid := List.append<Nat8>(uuid, List.fromArray<Nat8>(xs));
                };
            };
        };

        #ok(List.toArray(uuid));
    };
};
