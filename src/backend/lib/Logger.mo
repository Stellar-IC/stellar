import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Canistergeek "mo:canistergeek/canistergeek";
import CanistergeekLoggerTypesModule "mo:canistergeek/logger/typesModule"

module Logger {
    public type LoggerAdapter = {
        info : (message : Text) -> ();
    };

    public class DebugLoggerAdapter() {
        public func info(message : Text) {
            Debug.print("INFO: " # message);
        };
    };

    public class CanisterGeekLoggerAdapter(canistergeekLogger : Canistergeek.Logger) {
        public func info(message : Text) {
            canistergeekLogger.logMessage("INFO: " # message);
        };
    };

    public class Logger(adapters : [LoggerAdapter]) {
        public func info(message : Text) {
            for (adapter in Iter.fromArray(adapters)) {
                adapter.info(message);
            };
        };
    };
};
