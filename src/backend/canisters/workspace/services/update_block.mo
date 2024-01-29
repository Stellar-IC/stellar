import Array "mo:base/Array";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import List "mo:base/List";
import UUID "mo:uuid/UUID";

import BlocksTypes "../../../lib/blocks/types";

import State "../model/state";
import Types "../types/v0";

module {
    type Input = Types.Services.UpdateBlockService.UpdateBlockServiceInput;
    type Output = Types.Services.UpdateBlockService.UpdateBlockServiceOutput;

    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        userPrincipal : Principal,
        input : Input,
    ) : Output {
        if (Principal.isAnonymous(userPrincipal)) {
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

        let result = state.data.updateBlock(input);
        switch (result) {
            case (#ok(pk, obj)) {
                return #ok(obj);
            };
            case (#err(#primaryKeyAttrNotFound)) {
                return #err(#failedToUpdate);
            };
        };
    };

    private func _validate(
        input : Input
    ) : Result.Result<(), { #anonymousUser; #invalidBlockType }> {
        let valid_block_types = [
            #heading1,
            #heading2,
            #heading3,
            #page,
            #paragraph,
        ];

        if (Array.find<BlocksTypes.BlockType>(valid_block_types, func x = x == input.blockType) == null) {
            return #err(#invalidBlockType);
        };

        return #ok();
    };
};
