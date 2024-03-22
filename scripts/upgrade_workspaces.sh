#!/bin/bash

dfx canister call user_index upgradePersonalWorkspaces \
  --argument-file <(echo "(blob \"$(hexdump -ve '1/1 "%.2x"' "./.dfx/local/canisters/workspace/workspace.wasm" | sed 's/../\\&/g')\")")
