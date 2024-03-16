import Iter "mo:base/Iter";
import List "mo:base/List";
import Result "mo:base/Result";
import Text "mo:base/Text";

import Hex "mo:encoding/Hex";

import UUID "mo:uuid/UUID";

module UUIDUtils {
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
