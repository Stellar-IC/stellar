import RBTree "mo:base/RBTree";
import UUID "mo:uuid/UUID";
import UUIDModelManager "./uuid_model_manager";

module Models {
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
