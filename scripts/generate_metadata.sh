#!/bin/bash

if [ ! -f ../.env ]
then
  echo "Loading variables from .env file"
  export $(cat .env | xargs)
fi

$(dfx cache show)/moc ./src/backend/canisters/$1/main.mo \
  -o ./.dfx/local/canisters/$1/$1.wasm \
  -c \
  --debug \
  --idl \
  --stable-types \
  --public-metadata candid:service \
  --public-metadata candid:args \
  --actor-alias cycles_dispenser $CANISTER_ID_CYCLES_DISPENSER \
  --actor-alias file_upload $CANISTER_ID_FILE_UPLOAD \
  --actor-idl ./.dfx/local/lsp \
  --package base .mops/base@0.11.1/src \
  --package matchers .mops/_github/matchers#v1.3.0/src \
  --package encoding .mops/_github/encoding#v0.4.1/src \
  --package base-0.7.3 .mops/_github/base-0.7.3#aafcdee0c8328087aeed506e64aa2ff4ed329b47/src \
  --package array .mops/_github/array#v0.2.1/src \
  --package io .mops/_github/io#v0.3.2/src \
  --package uuid .mops/_github/uuid#v0.2.0/src \
  --package canistergeek .mops/_github/canistergeek#v0.0.7/src \
  --package stablebuffer .mops/_github/stablebuffer#v1.3.0/src \
  --package map .mops/map@9.0.1/src \