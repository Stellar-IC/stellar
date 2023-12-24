#!/usr/local/bin/ic-repl -r local
// assume we already installed the greet canister
import cycles_dispenser = "bkyz2-fmaaa-aaaaa-qaaaq-cai";

////////////////////////
// requestCycles
////////////////////////

// should return error if no identity is provided
call cycles_dispenser.requestCycles();
let result = _;
assert result == variant { err = variant { unauthorized } };

// should return error if caller is not a registered canister
identity stewie;
call cycles_dispenser.requestCycles();
let result = _;
assert result == variant { err = variant { unauthorized } };
