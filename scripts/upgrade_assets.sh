#!/bin/bash

dfx canister call file_upload upgradeAssets \
  --argument-file <(echo "(blob \"$(hexdump -ve '1/1 "%.2x"' "./.dfx/local/canisters/assets/assets.wasm" | sed 's/../\\&/g')\")")
