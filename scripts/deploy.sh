#!/bin/bash

dfx canister create --all

dfx build

dfx canister install internet_identity --mode=upgrade

dfx canister install workspace_index --mode=upgrade

gzip .dfx/local/canisters/user_index/user_index.wasm --force

dfx canister install user_index --mode=upgrade --wasm .dfx/local/canisters/user_index/user_index.wasm.gz

dfx install cycles_dispenser

dfx canister install frontend --mode=upgrade

dfx generate