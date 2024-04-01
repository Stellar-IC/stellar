import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Bool "mo:base/Bool";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Map "mo:map/Map";

import IcWebSocketCdk "mo:ic-websocket-cdk";
import IcWebSocketCdkState "mo:ic-websocket-cdk/State";
import IcWebSocketCdkTypes "mo:ic-websocket-cdk/Types";

import BlocksTypes "../../lib/blocks/types";

actor {
    type AppMessage = {
        #ping : { message : Text };
        #blockEvent : BlocksTypes.BlockEvent;
        #associateUser : {
            userId : Principal;
        };
    };

    stable let userClientMap = Map.new<Principal, [Principal]>();

    let principalHasUtils = (Principal.hash, Principal.equal);

    public shared func send_message(userId : Principal, msg : AppMessage) : async () {
        Debug.print("Sending message to user: " # Principal.toText(userId) # " with message: " # debug_show (msg));

        let clients = switch (Map.get(userClientMap, principalHasUtils, userId)) {
            case (?clients) { clients };
            case (null) {
                Debug.print("Could not find clients for user: " # debug_show (userId));
                return;
            };
        };

        var closedClients : [Principal] = [];

        Debug.print("clients: " # debug_show (clients));

        // add any failed clients to the closed clients list to remove them from the map
        for (client in clients.vals()) {
            switch (await send_app_message(client, msg)) {
                case (#err(err)) {
                    closedClients := Array.append([client], closedClients);
                };
                case (_) {};
            };
        };

        let updatedClients = Array.filter<Principal>(
            clients,
            func(c) {
                if (Array.indexOf<Principal>(c, closedClients, Principal.equal) != null) {
                    return false;
                };

                return true;
            },
        );

        ignore Map.put(userClientMap, principalHasUtils, userId, updatedClients);
    };

    /// A custom function to send the message to the client
    func send_app_message(client_principal : IcWebSocketCdk.ClientPrincipal, msg : AppMessage) : async Result.Result<(), Text> {
        Debug.print("Sending message to " # Principal.toText(client_principal) # ": " # debug_show (msg));

        // here we call the send from the CDK!!
        switch (await IcWebSocketCdk.send(ws_state, client_principal, to_candid (msg))) {
            case (#Err(err)) {
                Debug.print("Could not send message:" # debug_show (#Err(err)));
                return #err(err);
            };
            case (_) {
                Debug.print("Message sent:" # debug_show (msg));
                return #ok;
            };
        };
    };

    func on_open(args : IcWebSocketCdk.OnOpenCallbackArgs) : async () {
        let message : AppMessage = #ping({
            message = "Ping";
        });
        ignore await send_app_message(args.client_principal, message);
    };

    /// The custom logic is just a ping-pong message exchange between frontend and canister.
    /// Note that the message from the WebSocket is serialized in CBOR, so we have to deserialize it first

    func on_message(args : IcWebSocketCdk.OnMessageCallbackArgs) : async () {
        let app_msg : ?AppMessage = from_candid (args.message);
        let msg : AppMessage = switch (app_msg) {
            case (?msg) { msg };
            case (null) {
                Debug.print("Could not deserialize message");
                return;
            };
        };

        Debug.print("Received message: " # debug_show (msg));

        switch (msg) {
            case (#blockEvent(event)) {
                // ignore
            };
            case (#ping(msg)) {
                // ignore
            };
            case (#associateUser(data)) {
                Debug.print("Received message: associateUser with userId: " # debug_show (data.userId));
                let currentClients = switch (Map.get<Principal, [Principal]>(userClientMap, (Principal.hash, Principal.equal), data.userId)) {
                    case (?clients) { clients };
                    case (null) { [] };
                };

                if (Array.indexOf<Principal>(args.client_principal, currentClients, Principal.equal) != null) {
                    // already associated
                    return;
                };

                ignore Map.put<Principal, [Principal]>(userClientMap, (Principal.hash, Principal.equal), data.userId, Array.append([args.client_principal], currentClients));
            };
        };
    };

    func on_close(args : IcWebSocketCdk.OnCloseCallbackArgs) : async () {
        Debug.print("Client " # debug_show (args.client_principal) # " disconnected");
    };

    let params = IcWebSocketCdkTypes.WsInitParams(null, null);
    let ws_state = IcWebSocketCdkState.IcWebSocketState(params);
    let handlers = IcWebSocketCdkTypes.WsHandlers(
        ?on_open,
        ?on_message,
        ?on_close,
    );
    let ws = IcWebSocketCdk.IcWebSocket(ws_state, params, handlers);

    // method called by the WS Gateway after receiving FirstMessage from the client
    public shared ({ caller }) func ws_open(args : IcWebSocketCdk.CanisterWsOpenArguments) : async IcWebSocketCdk.CanisterWsOpenResult {
        Debug.print("Opening connection for client: " # debug_show (caller));
        await ws.ws_open(caller, args);
    };

    // method called by the Ws Gateway when closing the IcWebSocket connection
    public shared ({ caller }) func ws_close(args : IcWebSocketCdk.CanisterWsCloseArguments) : async IcWebSocketCdk.CanisterWsCloseResult {
        Debug.print("Closing connection for client: " # debug_show (caller));
        await ws.ws_close(caller, args);
    };

    // method called by the frontend SDK to send a message to the canister
    public shared ({ caller }) func ws_message(args : IcWebSocketCdk.CanisterWsMessageArguments, msg : ?AppMessage) : async IcWebSocketCdk.CanisterWsMessageResult {
        Debug.print("Message received from  " # debug_show (caller) # ": " # debug_show (msg));
        await ws.ws_message(caller, args, msg);
    };

    // method called by the WS Gateway to get messages for all the clients it serves
    public shared query ({ caller }) func ws_get_messages(args : IcWebSocketCdk.CanisterWsGetMessagesArguments) : async IcWebSocketCdk.CanisterWsGetMessagesResult {
        ws.ws_get_messages(caller, args);
    };
};
