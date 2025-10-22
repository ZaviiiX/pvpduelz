// config.js - OPTIMIZED FOR PRODUCTION WITH RATE LIMITING
module.exports = {
    tokens: {
        tokenA: {
            name: "Solana",
            symbol: "SOL",
            address: "So11111111111111111111111111111111111111112",
            chain: "solana",
            isMock: false,
            icon: "/images/solana_logo.png"
        },
        tokenB: {
            name: "BNB",
            symbol: "BNB",
            address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            chain: "bsc",
            isMock: false,
            icon: "/images/bnb_logo.png"
        }
    },

    game: {
        maxHealth: 100,
        roundsToWin: 3,
        damageMultiplier: 8,
        minMcDiffForAttack: 0.10,      // 0.10% = samo veće promene
        battleInterval: 8000,           // 8s - battle check frequency

        // 🆕 OPTIMIZED FOR PRODUCTION
        // Free tier APIs imaju rate limits, pa je bolje da zovemo ređe
        marketDataInterval: 10000,      // 🔄 10s umjesto 5s (6 poziva/min umjesto 12)
        // Alternativno možeš koristiti:
        // marketDataInterval: 15000,   // 15s = 4 poziva/min (ultra safe za free tier)

        attackCooldown: 13000,          // 13s - vrijeme između napada
    },

    mock: {
        enabled: false,     // ✅ Production = false
        manualMode: false,
        volatility: 1.5,
        autoTrends: false
    }
};