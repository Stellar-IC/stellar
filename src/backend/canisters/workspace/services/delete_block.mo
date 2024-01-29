import Array "mo:base/Array";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import List "mo:base/List";

import State "../model/state";
import Types "../types/v0";

module {
    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        userPrincipal : Principal,
        input : Types.Services.DeleteBlockService.DeleteBlockServiceInput,
    ) : Types.Services.DeleteBlockService.DeleteBlockServiceOutput {
        if (Principal.isAnonymous(userPrincipal)) {
            return #err(#anonymousUser);
        };
        // TODO: check if user is allowed to delete block
        state.data.deleteBlock(input.id);
        #ok();
    };
};
