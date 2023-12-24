#!/usr/local/bin/ic-repl -r local
// assume we already installed the greet canister
import userIndex = "br5f7-7uaaa-aaaaa-qaaca-cai";

////////////////////////
// registerUser
////////////////////////

// should return error if no identity is provided
call userIndex.registerUser();
let result = _;
assert result == variant { err = variant { anonymousUser } };

// should return error if caller is not a registered canister
identity stewie;
call userIndex.registerUser();
let result = _;
assert result == variant { err = variant { unauthorized } };


// TODO: Test the following:
// - upgradeUserCanistersWasm
// - updateUserCanisterSettings
// - upgradeUserPersonalWorkspaceCanistersWasm
// - walletReceive
// - cyclesInformation
// - requestCycles