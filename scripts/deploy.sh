#!/bin/bash

dfx canister create --all

dfx build

dfx canister install internet_identity --mode=auto

dfx canister install workspace_index --mode=auto

gzip .dfx/local/canisters/user_index/user_index.wasm --force

dfx canister install user_index --mode=install --wasm .dfx/local/canisters/user_index/user_index.wasm.gz

dfx canister install cycles_dispenser --mode=auto

dfx canister install frontend --mode=auto

