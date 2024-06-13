import Bool "mo:base/Bool";
import Debug "mo:base/Debug";
import Int "mo:base/Int";
import List "mo:base/List";
import Text "mo:base/Text";

import Matchers "mo:matchers/Matchers";
import HMMatchers "mo:matchers/matchers/Hashmap";
import T "mo:matchers/Testable";
import Suite "mo:matchers/Suite";

import UUID "mo:uuid/UUID";

import ActivityBuilder "../../../lib/activities/activity_builder";
import ActivitiesTypes "../../../lib/activities/types";
import BlockBuilder "../../../lib/blocks/block_builder";
import BlocksTypes "../../../lib/blocks/types";
import Tree "../../../utils/data/lseq/Tree";
import UUIDUtils "../../../utils/uuid";

import State "../state";

type MockEvent = {
    id : Text;
};

let activityTestable : T.Testable<ActivitiesTypes.Activity> = {
    display = func(activity : ActivitiesTypes.Activity) : Text {
        "Activity(" # debug_show activity.id # ")";
    };
    equals = func(a : ActivitiesTypes.Activity, b : ActivitiesTypes.Activity) : Bool {
        if (a.id != b.id) { return false };
        if (a.blockExternalId != b.blockExternalId) { return false };
        if (a.endTime != b.endTime) { return false };
        if (a.startTime != b.startTime) { return false };

        // TODO: compare other fields

        true;
    };
};

func compareBlocks(a : BlocksTypes.Block, b : BlocksTypes.Block) : Bool {
    if (UUID.toText(a.uuid) != UUID.toText(b.uuid)) { return false };
    if (a.blockType != b.blockType) { return false };

    // TODO: compare other fields

    true;
};

func printBlock(b : BlocksTypes.Block) : Text {
    "Block(" # UUID.toText(b.uuid) # ")";
};

let blockTestable : T.Testable<BlocksTypes.Block> = {
    display = printBlock;
    equals = compareBlocks;
};

func block(b : BlocksTypes.Block) : T.TestableItem<BlocksTypes.Block> {
    {
        display = printBlock;
        equals = compareBlocks;
        item = b;
    };
};

