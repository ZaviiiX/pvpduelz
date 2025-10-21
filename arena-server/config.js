// config.js - BALANCED FOR VIDEO SEQUENCES
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
        minMcDiffForAttack: 0.10,      // 🎯 0.10% = samo veće promene
        battleInterval: 8000,        // 8s
        marketDataInterval: 5000,    // 5s
        attackCooldown: 13000,
    },


    mock: {
        enabled: false,
        manualMode: false,
        volatility: 1.5,
        autoTrends: false
    }
};
