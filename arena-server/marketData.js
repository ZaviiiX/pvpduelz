// marketData.js - FIXED VERSION WITH PROPER CACHING
const config = require('./config');

class MarketDataService {
    constructor() {
        // 🆕 Cache with default values (not 0!)
        this.cache = {
            tokenA: {
                marketCap: config.tokens.tokenA.symbol === 'SOL' ? 90_000_000_000 : 5_000_000,
                price: config.tokens.tokenA.symbol === 'SOL' ? 150 : 0.05,
                priceChange24h: 0,
                volume24h: 0,
                lastUpdate: Date.now(),
                source: 'initial'
            },
            tokenB: {
                marketCap: config.tokens.tokenB.symbol === 'BNB' ? 85_000_000_000 : 8_000_000,
                price: config.tokens.tokenB.symbol === 'BNB' ? 550 : 0.08,
                priceChange24h: 0,
                volume24h: 0,
                lastUpdate: Date.now(),
                source: 'initial'
            }
        };

        this.baseMC = {
            SOL: 90_000_000_000,
            BNB: 85_000_000_000,
            ETH: 400_000_000_000,
            USDT: 120_000_000_000
        };

        // 🆕 Rate limiting tracking
        this.lastApiCall = {
            pumpfun: 0,
            jupiter: 0,
            coingecko: 0,
            dexscreener: 0
        };

        this.rateLimits = {
            pumpfun: 1000,      // 1s between calls
            jupiter: 600,       // 600ms
            coingecko: 1500,    // 1.5s (safer for free tier)
            dexscreener: 500    // 500ms
        };

        // 🆕 Failure tracking for exponential backoff
        this.failureCount = {
            tokenA: 0,
            tokenB: 0
        };

        // 🆕 Cache age tracking
        this.maxCacheAge = 60000; // 60s - after this, force new fetch even on error
    }

    // 🆕 RATE LIMIT CHECK
    canCallApi(apiName) {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall[apiName];

        if (timeSinceLastCall < this.rateLimits[apiName]) {
            const waitTime = this.rateLimits[apiName] - timeSinceLastCall;
            console.log(`⏳ Rate limit: ${apiName} needs ${waitTime}ms wait`);
            return false;
        }

        return true;
    }

    // 🆕 UPDATE API CALL TIMESTAMP
    updateApiCallTime(apiName) {
        this.lastApiCall[apiName] = Date.now();
    }

    // ⚡ PUMP.FUN V3 API
    async fetchFromPumpFun(tokenMint) {
        if (!this.canCallApi('pumpfun')) return null;

        try {
            console.log(`🚀 Fetching from Pump.fun v3: ${tokenMint.slice(0, 8)}...`);
            this.updateApiCallTime('pumpfun');

            const response = await fetch(
                `https://frontend-api-v3.pump.fun/coins/${tokenMint}`,
                { timeout: 5000 }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data) {
                const marketCap = parseFloat(data.usd_market_cap) || 0;
                const price = marketCap > 0 && data.total_supply
                    ? marketCap / parseFloat(data.total_supply)
                    : 0;
                const volume24h = parseFloat(data.volume_24h) || 0;
                let priceChange24h = 0;

                if (data.price_change_percentage_24h) {
                    priceChange24h = parseFloat(data.price_change_percentage_24h);
                }

                console.log(`✅ Pump.fun v3: MC=$${(marketCap/1e6).toFixed(2)}M`);

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
            console.log(`⚠️ Pump.fun v3 error: ${error.message}`);
            return null;
        }
    }

    // ⚡ JUPITER API
    async fetchFromJupiter(symbol = 'SOL') {
        if (!this.canCallApi('jupiter')) return null;

        try {
            console.log(`⚡ Fetching from Jupiter: ${symbol}...`);
            this.updateApiCallTime('jupiter');

            const response = await fetch(
                `https://price.jup.ag/v4/price?ids=${symbol}`,
                { timeout: 5000 }
            );
            const data = await response.json();

            const price = data.data?.[symbol]?.price;
            if (price) {
                console.log(`✅ Jupiter: ${symbol} = $${price.toFixed(2)}`);
                return { price, source: 'jupiter' };
            }
            return null;
        } catch (error) {
            console.log(`⚠️ Jupiter error: ${error.message}`);
            return null;
        }
    }

    // ⚡ COINGECKO
    async fetchFromCoinGecko(coinId) {
        if (!this.canCallApi('coingecko')) return null;

        try {
            console.log(`🦎 Fetching from CoinGecko: ${coinId}...`);
            this.updateApiCallTime('coingecko');

            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
                { timeout: 5000 }
            );
            const data = await response.json();

            if (data[coinId]) {
                console.log(`✅ CoinGecko: ${coinId} = $${data[coinId].usd.toFixed(2)}`);
                return {
                    price: data[coinId].usd,
                    priceChange24h: data[coinId].usd_24h_change || 0,
                    marketCap: data[coinId].usd_market_cap || 0,
                    volume24h: data[coinId].usd_24h_vol || 0,
                    source: 'coingecko'
                };
            }
            return null;
        } catch (error) {
            console.log(`⚠️ CoinGecko error: ${error.message}`);
            return null;
        }
    }

