import Array "mo:base/Array";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import List "mo:base/List";
import UUID "mo:uuid/UUID";

import State "../model/state";
import Types "../types";

module {
    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        user_principal : Principal,
        input : Types.CreateBlockServiceInput,
    ) : Types.CreateBlockServiceOutput {
        if (Principal.isAnonymous(user_principal)) {
            return #err(#anonymousUser);
        };

        // Validate the input
        let validation = _validate(input);
        switch (validation) {
            case (#err(err)) {
                return #err(err);
            };
            case (#ok()) {
                // Continue
            };
        };

        let result = state.data.addBlock(input);
        switch (result) {
            case (#ok(pk, obj)) {
                return #ok(obj);
            };
            case (#err(#keyAlreadyExists)) {
                return #err(#failedToCreate);
            };
        };
    };

    private func _validate(
        input : Types.CreateBlockServiceInput
    ) : Result.Result<(), { #anonymousUser; #inputTooLong; #invalidBlockType }> {
        if (Array.size<UUID.UUID>(input.content) > MAX_CONTENT_SIZE) {
            return #err(#inputTooLong);
        };

        let valid_block_types = [
            #heading1,
            #heading2,
            #heading3,
            #page,
            #paragraph,
        ];

        if (Array.find<Types.BlockType>(valid_block_types, func x = x == input.blockType) == null) {
            return #err(#invalidBlockType);
        };

        return #ok();
    };
};
