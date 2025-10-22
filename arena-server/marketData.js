// marketData.js - OPTIMIZED FOR CUSTOM SMALL CAP TOKENS (Pump.fun + BNB)
const config = require('./config');

class MarketDataService {
    constructor() {
        // 🔥 CUSTOM TOKEN DEFAULTS (smaller market caps)
        this.cache = {
            tokenA: {
                marketCap: 100_000,      // 100K default za novi pump.fun token
                price: 0.0001,
                priceChange24h: 0,
                volume24h: 10_000,
                lastUpdate: Date.now(),
                source: 'initial'
            },
            tokenB: {
                marketCap: 100_000,      // 100K default za custom BNB token
                price: 0.0001,
                priceChange24h: 0,
                volume24h: 10_000,
                lastUpdate: Date.now(),
                source: 'initial'
            }
        };

        // Backup last valid data
        this.lastValidData = {
            tokenA: null,
            tokenB: null
        };

        // 🔥 Rate limiting (aggressive for Pump.fun)
        this.lastApiCall = {
            pumpfun: 0,
            dexscreener: 0
        };

        this.rateLimits = {
            pumpfun: 800,        // 800ms between calls (fast updates!)
            dexscreener: 500     // 500ms
        };

        // Failure tracking
        this.failureCount = {
            tokenA: 0,
            tokenB: 0
        };
        this.consecutiveFailures = 0;

        // 🔥 SHORTER cache age for volatile tokens
        this.maxCacheAge = 30000;  // 30s (instead of 2 min) - custom tokens change fast!
        this.maxStaleAge = 120000; // 2 min max stale

        console.log('🎯 Market Data Service initialized for CUSTOM TOKENS');
        console.log(`   Token A (${config.tokens.tokenA.symbol}): Pump.fun`);
        console.log(`   Token B (${config.tokens.tokenB.symbol}): BNB Chain`);
        console.log(`   Cache duration: ${this.maxCacheAge/1000}s (fast refresh)`);
    }

    // 🔥 VALIDATE DATA (for small cap tokens)
    isValidData(data) {
        if (!data) {
            console.warn('⚠️ Data is null/undefined');
            return false;
        }

        // Allow small market caps (even $100)
        if (!data.marketCap || data.marketCap < 0 || isNaN(data.marketCap)) {
            console.warn('⚠️ Invalid marketCap:', data.marketCap);
            return false;
        }

        // Allow very small prices
        if (data.price === undefined || data.price === null || data.price < 0 || isNaN(data.price)) {
            console.warn('⚠️ Invalid price:', data.price);
            return false;
        }

        // Check for unrealistic values (but higher limit since small caps can be volatile)
        if (data.marketCap > 1e12) { // > 1 trillion (probably error)
            console.warn('⚠️ MarketCap too high:', data.marketCap);
            return false;
        }

        return true;
    }

    // 🔥 SAFE UPDATE
    safeUpdate(tokenKey, newData) {
        if (!this.isValidData(newData)) {
            console.warn(`⚠️ Invalid data for ${tokenKey}, keeping current values`);
            return false;
        }

        // Save as last valid data
        this.lastValidData[tokenKey] = {
            ...newData,
            timestamp: Date.now()
        };

        // Update cache
        this.cache[tokenKey] = {
            ...newData,
            lastUpdate: Date.now()
        };

        // Reset failure count on success
        this.failureCount[tokenKey] = 0;
        this.consecutiveFailures = 0;

        return true;
    }

    // 🔥 GET FALLBACK DATA
    getFallbackData(tokenKey, symbol) {
        // 1. Try last valid data
        if (this.lastValidData[tokenKey]) {
            const age = Date.now() - this.lastValidData[tokenKey].timestamp;
            console.warn(`📦 Using cached data for ${symbol} (age: ${(age/1000).toFixed(0)}s)`);
            return {
                ...this.lastValidData[tokenKey],
                source: this.lastValidData[tokenKey].source + '+cached'
            };
        }

        // 2. Use current cache
        if (this.cache[tokenKey] && this.cache[tokenKey].marketCap >= 0) {
            const age = Date.now() - this.cache[tokenKey].lastUpdate;
            console.warn(`📦 Using stale cache for ${symbol} (age: ${(age/1000).toFixed(0)}s)`);
            return {
                ...this.cache[tokenKey],
                source: this.cache[tokenKey].source + '+stale'
            };
        }

        // 3. Return minimal default
        console.warn(`⚠️ Using minimal default for ${symbol}`);
        return {
            marketCap: 100_000,
            price: 0.0001,
            priceChange24h: 0,
            volume24h: 10_000,
            source: 'default'
        };
    }

