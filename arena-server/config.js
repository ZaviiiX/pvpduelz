// config.js - OPTIMIZED FOR CUSTOM PUMP.FUN + BNB TOKENS
module.exports = {
    tokens: {
        tokenA: {
          'name': 'SOL Token',
          'symbol': 'SOL',
          'address': 'FxtGCy79AK9BosEm6NQGddy6Vwmar4vG4nArBqhxpump',
          'chain': 'solana'
},
        tokenB: {
          'name': 'BNB Token',
          'symbol': 'BNB',
          'address': '0x444425ab9a35b32e0f6b18cf1266d39f760e2640',
          'chain': 'bsc'
}
    },

    game: {
        maxHealth: 100,
        roundsToWin: 3,

        // 🔥 OPTIMIZED FOR SMALL CAP TOKENS
        damageMultiplier: 5,            // Manji damage za volatilnije tokene
        minMcDiffForAttack: 0.15,       // 0.15% = manje osetljivo na male promene

        battleInterval: 8000,            // 8s battle check
        marketDataInterval: 8000,        // 8s - BRŽE za pump.fun (brze promene!)
        attackCooldown: 13000,           // 13s cooldown
    },

    mock: {
        enabled: false,     // ✅ Production = false
        manualMode: false,
        volatility: 1.5,
        autoTrends: false
    }
};
