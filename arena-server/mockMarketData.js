// mockMarketData.js - SA MANUAL MODE
const config = require('./config');

class MockMarketDataService {
    constructor() {
        this.cache = {
            tokenA: {
                marketCap: 5_000_000,
                price: 0.05,
                priceChange24h: 0,
                volume24h: 500_000,
                lastUpdate: Date.now()
            },
            tokenB: {
                marketCap: 8_000_000,
                price: 0.08,
                priceChange24h: 0,
                volume24h: 800_000,
                lastUpdate: Date.now()
            }
        };

        this.trends = {
            tokenA: 'neutral',
            tokenB: 'neutral'
        };

        this.volatility = config.mock.volatility || 0.5;
        this.manualMode = config.mock.manualMode || false;
    }

    // 🎲 RANDOM MARKET SIMULATION
    simulateMarketMovement(token) {
        const data = this.cache[token];
        const trend = this.trends[token];

        // ✅ MANUAL MODE - Ne menja se automatski!
        if (this.manualMode) {
            console.log(`⏸️  Manual mode - ${token} MC frozen at $${(data.marketCap / 1e6).toFixed(2)}M`);
            return data;
        }

        // Auto simulation (samo ako nije manual mode)
        let mcChangePercent = (Math.random() - 0.5) * 2 * this.volatility;

        if (trend === 'pumping') {
            mcChangePercent += 0.3;
        } else if (trend === 'dumping') {
            mcChangePercent -= 0.3;
        }

        if (Math.random() < 0.1 && config.mock.autoTrends) {
            const trends = ['neutral', 'pumping', 'dumping'];
            this.trends[token] = trends[Math.floor(Math.random() * trends.length)];
            console.log(`📊 ${token} trend changed to: ${this.trends[token]}`);
        }

        const mcChange = data.marketCap * (mcChangePercent / 100);
        data.marketCap = Math.max(100_000, data.marketCap + mcChange);

        const priceChangePercent = mcChangePercent + (Math.random() - 0.5) * 0.5;
        data.price = Math.max(0.001, data.price * (1 + priceChangePercent / 100));

        data.priceChange24h = data.priceChange24h * 0.9 + mcChangePercent * 0.1;
        data.volume24h = data.marketCap * (0.1 + Math.random() * 0.4);
        data.lastUpdate = Date.now();

        return data;
    }

    async fetchMarketData() {
        await new Promise(resolve => setTimeout(resolve, 100));

        const tokenAData = this.simulateMarketMovement('tokenA');
        const tokenBData = this.simulateMarketMovement('tokenB');

        if (!this.manualMode) {
            console.log('📊 Mock Market Update:');
            console.log(`  ${config.tokens.tokenA.symbol}: MC=$${(tokenAData.marketCap / 1e6).toFixed(2)}M | Price=$${tokenAData.price.toFixed(6)} | 24h: ${tokenAData.priceChange24h.toFixed(2)}% | Trend: ${this.trends.tokenA}`);
            console.log(`  ${config.tokens.tokenB.symbol}: MC=$${(tokenBData.marketCap / 1e6).toFixed(2)}M | Price=$${tokenBData.price.toFixed(6)} | 24h: ${tokenBData.priceChange24h.toFixed(2)}% | Trend: ${this.trends.tokenB}`);
        }

        return {
            tokenA: tokenAData,
            tokenB: tokenBData
        };
    }

    getCache() {
        return this.cache;
    }

    // 🎮 MANUAL CONTROLS
    forcePump(token, intensity = 1) {
        const data = this.cache[token];
        const changePercent = 0.5 * intensity;
        data.marketCap *= (1 + changePercent / 100);
        data.price *= (1 + changePercent / 100);
        data.priceChange24h = changePercent;
        data.lastUpdate = Date.now();
        console.log(`📈 MANUAL PUMP: ${token} +${changePercent.toFixed(2)}% | New MC: $${(data.marketCap / 1e6).toFixed(2)}M`);
    }

    forceDump(token, intensity = 1) {
        const data = this.cache[token];
        const changePercent = -0.5 * intensity;
        data.marketCap *= (1 + changePercent / 100);
        data.price *= (1 + changePercent / 100);
        data.priceChange24h = changePercent;
        data.lastUpdate = Date.now();
        console.log(`📉 MANUAL DUMP: ${token} ${changePercent.toFixed(2)}% | New MC: $${(data.marketCap / 1e6).toFixed(2)}M`);
    }

    setTrend(token, trend) {
        this.trends[token] = trend;
        console.log(`🎯 ${token} trend set to: ${trend}`);
    }

    setVolatility(value) {
        this.volatility = Math.max(0, Math.min(1, value));
        console.log(`🌊 Volatility set to: ${this.volatility}`);
    }

    toggleManualMode() {
        this.manualMode = !this.manualMode;
        console.log(`🎮 Manual mode: ${this.manualMode ? 'ON' : 'OFF'}`);
        return this.manualMode;
    }

    reset() {
        this.cache = {
            tokenA: {
                marketCap: 5_000_000,
                price: 0.05,
                priceChange24h: 0,
                volume24h: 500_000,
                lastUpdate: Date.now()
            },
            tokenB: {
                marketCap: 8_000_000,
                price: 0.08,
                priceChange24h: 0,
                volume24h: 800_000,
                lastUpdate: Date.now()
            }
        };
        this.trends = { tokenA: 'neutral', tokenB: 'neutral' };
        console.log('🔄 Mock market data reset');
    }
}

module.exports = new MockMarketDataService();
