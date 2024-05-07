import CyclesUtils "./utils/cycles";

module Constants {
    public let DEV_IDENTITIES = [
        "loj7m-57vb4-jui2d-k4z35-ejgqc-lzarq-lhfmx-ekokh-kf6e4-5vad7-fqe"
    ];

    public let WORKSPACE__CAPACITY = {
        scalar = 500_000_000_000;
        unit = #cycles;
    };

    public let WORKSPACE__FREEZING_THRESHOLD = {
        scalar = 2_592_000;
        unit = #seconds;
    };

    public let WORKSPACE__INITIAL_CYCLES_BALANCE = {
        scalar = 400_000_000_000;
        unit = #cycles;
    };

    public let WORKSPACE__MEMORY_ALLOCATION = {
        scalar = 100_000_000;
        unit = #bytes;
    };

    public let WORKSPACE__TOP_UP_AMOUNT = {
        scalar = 10_000_000_000;
        unit = #cycles;
    };

    public let USER__CAPACITY = {
        scalar = 1_000_000_000_000;
        unit = #cycles;
    };

    public let USER__FREEZING_THRESHOLD = {
        scalar = 2_592_000;
        unit = #seconds;
    };

    public let USER__INITIAL_CYCLES_BALANCE = {
        scalar = 2_000_000_000_000;
        unit = #cycles;
    };

    public let USER__MEMORY_ALLOCATION = {
        scalar = 100_000_000;
        unit = #bytes;
    };

    public let USER__TOP_UP_AMOUNT = {
        scalar = 100_000_000_000;
        unit = #cycles;
    };

    public let USER_INDEX__TOP_UP_AMOUNT = {
        scalar = 100_000_000_000;
        unit = #cycles;
    };

    public let WORKSPACE_INDEX__TOP_UP_AMOUNT = {
        scalar = 100_000_000_000;
        unit = #cycles;
    };
};
