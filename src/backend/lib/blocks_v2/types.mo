import Time "mo:base/Time";
import Text "mo:base/Text";
import UUID "mo:uuid/UUID";
import Map "mo:map/Map";

import TreeEvent "../../utils/data/lseq/TreeEvent";
import LseqTypes "../../utils/data/lseq/types";

module Types {
    public type BlockId = UUID.UUID;
    public type TreeEvent = LseqTypes.TreeEvent;

    public type BlockProperty = {
        #text : Text;
        #boolean : Bool;
    };

    public type BlockAttributeUpdate = {
        #content : TreeEvent;
        #props : Map.Map<Text, BlockProperty>;
        #children : TreeEvent;
    };

    public type Awareness = {
        username : Text;
        color : Text;
        selection : ?{
            start : {
                blockId : BlockId;
                position : Nat;
            };
            end : {
                blockId : BlockId;
                position : Nat;
            };
        };
    };

    public type DocumentStateUpdate = {
        time : Time.Time;
        changes : [BlockAttributeUpdate];
        awareness : ?Awareness;
        userId : Text;
    };

    public type DocumentState = {
        id : BlockId;
        nestedBlocks : Map.Map<BlockId, DocumentState>;
        updates : [DocumentStateUpdate];
    };

    public type SyncStep1Message = DocumentState;
    public type SyncStep2Message = [DocumentStateUpdate]; // List of updates since last sync
};
