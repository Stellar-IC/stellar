import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Deque "mo:base/Deque";
import Error "mo:base/Error";
import List "mo:base/List";
import RBTree "mo:base/RBTree";
import Result "mo:base/Result";
import Text "mo:base/Text";

import Test "../../utils/test";

module {
    // Class responsible for running tests and storing results
    public class TestRunner() {
        public type Error = { #failedTest };

        // Represents the status of a test result node
        type TestResultNode = { status : { #pass; #fail }; message : ?Text };

        type TestID = Text;

        // Represents the test tree structure
        type TestResults = RBTree.RBTree<TestID, TestResultNode>;

        // Keeps track of test results
        public var test_results = RBTree.RBTree<TestID, TestResultNode>(Text.compare);

        // Keeps track of the context for nested describe/it calls
        var current_context = Deque.empty<Text>();

        // Asynchronously runs a describe block
        public func describe(
            description : Text,
            fn : () -> async (),
        ) : async () {
            Debug.print(description);
            current_context := Deque.pushFront(current_context, description);

            await fn();

            var popped = Deque.popFront(current_context);

            switch popped {
                case null {};
                case (?val) {
                    current_context := val.1;
                };
            };
        };

        // Asynchronously runs an it block
        public func it(
            description : Text,
            fn : () -> async Test.TestResult,
        ) : async () {
            Debug.print("\t- " # description);
            current_context := Deque.pushFront(current_context, description);

            let result = await fn();

            let output = switch (result) {
                case (#err(#failedTest(?message))) {
                    var key = _deque_to_text(current_context);
                    test_results.put(
                        key,
                        {
                            status = #fail;
                            message = ?message;
                        },
                    );
                };
                case (#err(#failedTest(null))) {
                    var key = _deque_to_text(current_context);
                    test_results.put(
                        key,
                        {
                            status = #fail;
                            message = null;
                        },
                    );
                };
                case (#ok) {
                    var key = _deque_to_text(current_context);
                    test_results.put(
                        key,
                        {
                            status = #pass;
                            message = null;
                        },
                    );
                };
            };

            var popped = Deque.popFront(current_context);

            switch popped {
                case null {};
                case (?val) {
                    current_context := val.1;
                };
            };
        };

        // Converts a Deque to Text for key generation
        func _deque_to_text(deque : Deque.Deque<Text>) : Text {
            var copy = deque;
            var output = "";
            var is_first_iteration = true;

            while (Deque.isEmpty(copy) == false) {
                var popped = Deque.popBack(copy);

                switch popped {
                    case null {};
                    case (?val) {
                        if (is_first_iteration) {
                            output := output # val.1;
                        } else {
                            output := output # " - " # val.1;
                        };
                        copy := val.0;
                    };
                };
                is_first_iteration := false;
            };

            return output;
        };
    };
};
