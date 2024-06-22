#!/bin/bash

mkdir -p ./.dfx/local/canisters/assets

$(dfx cache show)/moc ./src/backend/canisters/assets/main.mo \
  --package base .mops/base@0.11.1/src \
  --package map .mops/map@9.0.1/src \
  -c -o ./.dfx/local/canisters/assets/assets.wasm
  
