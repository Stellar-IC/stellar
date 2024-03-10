import Debug "mo:base/Debug";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Order "mo:base/Order";
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";
import UUID "mo:uuid/UUID";

import ModelManager "../../utils/data/database/model_manager";
import DatabaseTypes "../../utils/data/database/types";
import IdManager "../../utils/data/id_manager";
import Tree "../../utils/data/lseq/Tree";

import Types "./types";

module BlockModule = {
    type ShareableBlock = Types.ShareableBlock;
    type Block = Types.Block;
    type BlockProperties = Types.BlockProperties;
    type BlockText = Types.BlockText;
    type UnsavedBlock = Types.UnsavedBlock;
    type BlockContent = Types.BlockContent;
    type ShareableBlockContent = Types.ShareableBlockContent;
    type ShareableBlockProperties = Types.ShareableBlockProperties;
    type ShareableBlockText = Types.ShareableBlockText;
    type ShareableUnsavedBlock = Types.ShareableUnsavedBlock;

    public func fromShareable(input : ShareableBlock) : Block {
        let title : BlockText = switch (input.properties.title) {
            case (null) {
                Tree.Tree(null);
            };
            case (?title) {
                Tree.fromShareableTree(title);
            };
        };
        let content : BlockContent = Tree.fromShareableTree(input.content);
        let properties : BlockProperties = {
            title = ?title;
            var checked = input.properties.checked;
        };

        return {
            input with properties = properties;
            content = content;
            var blockType = input.blockType;
            var parent = input.parent;
        };
    };

    public func fromShareableUnsaved(input : ShareableUnsavedBlock) : UnsavedBlock {
        let title : BlockText = switch (input.properties.title) {
            case (null) { Tree.Tree(null) };
            case (?title) {
                Tree.fromShareableTree(title);
            };
        };
        let content : BlockContent = Tree.fromShareableTree(input.content);
        let properties : BlockProperties = {
            title = ?title;
            var checked = input.properties.checked;
        };

        return {
            input with properties = properties;
            content = content;
            var blockType = input.blockType;
            var parent = input.parent;
        };
    };

    public func toShareable(input : Block) : ShareableBlock {
        let shareableTitle : ShareableBlockText = switch (input.properties.title) {
            case (null) {
                Tree.toShareableTree(Tree.Tree(null));
            };
            case (?title) {
                Tree.toShareableTree(title);
            };
        };
        let shareableContent : ShareableBlockContent = Tree.toShareableTree(input.content);
        let shareableProperties : ShareableBlockProperties = {
            title = ?shareableTitle;
            checked = input.properties.checked;
        };

        return {
            input with properties = shareableProperties;
            content = shareableContent;
            blockType = input.blockType;
            parent = input.parent;
        };
    };

};
