import Array "mo:base/Array";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";

import BlocksTypes "../../../lib/blocks/types";
import Tree "../../../utils/data/lseq/Tree";

import State "../model/state";
import Types "../types";

module {
    type UnsavedBlock = BlocksTypes.UnsavedBlock;
    type UnsavedBlock_v2 = BlocksTypes.UnsavedBlock_v2;
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
    ) : async CreatePageServiceOutput {
        if (Principal.isAnonymous(userPrincipal)) {
            return #err(#anonymousUser);
        };

        let contentBlockUuid = await Source.Source().new();
        let contentBlock : UnsavedBlock_v2 = {
            var blockType = #paragraph;
            uuid = contentBlockUuid;
            content = Tree.Tree(null);
            properties = {
                title = ?Tree.Tree(null);
                var checked = ?false;
            };
            var parent = ?input.uuid;
        };

        let contentForNewPage = Tree.Tree(null);

        ignore Tree.insertCharacterAtStart(contentForNewPage, UUID.toText(contentBlockUuid));

        let pageToCreate : UnsavedBlock_v2 = {
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

        let validation = _validate(pageToCreate);
        switch (validation) {
            case (#err(err)) {
                return #err(err);
            };
            case (#ok()) {};
        };

        let result = state.data.addBlock(pageToCreate);
        ignore state.data.addBlock(contentBlock);

        switch (result) {
            case (#ok(pk, block)) {
                let shareableTitle : ShareableBlockText = switch (block.properties.title) {
                    case (null) {
                        Tree.toShareableTree(Tree.Tree(null));
                    };
                    case (?title) {
                        Tree.toShareableTree(title);
                    };
                };
                let shareableContent : ShareableBlockContent = Tree.toShareableTree(block.content);
                let shareableProperties : ShareableBlockProperties = {
                    block.properties with title = ?shareableTitle;
                    checked = block.properties.checked;
                };

                return #ok({
                    block with properties = shareableProperties;
                    content = shareableContent;
                    blockType = block.blockType;
                    parent = block.parent;
                });
            };
            case (#err(#keyAlreadyExists)) {
                return #err(#failedToCreate);
            };
        };
    };

    private func _validate(input : UnsavedBlock_v2) : Result.Result<(), { #anonymousUser; #inputTooLong; #invalidBlockType }> {
        if (input.blockType != #page) {
            return #err(#invalidBlockType);
        };

        return #ok();
    };
};
