import Principal "mo:base/Principal";
import Debug "mo:base/Debug";

module Guards {
    public func assertIsNotAnonymous(principal : Principal) {
        if (Principal.isAnonymous(principal)) {
            Debug.trap("Anonymous access not allowed");
        };
    };

    public func assertMatches(principal : Principal, expected : Principal) {
        if (principal != expected) {
            Debug.trap("Unauthorized access not allowed");
        };
    };
};
