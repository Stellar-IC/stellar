module Constants {
    public let CYCLES_REQUIRED_FOR_UPGRADE = 80_000_000_000; // 0.08T cycles

    public let USER__CAPACITY = 400_000_000_000; // 0.4T cycles
    public let USER__COMPUTE_ALLOCATION = 0; // 0% of maximum compute power that a single canister can allocate
    public let USER__FREEZING_THRESHOLD = 2592000; // 30 days
    public let USER__INITIAL_CYCLES_BALANCE = USER__CAPACITY;
    public let USER__MEMORY_ALLOCATION = 100_000_000; // 100MB
    public let USER__MIN_BALANCE = 100_000_000_000; // 0.1T cycles
    public let USER__TOP_UP_AMOUNT = 100_000_000_000; // 0.1T cycles

    public let WORKSPACE__CAPACITY = 200_000_000_000; // 0.2T cycles
    public let WORKSPACE__COMPUTE_ALLOCATION = 0; // 0% of maximum compute power that a single canister can allocate
    public let WORKSPACE__FREEZING_THRESHOLD = 2592000; // 30 days
    public let WORKSPACE__INITIAL_CYCLES_BALANCE = WORKSPACE__CAPACITY;
    public let WORKSPACE__MEMORY_ALLOCATION = 100_000_000; // 100MB
    public let WORKSPACE__MIN_BALANCE = 100_000_000_000; // 0.1T cycles
    public let WORKSPACE__TOP_UP_AMOUNT = 100_000_000_000; // 0.1T cycles

    public let USER_INDEX__MIN_BALANCE = 200_000_000_000; // 0.2T cycle
    public let USER_INDEX__TOP_UP_AMOUNT = 100_000_000_000; // 2.0T cycles

    public let WORKSPACE_INDEX__MIN_BALANCE = 200_000_000_000; // 0.2T cycle
    public let WORKSPACE_INDEX__TOP_UP_AMOUNT = 100_000_000_000; // 2.0T cycles
};
