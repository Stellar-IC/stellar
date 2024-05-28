import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Map "mo:map/Map";

import AssetStorage "../../asset_storage";

actor class Assets() {
    type Asset = {
        content : [Nat8];
        content_type : Text;
    };

    type AssetDetails = {
        key : AssetStorage.Key;
        content : [Nat8];
        content_type : Text;
    };

    stable var _assets = Map.new<AssetStorage.Key, Asset>();

    public query func http_request(
        request : AssetStorage.HttpRequest
    ) : async AssetStorage.HttpResponse {
        let url = request.url;
        let headers = request.headers;

        // If running on local network, remove the leading /assets/ from the path
        // and use the remaining path, excluding any query parameters, as the key
        let parts = Iter.toArray(Text.split(url, #char '?'));
        let urlWithoutQuery = parts[0];
        let key = Text.trimStart(urlWithoutQuery, #text("/assets/"));

        let asset = switch (_getAsset(key)) {
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

        return {
            body = asset.content;
            headers = [("Content-Type", asset.content_type)];
            streaming_strategy = null;
            status_code = 200;
        };
    };

    func _getAsset(key : Text) : Result.Result<AssetDetails, Text> {
        switch (Map.get(_assets, Map.thash, key)) {
            case (?asset) {
                return #ok({
                    key = key;
                    content = asset.content;
                    content_type = asset.content_type;
                });
            };
            case (null) {
                return #err("Asset with key " # key # " not found");
            };
        };
    };

    public query func get(key : Text) : async Result.Result<AssetDetails, Text> {
        return _getAsset(key);
    };

    public func store(
        input : {
            key : AssetStorage.Key;
            content : [Nat8];
            content_type : Text;
        }
    ) : async Result.Result<(), Text> {
        let {
            key;
            content;
            content_type;
        } = input;

        switch (
            Map.put(
                _assets,
                Map.thash,
                key,
                {
                    content = content;
                    content_type = content_type;
                },
            )
        ) {
            case (?existing) {
                return #err("Asset with key " # key # "already exists");
            };
            case (null) {
                return #ok();
            };
        };
    };
};
