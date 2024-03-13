import RBTree "mo:base/RBTree";
import UUID "mo:uuid/UUID";
import UUIDModelManager "./uuid_model_manager";
import IDModelManager "./id_model_manager";

module Models {
    public class IDModel<DataT <: { id : Nat }>() {
        public let objects = IDModelManager.IDModelManager<DataT>();

        public func preupgrade() : RBTree.Tree<Nat, DataT> {
            return objects.preupgrade();
        };

        public func postupgrade(_data : RBTree.Tree<Nat, DataT>) : () {
            objects.postupgrade(_data);
        };
    };

    public class UUIDModel<DataT <: { uuid : UUID.UUID }>() {
        public let objects = UUIDModelManager.UUIDModelManager<DataT>();

        public func preupgrade() : RBTree.Tree<Text, DataT> {
            return objects.preupgrade();
        };

        public func postupgrade(_data : RBTree.Tree<Text, DataT>) : () {
            objects.postupgrade(_data);
        };
    };
};
