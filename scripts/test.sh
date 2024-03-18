#!/bin/bash -e

dfx canister create --all
dfx build

mkdir -p ./.dfx/local/canisters/user
./scripts/build_user_canister_wasm.sh

mkdir -p ./.dfx/local/canisters/workspace
./scripts/build_workspace_canister_wasm.sh

# Add tests here

# Canister tests
./src/backend/tests/canisters/test_cycles_dispenser.sh
./src/backend/tests/canisters/test_user_index.sh
./src/backend/tests/canisters/test_user.sh

# Unit tests
$(dfx cache show)/moc -r `vessel sources` src/backend/lib/events/__tests__/test_event_stream.mo
$(dfx cache show)/moc -r `vessel sources` src/backend/canisters/workspace/model/__tests__/test_state.mo
$(dfx cache show)/moc -r `vessel sources` src/backend/canisters/workspace/services/__tests__/test_create_activity.mo
$(dfx cache show)/moc -r `vessel sources` src/backend/canisters/workspace/services/__tests__/test_create_block.mo
$(dfx cache show)/moc -r `vessel sources` src/backend/canisters/workspace/services/__tests__/test_create_page.mo
$(dfx cache show)/moc -r `vessel sources` src/backend/canisters/workspace/services/__tests__/test_extend_activity.mo
