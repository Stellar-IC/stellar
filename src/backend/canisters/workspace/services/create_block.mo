import Array "mo:base/Array";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import List "mo:base/List";
import UUID "mo:uuid/UUID";

import BlocksTypes "../../../lib/blocks/types";

import State "../state";
import Types "../types/v0";

module CreateBlock {
    type Input = Types.Services.CreateBlockService.CreateBlockServiceInput;
    type Output = Types.Services.CreateBlockService.CreateBlockServiceOutput;

    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        userPrincipal : Principal,
        input : Input,
    ) : Output {
        if (Principal.isAnonymous(userPrincipal)) {
            return #err(#anonymousUser);
        };

        state.data.addBlock(input);

        return #ok(input);
    };
};
