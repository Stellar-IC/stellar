import WorkspaceIndex "canister:workspace_index";

import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";

import User "../user/main";

import State "./model/state";
import CreateUser "./services/create_user";
import Types "./types";

actor UserIndex {
    type UserId = Principal;

    stable var stable_username_to_user_id : RBTree.Tree<Text, UserId> = #leaf;
    stable var stable_principal_to_user_id : RBTree.Tree<Principal, UserId> = #leaf;
    stable var stable_user_id_to_principal : RBTree.Tree<UserId, Principal> = #leaf;
    stable var stable_user_id_to_user_canister : RBTree.Tree<UserId, User.User> = #leaf;
    var stable_data = {
        username_to_user_id = stable_username_to_user_id;
        principal_to_user_id = stable_principal_to_user_id;
        user_id_to_principal = stable_user_id_to_principal;
        user_id_to_user_canister = stable_user_id_to_user_canister;
    };

    var state = State.State(State.Data(stable_data));

    public shared ({ caller }) func registerUser() : async Types.RegisterUserResult {
        if (Principal.isAnonymous(caller)) {
            return #err(#anonymousUser);
        };

        let user_index_principal = Principal.fromActor(UserIndex);
        let result = await CreateUser.createUser(state, caller, user_index_principal);

        switch (result) {
            case (#err(#anonymousUser)) {
                return #err(#anonymousUser);
            };
            case (#err(#insufficientCycles)) {
                return #err(#insufficientCycles);
            };
            case (#err(#missingUserCanister)) {
                return #err(#missingUserCanister);
            };
            case (#ok(#existing(principal, user))) {
                return #ok(principal);
            };
            case (#ok(#created(principal, user))) {
                let workspaceResult = await createPrivateWorkspaceForUser(principal);

                switch (workspaceResult) {
                    case (#err(#anonymousCaller)) {
                        return #err(#failedToCreateWorkspace);
                    };
                    case (#err(#anonymousOwner)) {
                        return #err(#failedToCreateWorkspace);
                    };
                    case (#err(#anonymousWorkspaceIndex)) {
                        return #err(#failedToCreateWorkspace);
                    };
                    case (#err(#unauthorizedCaller)) {
                        return #err(#failedToCreateWorkspace);
                    };
                    case (#err(#insufficientCycles)) {
                        return #err(#failedToCreateWorkspace);
                    };
                    case (#ok(workspacePrincipal)) {
                        user.setPersonalWorkspace(workspacePrincipal);
                        return #ok(principal);
                    };
                };

                return #ok(principal);
            };
        };
    };

    public shared func upgradeUserCanisters() {
        for (entry in state.data.user_id_to_user_canister.entries()) {
            var userId = entry.0;
            var user = await (system User.User)(
                #upgrade(entry.1)
            )({
                capacity = 100_000_000_000_000;
                principal = userId;
            });
        };
    };

    public shared func walletBalance() : async Nat {
        let balance = Cycles.balance();
        return balance;
    };

    private func createPrivateWorkspaceForUser(userId : UserId) : async Result.Result<Principal, { #anonymousCaller; #anonymousOwner; #anonymousWorkspaceIndex; #unauthorizedCaller; #insufficientCycles }> {
        return await WorkspaceIndex.createWorkspace({
            owner = userId;
        });
    };

    system func preupgrade() {
        stable_username_to_user_id := state.data.username_to_user_id.share();
        stable_principal_to_user_id := state.data.principal_to_user_id.share();
        stable_user_id_to_principal := state.data.user_id_to_principal.share();
        stable_user_id_to_user_canister := state.data.user_id_to_user_canister.share();
    };

    system func postupgrade() {
        stable_username_to_user_id := #leaf;
        stable_principal_to_user_id := #leaf;
        stable_user_id_to_principal := #leaf;
        stable_user_id_to_user_canister := #leaf;
    };
};
