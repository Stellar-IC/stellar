#!/bin/bash

dfx canister call workspace_index upgradeWorkspace \
  --argument-file <(echo "( \
      principal \"$1\", \
      blob \"$(hexdump -ve '1/1 "%.2x"' "./.dfx/local/canisters/workspace/workspace.wasm" | sed 's/../\\&/g')\", \
    )")
