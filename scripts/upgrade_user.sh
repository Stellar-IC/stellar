#!/bin/bash

dfx canister call user_index upgradeUser \
  --argument-file <(echo "( \
      principal \"$1\", \
      blob \"$(hexdump -ve '1/1 "%.2x"' "./.dfx/local/canisters/user/user.wasm" | sed 's/../\\&/g')\", \
    )")
