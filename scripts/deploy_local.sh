#!/bin/bash

dfx deploy --with-cycles=2000000000000

USER_INDEX_CANISTER_ID=$(dfx canister id user_index)
WORKSPACE_INDEX_CANISTER_ID=$(dfx canister id workspace_index)

dfx canister call cycles_dispenser register "principal \"$USER_INDEX_CANISTER_ID\""
dfx canister call cycles_dispenser register "principal \"$WORKSPACE_INDEX_CANISTER_ID\""
