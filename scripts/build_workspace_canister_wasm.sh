#!/bin/bash

$(dfx cache show)/moc ./src/backend/canisters/workspace/main.mo \
  --package uuid .vessel/uuid/v0.2.1/src \
  --package encoding .vessel/encoding/v0.4.1/src \
  --package base .vessel/base/1bee37dbe5dbab1017b18ba0490b78f148196c8b/src \
  --package base-0.7.3 .vessel/base-0.7.3/aafcdee0c8328087aeed506e64aa2ff4ed329b47/src \
  --package array .vessel/array/v0.2.1/src \
  -c -o ./.dfx/local/canisters/workspace/workspace.wasm
  
