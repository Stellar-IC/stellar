import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";

import Matchers "mo:matchers/Matchers";
import T "mo:matchers/Testable";
import Suite "mo:matchers/Suite";

import UUID "mo:uuid/UUID";

import BlocksTypes "../../../../lib/blocks/types";
import Block "../../../../lib/blocks/block";
import BlockBuilder "../../../../lib/blocks/block_builder";
import TestHelpers "../../../../tests/helpers";
import Tree "../../../../utils/data/lseq/Tree";
import UUIDUtils "../../../../utils/uuid";

import State "../../state";

import CreateBlock "../create_block";

let blockUuid = switch (UUIDUtils.fromText("12345678-1234-5678-1234-567812345678")) {
    case (#err(msg)) { Debug.trap(msg) };
    case (#ok(uuid)) { uuid };
};

let suite = Suite.suite(
    "CreateBlock",
    [
        Suite.suite(
            "execute",
            [
                Suite.testLazy<Text>(
                    "Should return an error if the user principal is anonymous",
                    func() {
                        let now = Time.now();
                        let state = State.State(State.Data());
                        let result = CreateBlock.execute(
                            state,
                            Principal.fromText("2vxsx-fae"),
                            {
                                content = Tree.Tree(null);
                                var blockType = #todoList;
                                var parent = null;
                                properties = {
                                    title = null;
                                    var checked = ?false;
                                };
                                uuid = blockUuid;
                            },
                        );
                        return switch (result) {
                            case (#err(msg)) { debug_show msg };
                            case (#ok(block)) {
                                Debug.trap("Expected error");
                            };
                        };
                    },
                    Matchers.equals(
                        T.text("#anonymousUser")
                    ),
                ),
                Suite.testLazy<BlocksTypes.Block>(
                    "Should create an activity",
                    func() {
                        let now = Time.now();
                        let state = State.State(State.Data());
                        let result = CreateBlock.execute(
                            state,
                            Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai"),
                            {
                                content = Tree.Tree(null);
                                var blockType = #todoList;
                                var parent = null;
                                properties = {
                                    title = null;
                                    var checked = ?false;
                                };
                                uuid = blockUuid;
                            },
                        );
                        let block = switch (result) {
                            case (#err(msg)) {
                                Debug.trap("Failed to create block");
                            };
                            case (#ok(block)) { block };
                        };
                        let blockFromState = switch (state.data.Block.objects.get(UUID.toText(blockUuid))) {
                            case (null) {
                                Debug.trap("Block not found in state");
                            };
                            case (?blockFromState) {
                                assert (Block.compare(block, blockFromState));
                                blockFromState;
                            };
                        };

                        return block;
                    },
                    Matchers.equals(
                        TestHelpers.block({
                            content = Tree.Tree(null);
                            var blockType = #todoList;
                            var parent = null;
                            properties = {
                                title = null;
                                var checked = ?false;
                            };
                            uuid = blockUuid;
                        })
                    ),
                ),
            ],
        ),
    ],
);

Suite.run(suite);
