import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";

import Matchers "mo:matchers/Matchers";
import T "mo:matchers/Testable";
import Suite "mo:matchers/Suite";

import UUID "mo:uuid/UUID";

import BlocksTypes "../../../../lib/blocks/Types";
import Block "../../../../lib/blocks/Block";
import BlockBuilder "../../../../lib/blocks/BlockBuilder";
import TestHelpers "../../../../tests/helpers";
import Tree "../../../../utils/data/lseq/Tree";
import UUIDUtils "../../../../utils/uuid";

import State "../../model/state";

import CreatePage "../create_page";

let pageUuid = switch (UUIDUtils.fromText("12345678-1234-5678-1234-567812345678")) {
    case (#err(msg)) { Debug.trap(msg) };
    case (#ok(uuid)) { uuid };
};

let suite = Suite.suite(
    "CreatePage",
    [
        Suite.suite(
            "execute",
            [
                Suite.testLazy<Text>(
                    "Should return an error if the user principal is anonymous",
                    func() {
                        let state = State.State(State.Data());
                        let initialBlockUuid = TestHelpers.getUuid("11111111-1234-5678-1234-567812345678");
                        let result = CreatePage.execute(
                            state,
                            Principal.fromText("2vxsx-fae"),
                            {
                                content = Tree.toShareableTree(Tree.Tree(null));
                                parent = null;
                                properties = {
                                    title = null;
                                    checked = ?false;
                                };
                                uuid = pageUuid;
                                initialBlockUuid;
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
                    "Should create a page block with a single content block",
                    func() {
                        let now = Time.now();
                        let state = State.State(State.Data());
                        let initialBlockUuid = TestHelpers.getUuid("11111111-1234-5678-1234-567812345678");
                        let result = CreatePage.execute(
                            state,
                            Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai"),
                            {
                                content = Tree.toShareableTree(Tree.Tree(null));
                                parent = null;
                                properties = {
                                    title = null;
                                    checked = ?false;
                                };
                                uuid = pageUuid;
                                initialBlockUuid;
                            },
                        );
                        let page = switch (result) {
                            case (#err(msg)) {
                                Debug.trap("Failed to create page block");
                            };
                            case (#ok(page)) { Block.fromShareable(page) };
                        };

                        assert (state.data.Block.objects.count() == 2);

                        let pageFromState = switch (state.data.Block.objects.get(UUID.toText(pageUuid))) {
                            case (null) {
                                Debug.trap("Block not found in state");
                            };
                            case (?pageFromState) {
                                assert (Block.compare(page, pageFromState));
                                pageFromState;
                            };
                        };
                        let pageContent = Tree.toArray(pageFromState.content);
                        let contentBlockFromState = switch (state.data.Block.objects.get(UUID.toText(initialBlockUuid))) {
                            case (null) {
                                Debug.trap("Expected content block");
                            };
                            case (?contentBlock) {
                                assert (contentBlock.parent == ?pageUuid);
                                assert (pageContent[0] == UUID.toText(contentBlock.uuid));
                                contentBlock;
                            };
                        };

                        return page;
                    },
                    Matchers.equals(
                        TestHelpers.block({
                            content = Tree.Tree(null);
                            var blockType = #page;
                            var parent = null;
                            properties = {
                                title = null;
                                var checked = ?false;
                            };
                            uuid = pageUuid;
                        })
                    ),
                ),
            ],
        ),
    ],
);

Suite.run(suite);
