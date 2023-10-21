import Principal "mo:base/Principal";
import Text "mo:base/Text";

module Types {
    public type Username = Text;
    public type ProfileInput = {
        username : Username;
    };
};
