import Types "./types";

module TreeEvent {
    public func toText(event : Types.TreeEvent) : Text {
        let blockExternalId = switch (event) {
            case (#delete(data)) {
                "Delete node at position: " # debug_show (data.position);
            };
            case (#insert(data)) {
                "Insert node at position: " # debug_show (data.position) # " with value: " # debug_show (data.value);
            };
        };
    };
};