let blockUuid = switch (UUIDUtils.fromText("12345678-1234-5678-1234-567812345678")) {
    case (#err(msg)) { Debug.trap(msg) };
    case (#ok(uuid)) { uuid };
};

func _getUuid(t : Text) : UUID.UUID {
    switch (UUIDUtils.fromText(t)) {
        case (#err(msg)) { Debug.trap(msg) };
        case (#ok(uuid)) { uuid };
    };
};

let mockBlock : BlocksTypes.Block = {
    var blockType = #paragraph;
    content = Tree.Tree(null);
    var parent = null;
    properties = {
        var checked = ?false;
        var title = ?Tree.Tree(null);
    };
    uuid = blockUuid;
};

func testAddBlockAddsBlockToState() : Text {
    let state = State.init();
    ignore State.addBlock(state, mockBlock);
    let block = State.getBlock(state, UUID.toText(blockUuid));

    return UUID.toText(block.uuid);
};

func testUpdateBlockUpdatesBlockInState() : Text {
    let state = State.init();
    ignore State.addBlock(state, mockBlock);
    let result = State.updateBlock(
        state,
        {
            var blockType = #heading1;
            content = mockBlock.content;
            var parent = mockBlock.parent;
            properties = mockBlock.properties;
            uuid = mockBlock.uuid;
        },
    );
    let block = State.getBlock(state, UUID.toText(blockUuid));

    return debug_show (block.blockType);
};

func testUpdateBlockReturnsErrorIfBlockDoesNotExist() : Bool {
    let state = State.init();
    let blockUuid = switch (UUIDUtils.fromText("12345678-1234-5678-1234-567812345678")) {
        case (#err(msg)) { Debug.trap(msg) };
        case (#ok(uuid)) { uuid };
    };

    let result = State.updateBlock(
        state,
        {
            var blockType = #paragraph;
            content = Tree.Tree(null);
            var parent = null;
            properties = {
                var checked = ?false;
                var title = ?Tree.Tree(null);
            };
            uuid = blockUuid;
        },
    );

    switch (result) {
        case (#err(msg)) { true };
        case (#ok(block)) { false };
    };
};

func testDeleteBlockRemovesBlockFromState() : Bool {
    let state = State.init();
    let blockUuid = switch (UUIDUtils.fromText("12345678-1234-5678-1234-567812345678")) {
        case (#err(msg)) { Debug.trap(msg) };
        case (#ok(uuid)) { uuid };
    };

    ignore State.addBlock(
        state,
        {
            var blockType = #paragraph;
            content = Tree.Tree(null);
            var parent = null;
            properties = {
                var checked = ?false;
                var title = ?Tree.Tree(null);
            };
            uuid = blockUuid;
        },
    );
    State.deleteBlock(state, UUID.toText(blockUuid));
    let block = State.findBlock(state, UUID.toText(blockUuid));

    switch (block) {
        case (null) { true };
        case (?block) { false };
    };
};

let suite = Suite.suite(
    "State",
    [
        Suite.suite(
            "Data",
            [
                Suite.suite(
                    "addBlock",
                    [
                        Suite.testLazy<Text>(
                            "Should add a block to the state",
                            testAddBlockAddsBlockToState,
                            Matchers.equals(
                                T.text("12345678-1234-5678-1234-567812345678")
                            ),
                        ),
                    ],
                ),
                Suite.suite(
                    "updateBlock",
                    [
                        Suite.testLazy<Bool>(
                            "Should return an error if the block does not exist",
                            testUpdateBlockReturnsErrorIfBlockDoesNotExist,
                            Matchers.equals(
                                T.bool(true)
                            ),
                        ),
                        Suite.testLazy<Text>(
                            "Should update a block",
                            testUpdateBlockUpdatesBlockInState,
                            Matchers.equals(
                                T.text("#heading1")
                            ),
                        ),
                    ],
                ),
                Suite.suite(
                    "deleteBlock",
                    [
                        Suite.testLazy<Bool>(
                            "Should delete a block from the state",
                            testDeleteBlockRemovesBlockFromState,
                            Matchers.equals(
                                T.bool(true)
                            ),
                        ),
                    ],
                ),
                Suite.suite(
                    "findBlock",
                    [
                        Suite.testLazy<?BlocksTypes.Block>(
                            "Should return null if the block does not exist",
                            func() {
                                let state = State.init();
                                State.findBlock(state, UUID.toText(blockUuid));
                            },
                            Matchers.equals<?BlocksTypes.Block>(
                                T.optional<BlocksTypes.Block>(
                                    blockTestable,
                                    null,
                                )
                            ),
                        ),
                        Suite.testLazy<?BlocksTypes.Block>(
                            "Should return the block if it exists",
                            func() {
                                let state = State.init();
                                ignore State.addBlock(state, mockBlock);
                                State.findBlock(state, UUID.toText(blockUuid));
                            },
                            Matchers.equals<?BlocksTypes.Block>(
                                T.optional<BlocksTypes.Block>(
                                    blockTestable,
                                    ?mockBlock,
                                )
                            ),
                        ),
                    ],
                ),
                Suite.suite(
                    "getBlock",
                    [
                        // Suite.testLazy<Text>(
                        //     "Should return an error if the block does not exist",
                        //     func() { "" },
                        //     Matchers.equals(
                        //         T.text("#heading1")
                        //     ),
                        // ),
                        Suite.testLazy<BlocksTypes.Block>(
                            "Should return a block from the state",
                            func() {
                                let state = State.init();
                                ignore State.addBlock(state, mockBlock);
                                State.getBlock(state, UUID.toText(blockUuid));
                            },
                            Matchers.equals<BlocksTypes.Block>(block(mockBlock)),
                        ),
                    ],
                ),
                // Suite.suite(
                //     "getContentForBlock",
                //     [],
                // ),
                // Suite.suite(
                //     "getPages",
                //     [],
                // ),
                Suite.suite(
                    "getFirstAncestorPage",
                    [
                        Suite.testLazy<?BlocksTypes.Block>(
                            "Should return the first page ancestor of the block, if it exists",
                            func() {
                                let state = State.init();
                                let block = BlockBuilder.BlockBuilder({
                                    uuid = blockUuid;
                                }).build();
                                let parentBlock = BlockBuilder.BlockBuilder({
                                    uuid = _getUuid("11111111-1234-5678-1234-567812345678");
                                }).setBlockType(#page).addContentBlock(block).build();

                                block.parent := ?parentBlock.uuid;

                                ignore State.addBlock(state, block);
                                ignore State.addBlock(state, parentBlock);
                                State.getFirstAncestorPage(state, block);
                            },
                            Matchers.equals<?BlocksTypes.Block>(
                                T.optional<BlocksTypes.Block>(
                                    blockTestable,
                                    ?BlockBuilder.BlockBuilder({
                                        uuid = _getUuid("11111111-1234-5678-1234-567812345678");
                                    }).setBlockType(#page).build(),
                                )
                            ),
                        ),
                        Suite.testLazy<?BlocksTypes.Block>(
                            "Should return null if the block has no ancestors",
                            func() {
                                let state = State.init();
                                let block = BlockBuilder.BlockBuilder({
                                    uuid = blockUuid;
                                }).build();

                                ignore State.addBlock(state, block);

                                let firstAncestor = State.getFirstAncestorPage(state, block);

                                return firstAncestor;
                            },
                            Matchers.equals<?BlocksTypes.Block>(
                                T.optional<BlocksTypes.Block>(
                                    blockTestable,
                                    null,
                                )
                            ),
                        ),
                    ],
                ),
                Suite.suite(
                    "getMostRecentActivityForPage",
                    [
                        Suite.testLazy<?ActivitiesTypes.Activity>(
                            "Should return the most recent activity for the block, if it exists",
                            func() {
                                var block1 = BlockBuilder.BlockBuilder({
                                    uuid = blockUuid;
                                }).build();
                                block1.blockType := #page;

                                var activity1 = ActivityBuilder.ActivityBuilder(
                                    {
                                        blockExternalId = blockUuid;
                                        id = 1;
                                    }
                                ).build();
                                var activity2 = ActivityBuilder.ActivityBuilder(
                                    {
                                        blockExternalId = _getUuid("87654321-1234-5678-1234-567812345678");
                                        id = 2;
                                    }
                                ).build();

                                let state = State.init();

                                ignore State.addBlock(state, block1);
                                ignore State.addActivity(state, activity1);
                                ignore State.addActivity(state, activity2);

                                let mostRecentActivity = State.getMostRecentActivityForPage(state, UUID.toText(blockUuid));

                                return mostRecentActivity;
                            },
                            Matchers.equals(
                                T.optional(
                                    activityTestable,
                                    ?ActivityBuilder.ActivityBuilder(
                                        {
                                            blockExternalId = blockUuid;
                                            id = 1;
                                        }
                                    ).build(),
                                )
                            ),
                        ),
                        Suite.testLazy<?ActivitiesTypes.Activity>(
                            "Should return null if there are no activities for the block",
                            func() {
                                var block1 = BlockBuilder.BlockBuilder({
                                    uuid = blockUuid;
                                }).build();

                                let state = State.init();
                                ignore State.addBlock(state, block1);

                                let mostRecentActivity = State.getMostRecentActivityForPage(state, UUID.toText(blockUuid));

                                return mostRecentActivity;
                            },
                            Matchers.equals<?ActivitiesTypes.Activity>(
                                T.optional<ActivitiesTypes.Activity>(
                                    activityTestable,
                                    null,
                                )
                            ),
                        ),
                        Suite.testLazy<?ActivitiesTypes.Activity>(
                            "Should return the most recent activity for the block's content " #
                            "blocks if it is more recent than the block's most recent activity",
                            func() {
                                var childBlock = BlockBuilder.BlockBuilder({
                                    uuid = blockUuid;
                                }).build();
                                var parentBlock = BlockBuilder.BlockBuilder({
                                    uuid = _getUuid("11111111-1234-5678-1234-567812345678");
                                }).addContentBlock(childBlock).build();
                                var grandparentBlock = BlockBuilder.BlockBuilder({
                                    uuid = _getUuid("22222222-1234-5678-1234-567812345678");
                                }).addContentBlock(parentBlock).build();

                                var grandparentBlockActivity = ActivityBuilder.ActivityBuilder(
                                    {
                                        blockExternalId = grandparentBlock.uuid;
                                        id = 1;
                                    }
                                ).build();
                                var parentBlockActivity = ActivityBuilder.ActivityBuilder(
                                    {
                                        blockExternalId = parentBlock.uuid;
                                        id = 2;
                                    }
                                ).build();

                                let state = State.init();

                                ignore State.addBlock(state, childBlock);
                                ignore State.addBlock(state, parentBlock);
                                ignore State.addBlock(state, grandparentBlock);
                                ignore State.addActivity(state, grandparentBlockActivity);
                                ignore State.addActivity(state, parentBlockActivity);

                                let mostRecentActivity = State.getMostRecentActivityForPage(state, UUID.toText(grandparentBlock.uuid));

                                return mostRecentActivity;
                            },
                            Matchers.equals<?ActivitiesTypes.Activity>(
                                T.optional<ActivitiesTypes.Activity>(
                                    activityTestable,
                                    ?ActivityBuilder.ActivityBuilder(
                                        {
                                            blockExternalId = _getUuid("11111111-1234-5678-1234-567812345678");
                                            id = 2;
                                        }
                                    ).build(),
                                )
                            ),
                        ),
                    ],
                ),
                // Suite.suite(
                //     "getActivitiesForPage",
                //     [],
                // ),
            ],
        )
    ],
);

Suite.run(suite);