    // ⚡ DEXSCREENER
    async fetchFromDexScreener(tokenAddress, chain) {
        if (!this.canCallApi('dexscreener')) return null;

        try {
            console.log(`🔍 Fetching from DexScreener: ${tokenAddress.slice(0, 8)}...`);
            this.updateApiCallTime('dexscreener');

            const response = await fetch(
                `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
                { timeout: 5000 }
            );

            if (!response.ok) return null;

            const data = await response.json();

            if (data.pairs && data.pairs.length > 0) {
                let chainPairs = data.pairs.filter(pair => {
                    if (chain === 'solana') return pair.chainId === 'solana';
                    if (chain === 'bsc') return pair.chainId === 'bsc';
                    return true;
                });

                chainPairs.sort((a, b) => {
                    const liqA = parseFloat(a.liquidity?.usd || 0);
                    const liqB = parseFloat(b.liquidity?.usd || 0);
                    return liqB - liqA;
                });

                const pair = chainPairs[0] || data.pairs[0];
                let marketCap = parseFloat(pair.fdv) || parseFloat(pair.marketCap) || 0;
                const price = parseFloat(pair.priceUsd) || 0;
                const liquidity = parseFloat(pair.liquidity?.usd) || 0;

                if (marketCap === 0 && liquidity > 0) {
                    marketCap = liquidity * 800;
                    console.log(`⚠️ Using liquidity approximation: $${(marketCap/1e6).toFixed(2)}M`);
                }

                if (marketCap === 0) {
                    if (chain === 'solana' && tokenAddress.includes('So1111')) {
                        marketCap = this.baseMC.SOL;
                    } else if (chain === 'bsc' && tokenAddress.includes('bb4CdB')) {
                        marketCap = this.baseMC.BNB;
                    }
                }

                console.log(`✅ DexScreener: MC=$${this.formatMC(marketCap)}`);

                return {
                    price,
                    priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
                    marketCap,
                    volume24h: parseFloat(pair.volume?.h24) || 0,
                    source: 'dexscreener'
                };
            }

            return null;
        } catch (error) {
            console.log(`⚠️ DexScreener error: ${error.message}`);
            return null;
        }
    }

    // 🎯 SMART FETCH WITH BETTER CACHING
    async fetchTokenData(tokenAddress, chain, symbol, tokenKey) {
        let data = null;

        console.log(`\n🔍 Fetching data for ${symbol}...`);

        // 🆕 Check if cache is still fresh
        const cacheAge = Date.now() - this.cache[tokenKey].lastUpdate;
        const isCacheFresh = cacheAge < this.maxCacheAge;

        // PRIORITY 1: Pump.fun v3
        if (chain === 'solana' && !tokenAddress.includes('So1111')) {
            data = await this.fetchFromPumpFun(tokenAddress);
            if (data && data.marketCap > 0) {
                console.log(`✅ Using Pump.fun data for ${symbol}`);
                this.failureCount[tokenKey] = 0; // Reset failure count
                return data;
            }
        }

        // PRIORITY 2: Jupiter + CoinGecko for SOL
        if (symbol === 'SOL' || tokenAddress.includes('So1111')) {
            const jupData = await this.fetchFromJupiter('SOL');
            const cgData = await this.fetchFromCoinGecko('solana');

            if (jupData && cgData) {
                console.log(`✅ Using Jupiter+CoinGecko combo for SOL`);
                this.failureCount[tokenKey] = 0;
                return {
                    price: jupData.price,
                    priceChange24h: cgData.priceChange24h,
                    marketCap: cgData.marketCap,
                    volume24h: cgData.volume24h,
                    source: 'jupiter+coingecko'
                };
            } else if (cgData) {
                console.log(`✅ Using CoinGecko only for SOL`);
                this.failureCount[tokenKey] = 0;
                return cgData;
            } else if (jupData) {
                // Use Jupiter price + cached MC
                console.log(`⚠️ Using Jupiter + cached MC for SOL`);
                return {
                    price: jupData.price,
                    priceChange24h: this.cache[tokenKey].priceChange24h,
                    marketCap: this.cache[tokenKey].marketCap || this.baseMC.SOL,
                    volume24h: this.cache[tokenKey].volume24h,
                    source: 'jupiter+cache'
                };
            }
        }

        // PRIORITY 3: CoinGecko for BNB
        if (symbol === 'BNB' || tokenAddress.includes('bb4CdB')) {
            const cgData = await this.fetchFromCoinGecko('binancecoin');
            if (cgData) {
                console.log(`✅ Using CoinGecko for BNB`);
                this.failureCount[tokenKey] = 0;
                return cgData;
            }
        }

        // PRIORITY 4: DexScreener (fallback)
        data = await this.fetchFromDexScreener(tokenAddress, chain);
        if (data && data.marketCap > 0) {
            console.log(`✅ Using DexScreener for ${symbol}`);
            this.failureCount[tokenKey] = 0;
            return data;
        }

        // 🆕 CRITICAL FIX: Return cached data if available and not too old
        this.failureCount[tokenKey]++;

        if (isCacheFresh) {
            console.warn(`⚠️ All sources failed for ${symbol}, using cached data (age: ${(cacheAge/1000).toFixed(0)}s)`);
            return {
                ...this.cache[tokenKey],
                source: this.cache[tokenKey].source + '+cached'
            };
        } else {
            console.error(`❌ All sources failed for ${symbol} and cache is stale (age: ${(cacheAge/1000).toFixed(0)}s)`);
            console.error(`   Failure count: ${this.failureCount[tokenKey]}`);

            // 🆕 Even if cache is stale, return it if we have no other option
            if (this.cache[tokenKey].marketCap > 0) {
                console.warn(`   Using STALE cache as last resort`);
                return {
                    ...this.cache[tokenKey],
                    source: this.cache[tokenKey].source + '+stale'
                };
            }

            return null;
        }
    }

    // 🚀 MAIN FETCH METHOD
    async fetchMarketData() {
        console.log('\n⚡ ═══════════════════════════════════════════');
        console.log('⚡ FETCHING MARKET DATA (CACHED & SAFE)');
        console.log('⚡ ═══════════════════════════════════════════');

        // TOKEN A
        const tokenAData = await this.fetchTokenData(
            config.tokens.tokenA.address,
            config.tokens.tokenA.chain,
            config.tokens.tokenA.symbol,
            'tokenA'
        );

        if (tokenAData) {
            this.cache.tokenA = {
                ...tokenAData,
                lastUpdate: Date.now()
            };
        }

        // TOKEN B
        const tokenBData = await this.fetchTokenData(
            config.tokens.tokenB.address,
            config.tokens.tokenB.chain,
            config.tokens.tokenB.symbol,
            'tokenB'
        );

        if (tokenBData) {
            this.cache.tokenB = {
                ...tokenBData,
                lastUpdate: Date.now()
            };
        }

        // Log results
        console.log('\n📊 ═══════════════════════════════════════════');
        console.log('📊 MARKET UPDATE COMPLETE');
        console.log('📊 ═══════════════════════════════════════════');
        console.log(`  ${config.tokens.tokenA.symbol}:`);
        console.log(`    MC: $${this.formatMC(this.cache.tokenA.marketCap)}`);
        console.log(`    Price: $${this.cache.tokenA.price.toFixed(6)}`);
        console.log(`    24h: ${this.cache.tokenA.priceChange24h >= 0 ? '+' : ''}${this.cache.tokenA.priceChange24h.toFixed(2)}%`);
        console.log(`    Source: ${this.cache.tokenA.source}`);
        console.log(`    Cache age: ${((Date.now() - this.cache.tokenA.lastUpdate)/1000).toFixed(0)}s`);

        console.log(`  ${config.tokens.tokenB.symbol}:`);
        console.log(`    MC: $${this.formatMC(this.cache.tokenB.marketCap)}`);
        console.log(`    Price: $${this.cache.tokenB.price.toFixed(6)}`);
        console.log(`    24h: ${this.cache.tokenB.priceChange24h >= 0 ? '+' : ''}${this.cache.tokenB.priceChange24h.toFixed(2)}%`);
        console.log(`    Source: ${this.cache.tokenB.source}`);
        console.log(`    Cache age: ${((Date.now() - this.cache.tokenB.lastUpdate)/1000).toFixed(0)}s`);
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
                marketCap: 0,
                price: 0,
                priceChange24h: 0,
                volume24h: 0,
                lastUpdate: Date.now()
            },
            tokenB: {
                marketCap: 0,
                price: 0,
                priceChange24h: 0,
                volume24h: 0,
                lastUpdate: Date.now()
            }
        };
        this.failureCount = { tokenA: 0, tokenB: 0 };
        console.log('🔄 Market data cache reset');
    }
}

module.exports = new MarketDataService();