// Stablecoin and payment metrics data
// Sources cited inline with dates

export const metricsData = {
  // Stablecoin Transaction Count by Blockchain (in billions)
  // Source: Visa Onchain Analytics / Allium - Stablecoin Transaction Sizes
  // https://visaonchainanalytics.com/
  txCountByChain: [
    {
      chain: 'Solana',
      under100: 2.0,      // < $100
      to1k: 2.5,          // $100 - $1k
      to10k: 2.0,         // $1k - $10k
      to100k: 0.5,        // $10k - $100k
      to1m: 0.3,          // $100k - $1M
      to10m: 0.15,        // $1M - $10M
      over10m: 0.05,      // > $10M
      total: 7.5
    },
    {
      chain: 'Tron',
      under100: 0.5,
      to1k: 0.8,
      to10k: 1.0,
      to100k: 0.4,
      to1m: 0.2,
      to10m: 0.08,
      over10m: 0.02,
      total: 3.0
    },
    {
      chain: 'Polygon',
      under100: 0.4,
      to1k: 0.5,
      to10k: 0.6,
      to100k: 0.25,
      to1m: 0.15,
      to10m: 0.07,
      over10m: 0.03,
      total: 2.0
    },
    {
      chain: 'Base',
      under100: 0.3,
      to1k: 0.4,
      to10k: 0.4,
      to100k: 0.2,
      to1m: 0.12,
      to10m: 0.05,
      over10m: 0.03,
      total: 1.5
    },
    {
      chain: 'Arbitrum',
      under100: 0.2,
      to1k: 0.25,
      to10k: 0.3,
      to100k: 0.12,
      to1m: 0.08,
      to10m: 0.03,
      over10m: 0.02,
      total: 1.0
    },
    {
      chain: 'Ethereum',
      under100: 0.15,
      to1k: 0.2,
      to10k: 0.3,
      to100k: 0.15,
      to1m: 0.1,
      to10m: 0.06,
      over10m: 0.04,
      total: 1.0
    },
  ],

  // Solana Stablecoin Stats
  // Source: Alchemy - The Stablecoin Landscape, 2025
  // https://www.alchemy.com/blog/the-stablecoin-landscape-across-different-chains
  solanaStablecoinStats: {
    circulatingSupply: '$16B+',
    circulatingSupplyKo: '160억 달러+',
    thirtyDayVolume: '$500B',
    thirtyDayVolumeKo: '5,000억 달러',
    dailyVolume: '$10B',
    dailyVolumeKo: '100억 달러',
    growthRate: '+170%',
  },

  // Daily Active Addresses for Stablecoin Transfers (sample)
  // Source: Visa Onchain Analytics patterns, approximate
  dailyActiveAddresses: [
    { day: 'Mon', solana: 1850000, ethereum: 420000 },
    { day: 'Tue', solana: 1920000, ethereum: 450000 },
    { day: 'Wed', solana: 2100000, ethereum: 480000 },
    { day: 'Thu', solana: 1980000, ethereum: 460000 },
    { day: 'Fri', solana: 2250000, ethereum: 510000 },
    { day: 'Sat', solana: 1750000, ethereum: 380000 },
    { day: 'Sun', solana: 1680000, ethereum: 350000 },
  ],

  // Transaction Cost Comparison (USD per transaction)
  // Source: Various blockchain documentation, January 2024
  txCostComparison: [
    { chain: 'Solana', cost: 0.00025, color: '#7C3AED' },
    { chain: 'Tron', cost: 0.001, color: '#F87171' },
    { chain: 'Base', cost: 0.002, color: '#60A5FA' },
    { chain: 'Polygon', cost: 0.01, color: '#C4B5FD' },
    { chain: 'Arbitrum', cost: 0.03, color: '#7DD3FC' },
    { chain: 'Ethereum', cost: 2.5, color: '#94A3B8' },
  ],

  // Global Stablecoin Market Overview
  // Source: Visa Onchain Analytics (All-time aggregates)
  // https://visaonchainanalytics.com/
  globalStats: {
    totalVolume: '$47.0T',
    totalVolumeKo: '47조 달러',
    adjustedVolume: '$10.4T',
    adjustedVolumeKo: '10.4조 달러',
    totalTransactions: '10.9B',
    totalTransactionsKo: '109억건',
    activeAddresses: '316M',
    activeAddressesKo: '3.16억',
  },

  // Speed comparison (practical finality time in seconds)
  // Source: Chainspect.app, blockchain documentation (2025)
  // Note: Shows "soft" finality for practical payment use cases
  // L2s have fast soft finality but 7-day withdrawal to L1
  speedComparison: [
    { chain: 'Solana', finality: 0.5 },      // User-perceived, full: ~13s
    { chain: 'Arbitrum', finality: 0.25 },   // Soft finality (L1 withdrawal: 7 days)
    { chain: 'Base', finality: 2 },          // Soft finality (L1 withdrawal: 7 days)
    { chain: 'Polygon', finality: 5 },       // Post-Heimdall v2 (mid-2025)
    { chain: 'Ethereum', finality: 12 },     // Block time (full finality: 12-15 min)
    { chain: 'Tron', finality: 3 },          // DPoS consensus
  ],

  // TPS data over time (sample)
  // Source: Solana Explorer historical patterns
  throughput: [
    { time: '00:00', tps: 2500 },
    { time: '04:00', tps: 2100 },
    { time: '08:00', tps: 3200 },
    { time: '12:00', tps: 4100 },
    { time: '16:00', tps: 3800 },
    { time: '20:00', tps: 3400 },
    { time: '24:00', tps: 2800 },
  ],

  // Solana network stats
  // Source: Solana Documentation, 2025
  // Note: These are commonly cited values with important caveats
  solanaStats: {
    // TPS varies by measurement method (vote tx inclusion) and network conditions
    avgTps: '1,000+ TPS',
    peakTps: '65,000+ (theoretical)',
    // 400ms is slot/block time, NOT finality
    // Full finality (finalized) is ~32 slots after confirmed = ~12-13 seconds
    slotTime: '~400ms',
    finality: '~12-13s',
    // Base fee is 5,000 lamports per signature
    // USD value varies with SOL price and priority fees
    baseFee: '5,000 lamports/sig',
  },
}
