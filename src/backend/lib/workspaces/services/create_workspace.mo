import Array "mo:base/Array";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Source "mo:uuid/async/SourceV4";

import Workspace "../../../canisters/workspace/main";
import CoreTypes "../../../types";

import Constants "../../../constants";

module CreateWorkspace {
    type Input = {
        controllers : [Principal];
        description : Text;
        initialUsers : [(
            Principal,
            CoreTypes.Workspaces.WorkspaceUser,
        )];
        name : Text;
        owners : [Principal];
        userIndexCanisterId : Principal;
    };
    type Output = Result.Result<Principal, { #AnonymousOwner; #InsufficientCycles }>;

    public func execute(input : Input) : async Output {
        let WORKSPACE_INITIAL_CYCLES_BALANCE = Constants.WORKSPACE__INITIAL_CYCLES_BALANCE.scalar;

        if (Cycles.balance() < WORKSPACE_INITIAL_CYCLES_BALANCE) {
            return #err(#InsufficientCycles);
        };

        let WORKSPACE_CAPACITY = Constants.WORKSPACE__CAPACITY.scalar;
        let WORKSPACE_FREEZING_THRESHOLD = Constants.WORKSPACE__FREEZING_THRESHOLD.scalar;
        let WORKSPACE_MEMORY_ALLOCATION = Constants.WORKSPACE__MEMORY_ALLOCATION.scalar;

        let owners = Array.mapFilter<Principal, Principal>(
            input.owners,
            func(owner) {
                if (Principal.isAnonymous(owner)) { return null };
                return ?owner;
            },
        );

        let {
            controllers;
            description;
            name;
            userIndexCanisterId;
        } = input;

        let workspaceInitArgs = {
            capacity = WORKSPACE_CAPACITY;
            initialUsers = input.initialUsers;
            userIndexCanisterId;
            owner = owners[0];
            owners;
            uuid = await Source.Source().new();
            name;
            description;
            createdAt = Time.now();
            updatedAt = Time.now();
        };

        if (Cycles.balance() < WORKSPACE_INITIAL_CYCLES_BALANCE) {
            return #err(#InsufficientCycles);
        };

        Cycles.add<system>(WORKSPACE_INITIAL_CYCLES_BALANCE);

        let workspace = await (system Workspace.Workspace)(
            #new {
                settings = ?{
                    controllers = ?controllers;
                    compute_allocation = null;
                    memory_allocation = ?WORKSPACE_MEMORY_ALLOCATION;
                    freezing_threshold = ?WORKSPACE_FREEZING_THRESHOLD;
                };
            }
        )(workspaceInitArgs);

        #ok(Principal.fromActor(workspace));
    };
};
