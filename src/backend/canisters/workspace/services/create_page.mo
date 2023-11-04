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
    let MAX_CONTENT_SIZE = 2000;

    public func execute(
        state : State.State,
        userPrincipal : Principal,
        input : Types.Services.CreatePageService.CreatePageServiceInput,
    ) : async Types.Services.CreatePageService.CreatePageServiceOutput {
        if (Principal.isAnonymous(userPrincipal)) {
            return #err(#anonymousUser);
        };

        let content_block_uuid = await Source.Source().new();
        let content_block : BlocksTypes.UnsavedBlock = {
            var blockType = #paragraph;
            uuid = content_block_uuid;
            var content = [];
            properties = {
                title = ?Tree.Tree(null);
                var checked = ?false;
            };
            parent = ?input.uuid;
        };

        let page_to_create : BlocksTypes.UnsavedBlock = {
            var blockType = #page;
            uuid = input.uuid;
            var content = [content_block.uuid];
            properties = {
                title = ?(
                    switch (input.properties.title) {
                        case (null) {
                            Tree.Tree(null);
                        };
                        case (?title) {
                            Tree.fromShareableTree(title);
                        };
                    }
                );
                var checked = input.properties.checked;
            };
            parent = input.parent;
        };

        let validation = _validate(page_to_create);
        switch (validation) {
            case (#err(err)) {
                return #err(err);
            };
            case (#ok()) {};
        };

        let result = state.data.addBlock(page_to_create);
        ignore state.data.addBlock(content_block);

        switch (result) {
            case (#ok(pk, block)) {
                let shareableTitle : BlocksTypes.ShareableBlockText = switch (block.properties.title) {
                    case (null) {
                        Tree.toShareableTree(Tree.Tree(null));
                    };
                    case (?title) {
                        Tree.toShareableTree(title);
                    };
                };
                let shareableProperties : BlocksTypes.ShareableBlockProperties = {
                    block.properties with title = ?shareableTitle;
                    checked = block.properties.checked;
                };

                return #ok({
                    block with properties = shareableProperties;
                    content = block.content;
                    blockType = block.blockType;
                });
            };
            case (#err(#keyAlreadyExists)) {
                return #err(#failedToCreate);
            };
        };
    };

    private func _validate(input : BlocksTypes.UnsavedBlock) : Result.Result<(), { #anonymousUser; #inputTooLong; #invalidBlockType }> {
        if (Array.size<UUID.UUID>(input.content) > MAX_CONTENT_SIZE) {
            return #err(#inputTooLong);
        };

        if (input.blockType != #page) {
            return #err(#invalidBlockType);
        };

        return #ok();
    };
};
