#!/bin/bash

dfx canister call user_index upgradeUsers \
  --argument-file <(echo "(blob \"$(hexdump -ve '1/1 "%.2x"' "./.dfx/local/canisters/user/user.wasm" | sed 's/../\\&/g')\")")
