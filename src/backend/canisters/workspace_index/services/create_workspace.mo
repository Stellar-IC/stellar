import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Source "mo:uuid/async/SourceV4";

import Workspace "../../workspace/main";

import State "../model/state";

module {
    let CYCLES_REQUIRED_FOR_UPGRADE = 80_000_000_000; // 0.08T cycles
    let TOP_UP_AMOUNT = 100_000_000_000; // 0.1T cycles

    public func createWorkspace(
        state : State.State,
        ownerPrincipal : Principal,
        workspaceIndexPrincipal : Principal,
    ) : async Result.Result<Principal, { #anonymousUser; #anonymousWorkspaceIndex; #insufficientCycles }> {
        let INITIAL_CYCLES_BALANCE = CYCLES_REQUIRED_FOR_UPGRADE + TOP_UP_AMOUNT; // 0.18T cycles

        if (Cycles.balance() < INITIAL_CYCLES_BALANCE) {
            return #err(#insufficientCycles);
        };

        if (Principal.isAnonymous(ownerPrincipal)) {
            return #err(#anonymousUser);
        };

        if (Principal.isAnonymous(workspaceIndexPrincipal)) {
            return #err(#anonymousWorkspaceIndex);
        };

        Cycles.add(INITIAL_CYCLES_BALANCE);

        let workspaceCanisterInitSettings = ?{
            controllers = ?[ownerPrincipal, workspaceIndexPrincipal];
            compute_allocation = ?5;
            memory_allocation = ?5_000_000; // minimum amount needed is 2_360_338
            freezing_threshold = ?1_000;
        };
        let workspaceCanisterInitArgs = {
            capacity = 100_000_000_000_000;
            ownerPrincipal = ownerPrincipal;
            workspaceIndexPrincipal = workspaceIndexPrincipal;
        };
        let workspaceCanister = await (system Workspace.Workspace)(
            #new { settings = workspaceCanisterInitSettings }
        )(workspaceCanisterInitArgs);
        let workspaceCanisterPrincipal = Principal.fromActor(workspaceCanister);

        let result = state.data.addWorkspace(
            workspaceCanisterPrincipal,
            {
                uuid = await Source.Source().new();
                name = "Untitled";
                description = "";
                owner = ownerPrincipal;
                createdAt = Time.now();
                updatedAt = Time.now();
            },
        );

        #ok(workspaceCanisterPrincipal);
    };
};
