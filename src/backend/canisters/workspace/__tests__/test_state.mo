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

import ActivityBuilder "../../../../lib/activities/ActivityBuilder";
import ActivitiesTypes "../../../../lib/activities/Types";
import BlockBuilder "../../../../lib/blocks/BlockBuilder";
import BlocksTypes "../../../../lib/blocks/Types";
import Tree "../../../../utils/data/lseq/Tree";
import UUIDUtils "../../../../utils/uuid";

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
        title = ?Tree.Tree(null);
    };
    uuid = blockUuid;
};

func testAddBlockAddsBlockToState() : Text {
    let data = State.Data();
    data.addBlock(mockBlock);
    let block = data.getBlock(UUID.toText(blockUuid));

    return UUID.toText(block.uuid);
};

func testUpdateBlockUpdatesBlockInState() : Text {
    let data = State.Data();
    data.addBlock(mockBlock);
    let result = data.updateBlock({
        var blockType = #heading1;
        content = mockBlock.content;
        var parent = mockBlock.parent;
        properties = mockBlock.properties;
        uuid = mockBlock.uuid;
    });
    let block = data.getBlock(UUID.toText(blockUuid));

    return debug_show (block.blockType);
};

func testUpdateBlockReturnsErrorIfBlockDoesNotExist() : Bool {
    let data = State.Data();
    let blockUuid = switch (UUIDUtils.fromText("12345678-1234-5678-1234-567812345678")) {
        case (#err(msg)) { Debug.trap(msg) };
        case (#ok(uuid)) { uuid };
    };

    let result = data.updateBlock({
        var blockType = #paragraph;
        content = Tree.Tree(null);
        var parent = null;
        properties = {
            var checked = ?false;
            title = ?Tree.Tree(null);
        };
        uuid = blockUuid;
    });

    switch (result) {
        case (#err(msg)) { true };
        case (#ok(block)) { false };
    };
};

func testDeleteBlockRemovesBlockFromState() : Bool {
    let data = State.Data();
    let blockUuid = switch (UUIDUtils.fromText("12345678-1234-5678-1234-567812345678")) {
        case (#err(msg)) { Debug.trap(msg) };
        case (#ok(uuid)) { uuid };
    };

    data.addBlock({
        var blockType = #paragraph;
        content = Tree.Tree(null);
        var parent = null;
        properties = {
            var checked = ?false;
            title = ?Tree.Tree(null);
        };
        uuid = blockUuid;
    });
    data.deleteBlock(UUID.toText(blockUuid));
    let block = data.findBlock(UUID.toText(blockUuid));

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
                                let data = State.Data();
                                data.findBlock(UUID.toText(blockUuid));
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
                                let data = State.Data();
                                data.addBlock(mockBlock);
                                data.findBlock(UUID.toText(blockUuid));
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
                                let data = State.Data();
                                data.addBlock(mockBlock);
                                data.getBlock(UUID.toText(blockUuid));
                            },
                            Matchers.equals<BlocksTypes.Block>(block(mockBlock)),
                        ),
                    ],
                ),
                // Suite.suite(
                //     "getContentForBlock",
                //     [
                //         Suite.testLazy<Text>(
                //             "Should return an error if the block does not exist",
                //             func() { "" },
                //             Matchers.equals(
                //                 T.text("#heading1")
                //             ),
                //         ),
                //         Suite.testLazy<Text>(
                //             "Should return a list of the blocks's content blocks, including deeply nested blocks",
                //             func() { "" },
                //             Matchers.equals(
                //                 T.text("12345678-1234-5678-1234-567812345678")
                //             ),
                //         ),
                //         Suite.testLazy<Text>(
                //             "Should return an empty list if the blocks has no content",
                //             func() { "" },
                //             Matchers.equals(
                //                 T.text("12345678-1234-5678-1234-567812345678")
                //             ),
                //         ),
                //     ],
                // ),
                // Suite.suite(
                //     "getPages",
                //     [
                //         Suite.testLazy<Text>(
                //             "Should return a list of all page blocks in the state",
                //             func() { "" },
                //             Matchers.equals(
                //                 T.text("12345678-1234-5678-1234-567812345678")
                //             ),
                //         ),
                //     ],
                // ),
                Suite.suite(
                    "getFirstAncestorPage",
                    [
                        Suite.testLazy<?BlocksTypes.Block>(
                            "Should return the first page ancestor of the block, if it exists",
                            func() {
                                let data = State.Data();
                                let block = BlockBuilder.BlockBuilder({
                                    uuid = blockUuid;
                                }).build();
                                let parentBlock = BlockBuilder.BlockBuilder({
                                    uuid = _getUuid("11111111-1234-5678-1234-567812345678");
                                }).setBlockType(#page).addContentBlock(block).build();

                                block.parent := ?parentBlock.uuid;

                                data.addBlock(block);
                                data.addBlock(parentBlock);
                                data.getFirstAncestorPage(block);
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
                                let data = State.Data();
                                let block = BlockBuilder.BlockBuilder({
                                    uuid = blockUuid;
                                }).build();

                                data.addBlock(block);

                                let firstAncestor = data.getFirstAncestorPage(block);

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

                                var data = State.Data();

                                data.addBlock(block1);
                                data.addActivity(activity1);
                                data.addActivity(activity2);

                                let mostRecentActivity = data.getMostRecentActivityForPage(UUID.toText(blockUuid));

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

                                var data = State.Data();
                                data.addBlock(block1);

                                let mostRecentActivity = data.getMostRecentActivityForPage(UUID.toText(blockUuid));

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

                                var data = State.Data();

                                data.addBlock(childBlock);
                                data.addBlock(parentBlock);
                                data.addBlock(grandparentBlock);
                                data.addActivity(grandparentBlockActivity);
                                data.addActivity(parentBlockActivity);

                                let mostRecentActivity = data.getMostRecentActivityForPage(UUID.toText(grandparentBlock.uuid));

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
                //     [
                //         Suite.testLazy<Text>(
                //             "Should return a list of activities for the block, if they exist",
                //             func() { "" },
                //             Matchers.equals(
                //                 T.text("12345678-1234-5678-1234-567812345678")
                //             ),
                //         ),
                //         Suite.testLazy<Text>(
                //             "Should return null if the block doesn't exist",
                //             func() { "" },
                //             Matchers.equals(
                //                 T.text("12345678-1234-5678-1234-567812345678")
                //             ),
                //         ),
                //         Suite.testLazy<Text>(
                //             "Should return null if there are no activities for the block",
                //             func() { "" },
                //             Matchers.equals(
                //                 T.text("12345678-1234-5678-1234-567812345678")
                //             ),
                //         ),
                //     ],
                // ),
            ],
        )
    ],
);

Suite.run(suite);
