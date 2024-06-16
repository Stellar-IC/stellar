#!/usr/local/bin/ic-repl -r local

function deploy(wasm) {
  let id = call ic.provisional_create_canister_with_cycles(record { settings = null; amount = null });
  call ic.install_code(
    record {
      arg = encode wasm.__init_args();
      wasm_module = wasm;
      mode = variant { install };
      canister_id = id.canister_id;
    },
  );
  id
};

function reinstall(wasm, canister_id) {
  call ic.install_code(
    record {
      arg = encode wasm.__init_args();
      wasm_module = wasm;
      mode = variant { reinstall };
      canister_id = canister_id;
    },
  );
};

function resetUserIndex() {
    identity admin;
    reinstall(file("../../../../.dfx/local/canisters/user_index/user_index.wasm"), user_index);
};



identity admin;
deploy(file("../../../../.dfx/local/canisters/user_index/user_index.wasm"));
let user_index = _.canister_id;


////////////////////////
// profile
////////////////////////

// should return the profile
resetUserIndex();
identity stewie;
call user_index.registerUser();
let result = _;
let user = result.ok;
call user.profile();
let result = _;
assert result.ok ~= record { username = ""; };
assert result.ok.created_at != null;
assert result.ok.updatedAt != null;

////////////////////////
// personalWorkspace
////////////////////////

// should fail if caller is not the owner of the canister
resetUserIndex();
identity brian;
call user_index.registerUser();
let result = _;
let user = result.ok;
identity stewie;
call user.personalWorkspace();
let result = _;
assert result == variant { err = variant { unauthorized } };


// should return a workspace
resetUserIndex();
identity stewie;
call user_index.registerUser();
let result = _;
let user = result.ok;
identity stewie;
call user.personalWorkspace();
let workspace = _.ok;
// assert a principal for a workspace is returned
call workspace.details(); // details is a method on the workspace actor


// should return the same workspace on subsequent calls
resetUserIndex();
identity stewie;
call user_index.registerUser();
let result = _;
let user = result.ok;
call user.personalWorkspace();
let workspace = _.ok;
call user.personalWorkspace();
let workspace2 = _.ok;
assert workspace == workspace2;


////////////////////////
// updateProfile
////////////////////////

// should fail if caller is not the owner of the canister
resetUserIndex();
identity brian;
call user_index.registerUser();
let result = _;
let user = result.ok;


// should update the profile
resetUserIndex();
identity stewie;
call user_index.registerUser();
let result = _;
let user = result.ok;
call user.updateProfile(record { username = "stewie" });
let result = _;
assert result.ok ~= record { username = "stewie" };
assert result.ok.updatedAt != null;
call user.profile();
let result = _;
assert result.ok ~= record { username = "stewie" };


// TODO: Test the following:
// - updatePersonalWorkspaceCanisterSettings
// - walletReceive