    // 🔥 RATE LIMIT CHECK
    canCallApi(apiName) {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall[apiName];

        if (timeSinceLastCall < this.rateLimits[apiName]) {
            return false;
        }

        return true;
    }

    updateApiCallTime(apiName) {
        this.lastApiCall[apiName] = Date.now();
    }

    // ⚡ PUMP.FUN V3 API (MAIN SOURCE)
    async fetchFromPumpFun(tokenMint) {
        if (!this.canCallApi('pumpfun')) return null;

        try {
            this.updateApiCallTime('pumpfun');

            const response = await fetch(
                `https://frontend-api-v3.pump.fun/coins/${tokenMint}`,
                {
                    timeout: 5000,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data) {
                const marketCap = parseFloat(data.usd_market_cap) || 0;
                const totalSupply = parseFloat(data.total_supply) || 1;
                const price = marketCap > 0 ? marketCap / totalSupply : 0;
                const volume24h = parseFloat(data.volume_24h) || 0;
                const priceChange24h = parseFloat(data.price_change_percentage_24h) || 0;

                console.log(`✅ Pump.fun: MC=$${this.formatMC(marketCap)}, Price=$${price.toFixed(8)}`);

                return {
                    price,
                    marketCap,
                    volume24h,
                    priceChange24h,
                    source: 'pump.fun'
                };
            }

            return null;
        } catch (error) {
            console.log(`⚠️ Pump.fun error: ${error.message}`);
            return null;
        }
    }

    // ⚡ DEXSCREENER (FALLBACK FOR BOTH CHAINS)
    async fetchFromDexScreener(tokenAddress, chain) {
        if (!this.canCallApi('dexscreener')) return null;

        try {
            this.updateApiCallTime('dexscreener');

            const response = await fetch(
                `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
                {
                    timeout: 5000,
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) return null;

            const data = await response.json();

            if (data.pairs && data.pairs.length > 0) {
                // Filter by chain
                let chainPairs = data.pairs.filter(pair => {
                    if (chain === 'solana') return pair.chainId === 'solana';
                    if (chain === 'bsc') return pair.chainId === 'bsc';
                    return true;
                });

                // Sort by liquidity
                chainPairs.sort((a, b) => {
                    const liqA = parseFloat(a.liquidity?.usd || 0);
                    const liqB = parseFloat(b.liquidity?.usd || 0);
                    return liqB - liqA;
                });

                const pair = chainPairs[0] || data.pairs[0];

                let marketCap = parseFloat(pair.fdv) || parseFloat(pair.marketCap) || 0;
                const price = parseFloat(pair.priceUsd) || 0;
                const priceChange24h = parseFloat(pair.priceChange?.h24) || 0;
                const volume24h = parseFloat(pair.volume?.h24) || 0;

                // Estimate MC from liquidity if needed
                if (marketCap === 0) {
                    const liquidity = parseFloat(pair.liquidity?.usd || 0);
                    if (liquidity > 0) {
                        // More conservative estimate for small caps
                        marketCap = liquidity * 200;
                    }
                }

                console.log(`✅ DexScreener: MC=$${this.formatMC(marketCap)}, Price=$${price.toFixed(8)}`);

                return {
                    price,
                    priceChange24h,
                    marketCap,
                    volume24h,
                    source: 'dexscreener'
                };
            }

            return null;
        } catch (error) {
            console.log(`⚠️ DexScreener error: ${error.message}`);
            return null;
        }
    }

    // 🔥 SMART FETCH FOR CUSTOM TOKENS
    async fetchTokenData(tokenAddress, chain, symbol, tokenKey) {
        console.log(`\n🔍 Fetching ${symbol} (${chain})...`);

        let data = null;

        // Check cache age
        const cacheAge = Date.now() - this.cache[tokenKey].lastUpdate;
        const isCacheFresh = cacheAge < this.maxCacheAge;

        // If cache is fresh and we're having issues, use it
        if (isCacheFresh && this.consecutiveFailures > 2) {
            console.log(`📦 Using fresh cache (age: ${(cacheAge/1000).toFixed(0)}s)`);
            return this.cache[tokenKey];
        }

        // PRIORITY 1: Pump.fun for Solana tokens
        if (chain === 'solana') {
            data = await this.fetchFromPumpFun(tokenAddress);

            if (this.isValidData(data)) {
                console.log(`✅ ${symbol}: Using Pump.fun data`);
                this.safeUpdate(tokenKey, data);
                return data;
            }
        }

        // PRIORITY 2: DexScreener (works for both chains)
        data = await this.fetchFromDexScreener(tokenAddress, chain);

        if (this.isValidData(data)) {
            console.log(`✅ ${symbol}: Using DexScreener data`);
            this.safeUpdate(tokenKey, data);
            return data;
        }

        // FALLBACK: Use cached data
        console.warn(`❌ All sources failed for ${symbol}`);
        this.failureCount[tokenKey]++;
        this.consecutiveFailures++;

        return this.getFallbackData(tokenKey, symbol);
    }

    // 🔥 MAIN FETCH METHOD
    async fetchMarketData() {
        console.log('\n⚡ ═══════════════════════════════════════════');
        console.log('⚡ FETCHING CUSTOM TOKEN DATA');
        console.log('⚡ ═══════════════════════════════════════════');

        // Fetch both tokens
        const tokenAData = await this.fetchTokenData(
            config.tokens.tokenA.address,
            config.tokens.tokenA.chain,
            config.tokens.tokenA.symbol,
            'tokenA'
        );

        const tokenBData = await this.fetchTokenData(
            config.tokens.tokenB.address,
            config.tokens.tokenB.chain,
            config.tokens.tokenB.symbol,
            'tokenB'
        );

        // Log results
        console.log('\n📊 ═══════════════════════════════════════════');
        console.log('📊 MARKET UPDATE COMPLETE');
        console.log('📊 ═══════════════════════════════════════════');
        console.log(`  ${config.tokens.tokenA.symbol}:`);
        console.log(`    MC: $${this.formatMC(this.cache.tokenA.marketCap)}`);
        console.log(`    Price: $${this.cache.tokenA.price.toFixed(8)}`);
        console.log(`    24h: ${this.cache.tokenA.priceChange24h >= 0 ? '+' : ''}${this.cache.tokenA.priceChange24h.toFixed(2)}%`);
        console.log(`    Vol: $${this.formatMC(this.cache.tokenA.volume24h)}`);
        console.log(`    Source: ${this.cache.tokenA.source}`);
        console.log(`    Age: ${((Date.now() - this.cache.tokenA.lastUpdate)/1000).toFixed(0)}s`);

        console.log(`  ${config.tokens.tokenB.symbol}:`);
        console.log(`    MC: $${this.formatMC(this.cache.tokenB.marketCap)}`);
        console.log(`    Price: $${this.cache.tokenB.price.toFixed(8)}`);
        console.log(`    24h: ${this.cache.tokenB.priceChange24h >= 0 ? '+' : ''}${this.cache.tokenB.priceChange24h.toFixed(2)}%`);
        console.log(`    Vol: $${this.formatMC(this.cache.tokenB.volume24h)}`);
        console.log(`    Source: ${this.cache.tokenB.source}`);
        console.log(`    Age: ${((Date.now() - this.cache.tokenB.lastUpdate)/1000).toFixed(0)}s`);
        console.log(`  Failures: ${this.consecutiveFailures}`);
        console.log('═══════════════════════════════════════════\n');

        return {
            tokenA: this.cache.tokenA,
            tokenB: this.cache.tokenB
        };
    }

    formatMC(mc) {
        if (mc >= 1e9) return `${(mc/1e9).toFixed(2)}B`;
        if (mc >= 1e6) return `${(mc/1e6).toFixed(2)}M`;
        if (mc >= 1e3) return `${(mc/1e3).toFixed(2)}K`;
        return `${mc.toFixed(0)}`;
    }

    getCache() {
        return this.cache;
    }

    reset() {
        this.cache = {
            tokenA: {
                marketCap: 100_000,
                price: 0.0001,
                priceChange24h: 0,
                volume24h: 10_000,
                lastUpdate: Date.now(),
                source: 'initial'
            },
            tokenB: {
                marketCap: 100_000,
                price: 0.0001,
                priceChange24h: 0,
                volume24h: 10_000,
                lastUpdate: Date.now(),
                source: 'initial'
            }
        };
        this.lastValidData = { tokenA: null, tokenB: null };
        this.failureCount = { tokenA: 0, tokenB: 0 };
        this.consecutiveFailures = 0;
        console.log('🔄 Market data cache reset');
    }
}

module.exports = new MarketDataService();