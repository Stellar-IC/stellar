import List "mo:base/List";
import Order "mo:base/Order";

module Types {
    public type Index<AttrT, PrimaryKeyT> = {
        get(attr_value : AttrT) : List.List<PrimaryKeyT>;
        put(attr_value : AttrT, pk : PrimaryKeyT) : ();
    };

    public type IndexType = {
        #unique;
    };

    public type ValueType = {
        #text;
        #uuid;
    };

    public type IndexConfig<DataT, PrimaryKeyT> = {
        index_type : IndexType;
        field_name : Text;
        value_type : { #text; #uuid };
        add_value_to_index : (Text, DataT, Index<Text, PrimaryKeyT>) -> ();
    };
};
