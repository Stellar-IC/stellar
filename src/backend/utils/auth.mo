import Principal "mo:base/Principal";

import Constants "../constants";

module AuthUtils {
    public func isDev(principal : Principal) : Bool {
        for (identity in Constants.DEV_IDENTITIES.vals()) {
            if (Principal.fromText(identity) == principal) {
                return true;
            };
        };

        return false;
    };
};
