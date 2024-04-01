import UUID "mo:uuid/UUID";
import Map "mo:map/Map";
import Text "mo:base/Text";
import List "mo:base/List";
import Principal "mo:base/Principal";
import Array "mo:base/Array";

import Block "./modules/block";
import User "./modules/users";
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
    } = Block;

    public let {
        getActiveUsers;
        getActiveUsersForPage;
        markUserAsActive;
        markUserAsInactive;
    } = User;
};
