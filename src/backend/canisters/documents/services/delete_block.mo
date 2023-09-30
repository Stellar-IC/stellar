import Array "mo:base/Array";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import List "mo:base/List";
import State "../model/state";
import Types "../types";

module {
    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        user_principal : Principal,
        input : Types.DeleteBlockServiceInput,
    ) : Types.DeleteBlockServiceOutput {
        if (Principal.isAnonymous(user_principal)) {
            return #err(#anonymousUser);
        };
        // TODO: check if user is allowed to delete block
        state.data.deleteBlock(input.id);
        #ok();
    };
};
