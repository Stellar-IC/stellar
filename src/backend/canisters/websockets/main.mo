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
import UserClientMap "./UserClientMap";

actor {
    type AppMessage = {
        #ping : { message : Text };
        #blockEvent : BlocksTypes.BlockEvent;
        #associateUser : {
            userId : Principal; // user's identity principal
        };
    };

    /*
     * Map from user identity to the list of clients associated with that user.
     * This is used to send messages to all the clients associated with a user.
     */
    stable let _userClientMap = UserClientMap.new();

    public shared func sendMessage(
        userId : Principal,
        msg : AppMessage,
    ) : async () {
        let clients = UserClientMap.clientsForUser(_userClientMap, userId);
        var clientsToRemove : [Principal] = [];

        for (client in clients.vals()) {
            let result = await sendMessageToClient(client, msg);

            switch (result) {
                case (#err(err)) {
                    clientsToRemove := Array.append(
                        clientsToRemove,
                        [client],
                    );
                };
                case (_) {};
            };
        };

        if (Array.size(clientsToRemove) > 0) {
            Debug.print("Removing clients: " # debug_show (clientsToRemove));
            UserClientMap.removeClients(_userClientMap, userId, clientsToRemove);
        };
    };

    func sendMessageToClient(
        client : IcWebSocketCdk.ClientPrincipal,
        msg : AppMessage,
    ) : async Result.Result<(), Text> {
        let result = await IcWebSocketCdk.send(ws_state, client, to_candid (msg));

        switch (result) {
            case (#Err(err)) {
                return #err(err);
            };
            case (_) {
                return #ok;
            };
        };
    };

    func onOpen(args : IcWebSocketCdk.OnOpenCallbackArgs) : async () {
        let message : AppMessage = #ping({ message = "Ping" });
        ignore await sendMessageToClient(args.client_principal, message);
    };

    /// The custom logic is just a ping-pong message exchange between frontend and canister.
    /// Note that the message from the WebSocket is serialized in CBOR, so we have to deserialize it first
    func onMessage(args : IcWebSocketCdk.OnMessageCallbackArgs) : async () {
        let app_msg : ?AppMessage = from_candid (args.message);
        let msg : AppMessage = switch (app_msg) {
            case (?msg) { msg };
            case (null) {
                Debug.print("Could not deserialize message");
                return;
            };
        };

        switch (msg) {
            case (#blockEvent(event)) {
                // ignore
            };
            case (#ping(msg)) {
                // ignore
            };
            case (#associateUser(data)) {
                UserClientMap.addClient(_userClientMap, data.userId, args.client_principal);
            };
        };
    };

    func onClose(args : IcWebSocketCdk.OnCloseCallbackArgs) : async () {
        Debug.print("Client " # debug_show (args.client_principal) # " disconnected");
    };

    let params = IcWebSocketCdkTypes.WsInitParams(null, null);
    let ws_state = IcWebSocketCdkState.IcWebSocketState(params);
    let handlers = IcWebSocketCdkTypes.WsHandlers(
        ?onOpen,
        ?onMessage,
        ?onClose,
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
