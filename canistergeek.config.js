const MEMORY_MAX_PER_CANISTER = 2 * 1024 * 1024 * 1024; // 2Gb

const config = {
  canisters: [
    {
      canisterId: 'bkyz2-fmaaa-aaaaa-qaaaq-cai',
      name: 'cycles_dispenser',
    },
    {
      canisterId: 'br5f7-7uaaa-aaaaa-qaaca-cai',
      name: 'user_index',
    },
    {
      canisterId: 'bw4dl-smaaa-aaaaa-qaacq-cai',
      name: 'workspace_index',
    },
    {
      canisterId: 'e3mmv-5qaaa-aaaah-aadma-cai',
      name: 'assetCanister',
      metricsSource: ['blackhole'],
    },
  ],
  metrics: {
    cycles: {
      metricsFormat: 'cyclesShort',
      thresholds: {
        // indicator color based on cycles value
        base: {
          colorHex: 'red',
        },
        steps: [
          {
            value: 300_000_000_000, // 0.3T cycles
            colorHex: 'darkorange',
          },
          {
            value: 700_000_000_000, // 0.7T cycles
            colorHex: 'green',
          },
        ],
      },
      predictionThresholds: {
        // How fast cycles in the canister will run out (in days)
        base: {
          colorHex: 'red',
        },
        steps: [
          {
            value: 30, // 30 days
            colorHex: 'darkorange',
          },
          {
            value: 90, // 90 days
            colorHex: 'green',
          },
        ],
      },
    },
    memory: {
      metricsFormat: 'memoryShort',
      thresholds: {
        // indicator color based on memory value
        base: {
          colorHex: 'red',
        },
        steps: [
          {
            value: 1, // 1 byte
            colorHex: 'green',
          },
          {
            value: 300 * 1024 * 1024, // 300 Mb
            colorHex: 'darkorange',
          },
          {
            value: 400 * 1024 * 1024, // 400 Mb
            colorHex: 'red',
          },
        ],
      },
      predictionThresholds: {
        // How fast the canister will run out of memory (in days)
        base: {
          colorHex: 'red',
        },
        steps: [
          {
            value: 30, // 30 days
            colorHex: 'darkorange',
          },
          {
            value: 90, // 90 days
            colorHex: 'green',
          },
        ],
      },
      limitations: {
        hourly: {
          maxValue: MEMORY_MAX_PER_CANISTER,
          percentFromMaxMinValue: 5,
        },
      },
    },
    heapMemory: {
      metricsFormat: 'memoryShort',
      thresholds: {
        // indicator color based on heap memory value
        base: {
          colorHex: 'red',
        },
        steps: [
          {
            value: 1, //1 byte
            colorHex: 'green',
          },
          {
            value: 300 * 1024 * 1024, //300 Mb
            colorHex: 'darkorange',
          },
          {
            value: 400 * 1024 * 1024, //400 Mb
            colorHex: 'red',
          },
        ],
      },
      limitations: {
        hourly: {
          maxValue: MEMORY_MAX_PER_CANISTER,
          percentFromMaxMinValue: 5,
        },
      },
    },
  },
};

console.log(JSON.stringify(config, null, 2));
