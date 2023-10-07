import Array "mo:base/Array";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Result "mo:base/Result";
import RBTree "mo:base/RBTree";
import Time "mo:base/Time";
import { setTimer } = "mo:base/Timer";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";

import CoreTypes "../../types";

import BlockCreatedConsumer "./consumers/BlockCreatedConsumer";
import BlockUpdatedConsumer "./consumers/BlockUpdatedConsumer";
import BlockRemovedConsumer "./consumers/BlockRemovedConsumer";
import State "./model/state";
import CreatePage "./services/create_page";
import UpdateBlock "./services/update_block";
import Types "./types";
import Tree "../../utils/data/lseq/Tree";
import Block "./model/models/block";

actor Documents {
    stable var stable_blocks : RBTree.Tree<Types.PrimaryKey, Types.ShareableBlock> = #leaf;
    stable var stable_blocks_id_counter = 0;

    var state = State.State(State.Data({ blocks = { id = stable_blocks_id_counter; data = stable_blocks } }));

    type AddBlockInput = Types.UnsavedBlock;

    public query func blockByUuid(uuid : UUID.UUID) : async Result.Result<Types.ShareableBlock, { #blockNotFound }> {
        switch (state.data.getBlockByUuid(uuid)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(block)) {
                #ok(Block.toShareable(block));
            };
        };
    };

    public query func page(id : Types.PrimaryKey) : async Result.Result<Types.ShareablePage, { #pageNotFound }> {
        switch (state.data.getPage(id)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(block)) {
                #ok(Block.toShareable(block));
            };
        };
    };

    public query func pageByUuid(uuid : UUID.UUID) : async Result.Result<Types.ShareablePage, { #pageNotFound }> {
        switch (state.data.getPageByUuid(uuid)) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(block)) {
                #ok(Block.toShareable(block));
            };
        };
    };

    public query func pages(
        options : {
            cursor : ?Types.PrimaryKey;
            limit : ?Nat;
            order : ?CoreTypes.SortOrder;
        }
    ) : async CoreTypes.PaginatedResults<Types.ShareablePage> {
        let { cursor; limit; order } = options;
        let pages = state.data.getPages(cursor, limit, order);
        let result = {
            edges = List.toArray<CoreTypes.Edge<Types.ShareableBlock>>(
                List.map<Types.Block, CoreTypes.Edge<Types.ShareableBlock>>(
                    pages,
                    func(page) {
                        { node = Block.toShareable(page) };
                    },
                )
            );
        };

        return result;
    };

    public shared ({ caller }) func createPage(input : Types.CreatePageUpdateInput) : async Types.CreatePageUpdateOutput {
        await CreatePage.execute(state, caller, input);
    };

    type EventListener = (event : Types.BlockEvent) -> ();

    type Subscriber = {
        name : Text;
        listener : EventListener;
    };

    class EventStream() {
        var subscribers = List.fromArray<Subscriber>([]);

        public func addEventListener(name : Text, listener : EventListener) {
            subscribers := List.append<Subscriber>(
                subscribers,
                List.fromArray<Subscriber>([{ name; listener }]),
            );
        };

        public func removeEventListener(name : Text) {
            subscribers := List.filter<Subscriber>(
                subscribers,
                func(subscriber) {
                    subscriber.name != name;
                },
            );
        };

        public func publish(event : Types.BlockEvent) {
            for (subscriber in List.toIter(subscribers)) {
                subscriber.listener(event);
            };
        };
    };

    let eventStream = EventStream();

    public shared ({ caller }) func saveEvent(input : Types.SaveEventUpdateInput) : async Types.SaveEventUpdateOutput {
        Debug.print("saveEvent");
        switch (input) {
            case (#blockCreated(input)) {
                let title = switch (input.payload.block.properties.title) {
                    case (null) {
                        Tree.Tree(null);
                    };
                    case (?title) {
                        Tree.fromShareableTree(title);
                    };
                };

                let block = Block.fromShareableUnsaved(input.payload.block);

                let event : { #blockCreated : Types.BlockCreatedEvent } = #blockCreated({
                    uuid = await Source.Source().new();
                    eventType = input.eventType;
                    data = {
                        block = { block and {} with content = block.content };
                        index = input.payload.index;
                    };
                    user = caller;
                });
                eventStream.publish(event);
                return #ok();
            };
            case (#blockUpdated(input)) {
                let event : { #blockUpdated : Types.BlockUpdatedEvent } = #blockUpdated({
                    uuid = await Source.Source().new();
                    eventType = input.eventType;
                    data = input.payload;
                    user = caller;
                });
                eventStream.publish(event);
                return #ok();
            };
            case (#blockRemoved(input)) {
                let event : { #blockRemoved : Types.BlockRemovedEvent } = #blockRemoved({
                    uuid = await Source.Source().new();
                    eventType = input.eventType;
                    data = input.payload;
                    user = caller;
                });
                eventStream.publish(event);
                return #ok();
            };
            case (#blockTypeChanged(input)) {
                // pass
            };
        };

        Debug.trap("Unknown event type");
    };

    public shared ({ caller }) func addBlock(input : Types.AddBlockUpdateInput) : async Types.AddBlockUpdateOutput {
        var block_id = state.data.addBlock(Block.fromShareableUnsaved(input));

        switch (block_id) {
            case (#err(#keyAlreadyExists)) {
                #err;
            };
            case (#ok(id, block)) {
                #ok(block);
            };
        };
    };

    public shared ({ caller }) func updateBlock(input : Types.UpdateBlockUpdateInput) : async Types.UpdateBlockUpdateOutput {
        let result = state.data.updateBlock(Block.fromShareable(input));

        switch (result) {
            case (#err(err)) {
                #err(err);
            };
            case (#ok(pk, block)) {
                #ok(Block.toShareable(block));
            };
        };
    };

    func logEvent(event : Types.BlockEvent) : () {
        Debug.print("");
        Debug.print("Logging event");
        switch (event) {
            case (#empty) {};
            case (#blockCreated(event)) {
                Debug.print("TYPE: Block Created");
                Debug.print("UUID: " # UUID.toText(event.uuid));
            };
            case (#blockUpdated(event)) {
                Debug.print("TYPE: Block Updated");
                Debug.print("UUID: " # UUID.toText(event.uuid));
            };
            case (#blockRemoved(event)) {
                Debug.print("TYPE: Block Removed");
                Debug.print("UUID: " # UUID.toText(event.uuid));
            };
        };
    };

    func processEvents() : async () {
        eventStream.addEventListener(
            "test",
            func(event) {
                Debug.print("Received event: ");
                logEvent(event);

                switch (event) {
                    case (#empty) {};
                    case (#blockCreated(event)) {
                        Debug.print("Processing `blockCreated` event");
                        BlockCreatedConsumer.execute(event, state);
                        Debug.print("Successfully processed `blockCreated` event: " # UUID.toText(event.uuid));
                    };
                    case (#blockUpdated(event)) {
                        Debug.print("Processing `blockUpdated` event");
                        let res = BlockUpdatedConsumer.execute(event, state);
                        switch (res) {
                            case (#err(err)) {
                                Debug.print("Failed to process `blockUpdated` event: " # UUID.toText(event.uuid));
                            };
                            case (#ok(_)) {
                                Debug.print("Successfully processed `blockUpdated` event: " # UUID.toText(event.uuid));
                            };
                        };
                    };
                    case (#blockRemoved(event)) {
                        Debug.print("Processing `blockRemoved` event");
                        let res = BlockRemovedConsumer.execute(event, state);
                        switch (res) {
                            case (#err(err)) {
                                Debug.print("Failed to process `blockUpdated` event: " # UUID.toText(event.uuid));
                            };
                            case (#ok(_)) {
                                Debug.print("Successfully processed `blockUpdated` event: " # UUID.toText(event.uuid));
                            };
                        };
                        Debug.print("Successfully processed `blockRemoved` event: " # UUID.toText(event.uuid));
                    };
                };
            },
        );
    };

    let timer = setTimer(
        #nanoseconds(0),
        processEvents,
    );

    system func preupgrade() {
        let transformedData = RBTree.RBTree<Nat, Types.ShareableBlock>(Nat.compare);
        for (block in state.data.Block.objects.data.entries()) {
            transformedData.put(block.0, Block.toShareable(block.1));
        };

        stable_blocks := transformedData.share();
        stable_blocks_id_counter := state.data.Block.id_manager.current();
    };

    system func postupgrade() {
        // let refreshData = RBTree.RBTree<Nat, Types.ShareableBlock>(Nat.compare);
        // refreshData.unshare(stable_blocks);

        // for (entry in refreshData.entries()) {
        //     state.data.Block.objects.data.put(entry.0, Block.fromShareable(entry.1));
        // };

        stable_blocks := #leaf;
        stable_blocks_id_counter := 0;

       
    };
};
