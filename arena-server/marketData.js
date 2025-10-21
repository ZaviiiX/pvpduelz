// marketData.js - PUMP.FUN V3 ULTRA FAST
const config = require('./config');

class MarketDataService {
    constructor() {
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

        // Base market caps for major tokens
        this.baseMC = {
            SOL: 90_000_000_000,
            BNB: 85_000_000_000
        };
    }

    /**
     * ⚡ PUMP.FUN V3 API - Fastest for Solana tokens
     */
    async fetchFromPumpFun(tokenMint) {
        try {
            console.log(`🚀 Fetching from Pump.fun v3: ${tokenMint.slice(0, 8)}...`);

            const response = await fetch(
                `https://frontend-api-v3.pump.fun/coins/${tokenMint}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data) {
                // Pump.fun v3 response structure
                const marketCap = parseFloat(data.usd_market_cap) || 0;
                const price = marketCap > 0 && data.total_supply
                    ? marketCap / parseFloat(data.total_supply)
                    : 0;
                const volume24h = parseFloat(data.volume_24h) || 0;

                // Calculate 24h change if available
                let priceChange24h = 0;
                if (data.price_change_percentage_24h) {
                    priceChange24h = parseFloat(data.price_change_percentage_24h);
                }

                console.log(`✅ Pump.fun v3:`);
                console.log(`   MC: $${(marketCap/1e6).toFixed(2)}M`);
                console.log(`   Price: $${price.toFixed(8)}`);
                console.log(`   Volume 24h: $${(volume24h/1e3).toFixed(2)}K`);

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

    /**
     * ⚡ JUPITER API - Ultra fast Solana prices
     */
    async fetchFromJupiter(symbol = 'SOL') {
        try {
            console.log(`⚡ Fetching from Jupiter: ${symbol}...`);

            const response = await fetch(`https://price.jup.ag/v4/price?ids=${symbol}`);
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

    /**
     * ⚡ COINGECKO - Fast for major tokens
     */
    async fetchFromCoinGecko(coinId) {
        try {
            console.log(`🦎 Fetching from CoinGecko: ${coinId}...`);

            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
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

    /**
     * ⚡ DEXSCREENER - Fallback
     */
    async fetchFromDexScreener(tokenAddress, chain) {
        try {
            console.log(`🔍 Fetching from DexScreener: ${tokenAddress.slice(0, 8)}...`);

            const response = await fetch(
                `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
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

                // Fallback MC calculation
                if (marketCap === 0 && liquidity > 0) {
                    marketCap = liquidity * 800;
                    console.log(`⚠️ Using liquidity approximation: $${(marketCap/1e6).toFixed(2)}M`);
                }

                // Hardcoded for major tokens
                if (marketCap === 0) {
                    if (chain === 'solana' && tokenAddress.includes('So1111')) {
                        marketCap = this.baseMC.SOL;
                        console.log(`⚠️ Using hardcoded SOL MC: $${(marketCap/1e9).toFixed(2)}B`);
                    } else if (chain === 'bsc' && tokenAddress.includes('bb4CdB')) {
                        marketCap = this.baseMC.BNB;
                        console.log(`⚠️ Using hardcoded BNB MC: $${(marketCap/1e9).toFixed(2)}B`);
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

    /**
     * 🎯 SMART FETCH - Multi-source with priority
     */
    async fetchTokenData(tokenAddress, chain, symbol) {
        let data = null;

        console.log(`\n🔍 Fetching data for ${symbol}...`);

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 1: Pump.fun v3 (fastest for Solana meme tokens)
        // ═══════════════════════════════════════════════════════════
        if (chain === 'solana' && !tokenAddress.includes('So1111')) {
            data = await this.fetchFromPumpFun(tokenAddress);
            if (data && data.marketCap > 0) {
                console.log(`✅ Using Pump.fun data for ${symbol}`);
                return data;
            }
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 2: Jupiter + CoinGecko (fastest for SOL)
        // ═══════════════════════════════════════════════════════════
        if (symbol === 'SOL' || tokenAddress.includes('So1111')) {
            const jupData = await this.fetchFromJupiter('SOL');
            const cgData = await this.fetchFromCoinGecko('solana');

            if (jupData && cgData) {
                console.log(`✅ Using Jupiter+CoinGecko combo for SOL`);
                return {
                    price: jupData.price,
                    priceChange24h: cgData.priceChange24h,
                    marketCap: cgData.marketCap,
                    volume24h: cgData.volume24h,
                    source: 'jupiter+coingecko'
                };
            } else if (cgData) {
                console.log(`✅ Using CoinGecko only for SOL`);
                return cgData;
            }
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 3: CoinGecko for BNB
        // ═══════════════════════════════════════════════════════════
        if (symbol === 'BNB' || tokenAddress.includes('bb4CdB')) {
            const cgData = await this.fetchFromCoinGecko('binancecoin');
            if (cgData) {
                console.log(`✅ Using CoinGecko for BNB`);
                return cgData;
            }
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 4: DexScreener (fallback)
        // ═══════════════════════════════════════════════════════════
        data = await this.fetchFromDexScreener(tokenAddress, chain);
        if (data && data.marketCap > 0) {
            console.log(`✅ Using DexScreener for ${symbol}`);
            return data;
        }

        // ═══════════════════════════════════════════════════════════
        // FALLBACK: Use cached data
        // ═══════════════════════════════════════════════════════════
        console.warn(`⚠️ All sources failed for ${symbol}, keeping cached data`);
        return null;
    }

    /**
     * 🚀 MAIN FETCH METHOD
     */
    async fetchMarketData() {
        console.log('\n⚡ ═══════════════════════════════════════════');
        console.log('⚡ FETCHING ULTRA FAST MARKET DATA');
        console.log('⚡ ═══════════════════════════════════════════');

        // ===== TOKEN A =====
        const tokenAData = await this.fetchTokenData(
            config.tokens.tokenA.address,
            config.tokens.tokenA.chain,
            config.tokens.tokenA.symbol
        );

        if (tokenAData) {
            this.cache.tokenA = {
                ...tokenAData,
                lastUpdate: Date.now()
            };
        }

        // ===== TOKEN B =====
        const tokenBData = await this.fetchTokenData(
            config.tokens.tokenB.address,
            config.tokens.tokenB.chain,
            config.tokens.tokenB.symbol
        );

        if (tokenBData) {
            this.cache.tokenB = {
                ...tokenBData,
                lastUpdate: Date.now()
            };
        }

        // Log results
        if (tokenAData || tokenBData) {
            console.log('\n📊 ═══════════════════════════════════════════');
            console.log('📊 MARKET UPDATE COMPLETE');
            console.log('📊 ═══════════════════════════════════════════');
            if (tokenAData) {
                console.log(`  ${config.tokens.tokenA.symbol}:`);
                console.log(`    MC: $${this.formatMC(this.cache.tokenA.marketCap)}`);
                console.log(`    Price: $${this.cache.tokenA.price.toFixed(6)}`);
                console.log(`    24h: ${this.cache.tokenA.priceChange24h >= 0 ? '+' : ''}${this.cache.tokenA.priceChange24h.toFixed(2)}%`);
                console.log(`    Source: ${this.cache.tokenA.source || 'unknown'}`);
            }
            if (tokenBData) {
                console.log(`  ${config.tokens.tokenB.symbol}:`);
                console.log(`    MC: $${this.formatMC(this.cache.tokenB.marketCap)}`);
                console.log(`    Price: $${this.cache.tokenB.price.toFixed(6)}`);
                console.log(`    24h: ${this.cache.tokenB.priceChange24h >= 0 ? '+' : ''}${this.cache.tokenB.priceChange24h.toFixed(2)}%`);
                console.log(`    Source: ${this.cache.tokenB.source || 'unknown'}`);
            }
            console.log('═══════════════════════════════════════════\n');
        }

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
        console.log('🔄 Market data cache reset');
    }
}

module.exports = new MarketDataService();
