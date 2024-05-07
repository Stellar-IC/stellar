import Map "mo:map/Map";
import Principal "mo:base/Principal";
import Array "mo:base/Array";

module UserClientMap {
    public type UserClientMap = Map.Map<Principal, [Principal]>;

    public func new() : UserClientMap {
        return Map.new<Principal, [Principal]>();
    };

    public func clientsForUser(map : UserClientMap, userIdentity : Principal) : [Principal] {
        switch (Map.get(map, Map.phash, userIdentity)) {
            case (?clients) { clients };
            case (null) { [] };
        };
    };

    public func addClient(
        map : UserClientMap,
        userIdentity : Principal,
        client : Principal,
    ) {
        let userClients = clientsForUser(map, userIdentity);
        let isAlreadyAssociated = Array.indexOf<Principal>(client, userClients, Principal.equal) != null;

        if (isAlreadyAssociated) {
            // already associated
            return;
        };

        ignore Map.put<Principal, [Principal]>(
            map,
            Map.phash,
            userIdentity,
            Array.append(
                [client],
                userClients,
            ),
        );
    };

    public func removeClients(
        map : UserClientMap,
        userIdentity : Principal,
        clients : [Principal],
    ) {
        let userClients = clientsForUser(map, userIdentity);
        let updatedUserClients = Array.filter<Principal>(
            userClients,
            func(c) {
                return Array.indexOf<Principal>(c, clients, Principal.equal) == null;
            },
        );

        ignore Map.put(map, Map.phash, userIdentity, updatedUserClients);
    };
};
