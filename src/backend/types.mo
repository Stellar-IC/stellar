module {
    public type UserId = Principal;

    public type Edge<DataT> = {
        node : DataT;
    };

    public type PaginatedResults<DataT> = {
        edges : [Edge<DataT>];
    };

    public type SortDirection = {
        #asc;
        #desc;
    };

    public type SortOrder = {
        fieldName : Text;
        direction : SortDirection;
    };
};
