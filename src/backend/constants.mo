import CyclesUtils "./utils/cycles";

module Constants {
    public let DEV_IDENTITIES = [
        "loj7m-57vb4-jui2d-k4z35-ejgqc-lzarq-lhfmx-ekokh-kf6e4-5vad7-fqe"
    ];

    public class Constants() {
        private func scalar(
            value : {
                #trillion : Nat;
                #billion : Nat;
                #million : Nat;
            }
        ) : Nat {
            switch (value) {
                case (#trillion(value)) {
                    value * 1_000_000_000_000;
                };
                case (#billion(value)) {
                    value * 1_000_000_000;
                };
                case (#million(value)) {
                    value * 1_000_000;
                };
            };
        };

        public let WORKSPACE__CAPACITY = {
            scalar = scalar(#billion(500));
            unit = #cycles;
        };

        public let WORKSPACE__FREEZING_THRESHOLD = {
            scalar = 2592000;
            unit = #seconds;
        };

        public let WORKSPACE__INITIAL_CYCLES_BALANCE = {
            scalar = scalar(#billion(100));
            unit = #cycles;
        };

        public let WORKSPACE__MEMORY_ALLOCATION = {
            scalar = scalar(#million(100));
            unit = #bytes;
        };

        public let WORKSPACE__TOP_UP_AMOUNT = {
            scalar = scalar(#billion(10));
            unit = #cycles;
        };

        public let USER__CAPACITY = {
            scalar = scalar(#trillion(1));
            unit = #cycles;
        };

        public let USER__FREEZING_THRESHOLD = {
            scalar = 2592000;
            unit = #seconds;
        };

        public let USER__INITIAL_CYCLES_BALANCE = {
            scalar = scalar(#billion(200)) + WORKSPACE__INITIAL_CYCLES_BALANCE.scalar;
            unit = #cycles;
        };

        public let USER__MEMORY_ALLOCATION = {
            scalar = scalar(#million(100));
            unit = #bytes;
        };

        public let USER__TOP_UP_AMOUNT = {
            scalar = scalar(#billion(10));
            unit = #cycles;
        };

        public let USER_INDEX__TOP_UP_AMOUNT = {
            scalar = scalar(#billion(100));
            unit = #cycles;
        };

        public let WORKSPACE_INDEX__TOP_UP_AMOUNT = {
            scalar = scalar(#billion(100));
            unit = #cycles;
        };
    };
};
