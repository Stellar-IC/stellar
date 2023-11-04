import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Source "mo:uuid/async/SourceV4";

import Workspace "../../../canisters/workspace/main";
import Constants "../../../constants";

import Types "../types";

module CreateWorkspace {
    type Input = Types.Services.CreateWorkspace.CreateWorkspaceInput;
    type Result = Types.Services.CreateWorkspace.CreateWorkspaceResult;

    public func execute({ owner } : Input) : async Result {
        let initialWorkspaceCycles = Constants.WORKSPACE__INITIAL_CYCLES_BALANCE;

        if (Cycles.balance() < initialWorkspaceCycles) {
            return #err(#insufficientCycles);
        };

        if (Principal.isAnonymous(owner)) {
            return #err(#anonymousUser);
        };

        let workspaceInitArgs = {
            capacity = Constants.WORKSPACE__CAPACITY;
            owner = owner;
        };
        let now = Time.now();
        let workspaceInitData = {
            uuid = await Source.Source().new();
            name = "";
            description = "";
            createdAt = now;
            updatedAt = now;
        };

        Cycles.add(initialWorkspaceCycles);

        let workspace = await (system Workspace.Workspace)(
            #new {
                settings = ?{
                    controllers = ?[owner];
                    compute_allocation = ?Constants.WORKSPACE__COMPUTE_ALLOCATION;
                    memory_allocation = ?Constants.WORKSPACE__MEMORY_ALLOCATION;
                    freezing_threshold = ?Constants.WORKSPACE__FREEZING_THRESHOLD;
                };
            }
        )(workspaceInitArgs, workspaceInitData);

        #ok(workspace);
    };
};
