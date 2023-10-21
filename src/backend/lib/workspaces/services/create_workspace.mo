import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Source "mo:uuid/async/SourceV4";

import Workspace "../../../canisters/workspace/main";

module CreateWorkspace {
    let CYCLES_REQUIRED_FOR_UPGRADE = 80_000_000_000; // 0.08T cycles
    let TOP_UP_AMOUNT = 100_000_000_000; // 0.1T cycles

    public func execute({ owner : Principal }) : async Result.Result<Workspace.Workspace, { #anonymousUser; #insufficientCycles }> {
        let INITIAL_CYCLES_BALANCE = CYCLES_REQUIRED_FOR_UPGRADE + TOP_UP_AMOUNT; // 0.18T cycles

        if (Cycles.balance() < INITIAL_CYCLES_BALANCE) {
            return #err(#insufficientCycles);
        };

        if (Principal.isAnonymous(owner)) {
            return #err(#anonymousUser);
        };

        let workspaceCanisterInitSettings = ?{
            controllers = ?[owner];
            compute_allocation = ?5;
            memory_allocation = ?5_000_000; // minimum amount needed is 2_360_338
            freezing_threshold = ?1_000;
        };
        let workspaceCanisterInitArgs = {
            capacity = 100_000_000_000_000;
            owner = owner;
        };
        let workspaceCanisterInitData = {
            uuid = await Source.Source().new();
            name = "Untitled";
            description = "";
            owner = owner;
            createdAt = Time.now();
            updatedAt = Time.now();
        };
        Cycles.add(INITIAL_CYCLES_BALANCE);
        let workspaceCanister = await (system Workspace.Workspace)(
            #new { settings = workspaceCanisterInitSettings }
        )(workspaceCanisterInitArgs, workspaceCanisterInitData);

        #ok(workspaceCanister);
    };
};
