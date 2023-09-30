import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Error "mo:base/Error";

module Test {
    public type Error = { #failedTest : ?Text };
    public type TestResult = Result.Result<(), Error>;
};
