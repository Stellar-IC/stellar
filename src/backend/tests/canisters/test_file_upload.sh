#!/usr/local/bin/ic-repl -r local

function deploy(wasm) {
  let id = call ic.provisional_create_canister_with_cycles(record { settings = null; amount = null });
  call ic.install_code(
    record {
      arg = encode wasm.__init_args();
      wasm_module = wasm;
      mode = variant { install };
      canister_id = id.canister_id;
    },
  );
  id
};

function reinstall(wasm, canister_id) {
  call ic.install_code(
    record {
      arg = encode wasm.__init_args();
      wasm_module = wasm;
      mode = variant { reinstall };
      canister_id = canister_id;
    },
  );
};

function reset() {
    identity admin;
    reinstall(file("../../../../.dfx/local/canisters/file_upload/file_upload.wasm"), file_upload);
};

identity admin;
deploy(file("../../../../.dfx/local/canisters/file_upload/file_upload.wasm"));
let file_upload = _.canister_id;


////////////////////////
// store
////////////////////////

// should be able to upload and retrieve a file
reset();
call file_upload.createAssetCanister();
let asset_canister = _.ok;
call file_upload.store(
    record {
        key = "test_file";
        content = blob "test";
        content_type = "text/plain";
    }
);
let result = _;
let expected = stringify("https://", asset_canister, ".icp0.io/assets/tg1q699-test_file");

assert result == variant { ok = record { url = expected } };

call file_upload.http_request(
    record {
        body = vec {};
        method = "GET";
        url = "tg1q699-test_file";
        headers = vec {};
    }
);
let result = _;
assert result.body == blob "test";
assert result.headers == vec { record { "Content-Type"; "text/plain" } };
assert result.status_code == (200 : nat16);

// should also be able to retrieve the file directly from the asset canister
call asset_canister.http_request(
    record {
        body = vec {};
        method = "GET";
        url = "tg1q699-test_file";
        headers = vec {};
    }
);
let result = _;
assert result.body == blob "test";
assert result.headers == vec { record { "Content-Type"; "text/plain" } };
assert result.status_code == (200 : nat16);