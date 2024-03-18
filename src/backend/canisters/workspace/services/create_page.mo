import Array "mo:base/Array";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";

import BlockBuilder "../../../lib/blocks/BlockBuilder";
import BlocksTypes "../../../lib/blocks/types";
import Tree "../../../utils/data/lseq/Tree";

import State "../model/state";
import Types "../types/v0";

module {
    type UnsavedBlock = BlocksTypes.UnsavedBlock;
    type ShareableBlockContent = BlocksTypes.ShareableBlockContent;
    type ShareableBlockText = BlocksTypes.ShareableBlockText;
    type ShareableBlockProperties = BlocksTypes.ShareableBlockProperties;

    type CreatePageServiceInput = Types.Services.CreatePageService.CreatePageServiceInput;
    type CreatePageServiceOutput = Types.Services.CreatePageService.CreatePageServiceOutput;

    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        userPrincipal : Principal,
        input : CreatePageServiceInput,
    ) : CreatePageServiceOutput {
        if (Principal.isAnonymous(userPrincipal)) {
            return #err(#anonymousUser);
        };

        let initialBlockUuid = input.initialBlockUuid;
        let initialBlock : UnsavedBlock = BlockBuilder.BlockBuilder({
            uuid = initialBlockUuid;
        }).setParent(input.uuid).build();
        let contentForNewPage = Tree.Tree(null);

        ignore Tree.insertCharacterAtStart(contentForNewPage, UUID.toText(initialBlockUuid));

        let pageToCreate : UnsavedBlock = {
            var blockType = #page;
            uuid = input.uuid;
            content = contentForNewPage;
            properties = {
                title = ?(
                    switch (input.properties.title) {
                        case (null) { Tree.Tree(null) };
                        case (?title) {
                            Tree.fromShareableTree(title);
                        };
                    }
                );
                var checked = input.properties.checked;
            };
            var parent = input.parent;
        };

        state.data.addBlock(pageToCreate);
        state.data.addBlock(initialBlock);

        let shareableTitle : ShareableBlockText = switch (pageToCreate.properties.title) {
            case (null) {
                Tree.toShareableTree(Tree.Tree(null));
            };
            case (?title) {
                Tree.toShareableTree(title);
            };
        };
        let shareableContent : ShareableBlockContent = Tree.toShareableTree(pageToCreate.content);
        let shareableProperties : ShareableBlockProperties = {
            pageToCreate.properties with title = ?shareableTitle;
            checked = pageToCreate.properties.checked;
        };

        return #ok({
            pageToCreate with properties = shareableProperties;
            content = shareableContent;
            blockType = pageToCreate.blockType;
            parent = pageToCreate.parent;
        });
    };
};
