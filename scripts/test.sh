#!/bin/bash -e

dfx canister create --all
dfx build

mkdir -p ./.dfx/local/canisters/user
./scripts/build_user_canister_wasm.sh

mkdir -p ./.dfx/local/canisters/workspace
./scripts/build_workspace_canister_wasm.sh

# Add tests here
# ./src/backend/tests/canisters/test_cycles_dispenser.sh
# ./src/backend/tests/canisters/test_user_index.sh
./src/backend/tests/canisters/test_user.sh