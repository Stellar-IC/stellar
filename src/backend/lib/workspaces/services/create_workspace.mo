import Array "mo:base/Array";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Source "mo:uuid/async/SourceV4";

import Workspace "../../../canisters/workspace/main";
import Types "../../../canisters/workspace/types/v2";

import Constants "../../../constants";

module CreateWorkspace {
    type Input = {
        owner : Principal;
        controllers : [Principal];
        initialUsers : [(
            Principal,
            Types.WorkspaceUser,
        )];
    };
    type Output = Result.Result<Workspace.Workspace, { #anonymousUser; #insufficientCycles }>;

    public func execute({ controllers; owner; initialUsers } : Input) : async Output {
        let CONSTANTS = Constants.Constants();
        let WORKSPACE_CAPACITY = CONSTANTS.WORKSPACE__CAPACITY.scalar;
        let WORKSPACE_FREEZING_THRESHOLD = CONSTANTS.WORKSPACE__FREEZING_THRESHOLD.scalar;
        let WORKSPACE_INITIAL_CYCLES_BALANCE = CONSTANTS.WORKSPACE__INITIAL_CYCLES_BALANCE.scalar;
        let WORKSPACE_MEMORY_ALLOCATION = CONSTANTS.WORKSPACE__MEMORY_ALLOCATION.scalar;

        if (Cycles.balance() < WORKSPACE_INITIAL_CYCLES_BALANCE) {
            return #err(#insufficientCycles);
        };

        if (Principal.isAnonymous(owner)) {
            return #err(#anonymousUser);
        };

        let workspaceInitArgs = {
            capacity = WORKSPACE_CAPACITY;
            owner;
        };
        let workspaceInitData = {
            uuid = await Source.Source().new();
            name = "";
            description = "";
            createdAt = Time.now();
            updatedAt = Time.now();
        };

        Cycles.add(WORKSPACE_INITIAL_CYCLES_BALANCE);

        let workspace = await (system Workspace.Workspace)(
            #new {
                settings = ?{
                    controllers = ?controllers;
                    compute_allocation = null;
                    memory_allocation = ?WORKSPACE_MEMORY_ALLOCATION;
                    freezing_threshold = ?WORKSPACE_FREEZING_THRESHOLD;
                };
            }
        )(workspaceInitArgs, workspaceInitData);

        if (Array.size(initialUsers) > 0) {
            let result = await workspace.addUsers(initialUsers);
        };

        #ok(workspace);
    };
};
