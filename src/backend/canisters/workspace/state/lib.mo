import B "./modules/block";
import S "./state";

module {
    public type State = S.State;

    public let { State; Data; init } = S;

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
