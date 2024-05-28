import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Error "mo:base/Error";
import Nat64 "mo:base/Nat64";
import Array "mo:base/Array";
import Char "mo:base/Char";
import Map "mo:map/Map";
import StableBuffer "mo:stablebuffer/StableBuffer";
import UUID "mo:uuid/UUID";
import Prng "mo:prng";

import AssetStorage "../../asset_storage";
import CoreTypes "../../types";
import Auth "../../utils/auth";

import Assets "../assets/main";

shared ({ caller = initializer }) actor class FileUpload() = self {
    type Asset = {
        storageCanister : Principal;
        owner : Principal; // identity of the user who uploaded the file
        name : Text;
        created_at : Time.Time;
    };

    stable var _assetCanisters = StableBuffer.fromArray<Principal>([]);
    stable var _assets = Map.new<AssetStorage.Key, Principal>();

    let prng = Prng.SFC64a();
    prng.init(0);

    public shared ({ caller }) func createAssetCanister() : async Result.Result<Principal, { #unauthorized }> {
        if (Auth.isDev(caller) == false and initializer != caller) {
            return #err(#unauthorized);
        };

        ExperimentalCycles.add(100_000_000_000);

        let assets = await (system Assets.Assets)(
            #new {
                settings = ?{
                    controllers = ?[Principal.fromActor(self)];
                    compute_allocation = null;
                    memory_allocation = null;
                    freezing_threshold = ?2_592_000;
                };
            }
        )();

        StableBuffer.add(_assetCanisters, Principal.fromActor(assets));

        return #ok(Principal.fromActor(assets));
    };

    public func http_request(
        request : AssetStorage.HttpRequest
    ) : async AssetStorage.HttpResponse {
        let key = request.url;
        let headers = request.headers;
        Debug.print("Requesting Key: " # debug_show key);
        Debug.print("headers: " # debug_show headers);
        Debug.print("Assets: " # debug_show _assets);

        let assetCanisterId = switch (Map.get(_assets, Map.thash, key)) {
            case (?id) { id };
            case (null) {
                return {
                    body = Blob.toArray(
                        Text.encodeUtf8("<h1>Not Found</h1>")
                    );
                    headers = [("Content-Type", "text/html; charset=UTF-8")];
                    streaming_strategy = null;
                    status_code = 404;
                };
            };
        };

        let assetCanister : actor {
            get : (key : Text) -> async Result.Result<{ key : AssetStorage.Key; content : [Nat8]; content_type : Text }, Text>;
            store : shared (
                input : {
                    key : AssetStorage.Key;
                    content : [Nat8];
                    content_type : Text;
                }
            ) -> async Result.Result<(), Text>;
        } = actor (Principal.toText(assetCanisterId));

        let asset = switch (await assetCanister.get(key)) {
            case (#err(e)) {
                return {
                    body = Blob.toArray(
                        Text.encodeUtf8("<h1>" # e # "</h1>")
                    );
                    headers = [("Content-Type", "text/html; charset=UTF-8")];
                    streaming_strategy = null;
                    status_code = 404;
                };
            };
            case (#ok(asset)) { asset };
        };

        {
            body = asset.content;
            headers = [("Content-Type", asset.content_type)];
            streaming_strategy = null;
            status_code = 200;
        };
    };

    func _buildAssetUrl(assetCanister : Principal, key : AssetStorage.Key) : Text {
        return "https://" # Principal.toText(assetCanister) # ".icp0.io/assets/" # key;
    };

    func _buildKeyPrefix() : Text {
        let CHAR_COUNT = 7;

        var i = 0;
        var prefix = "";

        while (i < CHAR_COUNT) {
            let alphanumeric = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
            let rand = Nat64.toNat(prng.next() % Nat64.fromNat(Array.size(alphanumeric)));
            prefix := prefix # Char.toText(alphanumeric[rand]);
            i += 1;
        };

        return prefix;
    };

    public shared func store(
        input : {
            key : AssetStorage.Key;
            content : [Nat8];
            content_type : Text;
        }
    ) : async Result.Result<{ url : Text }, Text> {
        let {
            key;
            content;
            content_type;
        } = input;
        let assetCanisterId = switch (StableBuffer.getOpt(_assetCanisters, 0)) {
            case (?id) { id };
            case (null) {
                return #err("No asset canister found");
            };
        };

        let assetCanister : actor {
            store : shared (
                input : {
                    key : AssetStorage.Key;
                    content : [Nat8];
                    content_type : Text;
                }
            ) -> async Result.Result<(), Text>;
        } = actor (Principal.toText(assetCanisterId));

        let finalKey = _buildKeyPrefix() # "-" # key;
        let file = {
            key = finalKey;
            content = content;
            content_type = content_type;
        };

        switch (await assetCanister.store(file)) {
            case (#err(e)) { return #err(e) };
            case (#ok) {};
        };

        switch (Map.put(_assets, Map.thash, finalKey, assetCanisterId)) {
            case (?old) {
                return #err("Asset with key: " # finalKey # " already exists");
            };
            case (null) {
                return #ok({ url = _buildAssetUrl(assetCanisterId, finalKey) });
            };
        };
    };

    public shared ({ caller }) func upgradeAssets(wasm_module : Blob) : async Result.Result<(), { #unauthorized }> {
        if ((Auth.isDev(caller)) == false) {
            return #err(#unauthorized);
        };

        let IC0 : CoreTypes.Management = actor "aaaaa-aa";
        let sender_canister_version : ?Nat64 = null;

        for (assetCanisterId in StableBuffer.vals(_assetCanisters)) {
            try {
                await IC0.install_code(
                    {
                        arg = to_candid ();
                        canister_id = assetCanisterId;
                        mode = #upgrade(?{ skip_pre_upgrade = ?false });
                        sender_canister_version = sender_canister_version;
                        wasm_module = wasm_module;
                    }
                );
            } catch (err) {
                Debug.print(
                    "Error upgrading asset canister: " # debug_show (Error.code(err)) #
                    ": " # debug_show (Error.message(err))
                );
            };
        };

        #ok;
    };
};
