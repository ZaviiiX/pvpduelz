// config.js - MOCK TEST CONFIG
module.exports = {
    tokens: {
        tokenA: {
            name: "Solana Killer",
            symbol: "SOLKILL",
            address: "0xMOCK_TOKEN_A",
            chain: "bsc",
            isMock: true,
            icon: "/images/solana_logo.png"  // ✅ DODAJ OVO
        },
        tokenB: {
            name: "Pump Fun Supreme",
            symbol: "PUMPSUP",
            address: "0xMOCK_TOKEN_B",
            chain: "solana",
            isMock: true,
            icon: "/images/bnb_logo.png"     // ✅ DODAJ OVO
        }
    },

    game: {
        maxHealth: 100,
        roundsToWin: 3,
        damageMultiplier: 12,
        minMcDiffForAttack: 0.08,
        battleInterval: 4000,
        marketDataInterval: 3000
    },

    mock: {
        enabled: true,
        manualMode: true,
        volatility: 0.5,
        autoTrends: false
    }
};
