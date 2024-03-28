import B "./modules/block";
import S "./state";

module {
    public let { State; Data } = S;
    public type State = S.State;

    public func init() : S.State {
        return State(Data());
    };

    public let {
        addActivity;
        addBlock;
        deleteBlock;
        findActivity;
        findBlock;
        getActivitiesForPage;
        getActivity;
        getBlock;
        getContentForBlock;
        getFirstAncestorPage;
        getMostRecentActivityForPage;
        getPages;
        updateActivity;
        updateBlock;
    } = B;
};
