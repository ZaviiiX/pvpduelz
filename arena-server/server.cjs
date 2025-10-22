// server.cjs - COMPLETE VERSION WITH API KEY AUTHENTICATION
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const config = require('./config');
const gameEngine = require('./gameEngine');

// ✅ MOCK ili REAL market data
const marketData = config.mock.enabled
    ? require('./mockMarketData')
    : require('./marketData');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;
let connectedClients = 0;

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 API KEY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

const API_KEY = process.env.API_KEY || 'daniskralj';

const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key is required'
        });
    }

    if (apiKey !== API_KEY) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API key'
        });
    }

    next();
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 MARKET DATA FETCHING
// ═══════════════════════════════════════════════════════════════════════════

async function fetchMarketDataLoop() {
    const data = await marketData.fetchMarketData();
    if (data) {
        gameEngine.updateMarketData(data);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ⚔️ BATTLE PROCESSING - COMPLETE WITH ALL EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

function processBattleLoop() {
    // 📡 Create emit callback to send ALL game events
    const emitCallback = (data) => {
        if (data.type === 'round_start') {
            console.log('📡 Emitting round_start event to all clients');
            io.emit('round_start', {
                currentRound: data.currentRound,
                health: data.health,
                score: data.score,
                scenario: data.scenario
            });
        }
        // 🆕 ROUND END EVENT
        else if (data.type === 'round_end') {
            console.log('📡 Emitting round_end event to all clients');
            io.emit('round_end', {
                winner: data.winner,
                currentRound: data.currentRound,
                score: data.score,
                health: data.health
            });
        }
        // DAMAGE EVENT
        else if (data.type === 'damage') {
            console.log(`💥 Emitting damage: ${data.attacker} → ${data.defender} (${data.damage.toFixed(1)} HP)`);
            io.emit('damage', {
                attacker: data.attacker,
                defender: data.defender,
                damage: data.damage,
                health: data.health,
                combo: data.combo,
                scenario: data.scenario,
                attackReason: data.attackReason
            });
        }
        // GAME OVER EVENT
        else if (data.type === 'game_over') {
            console.log(`🏁 Game Over! Winner: ${config.tokens[data.winner].symbol}`);
            io.emit('game_over', {
                winner: data.winner,
                score: data.score,
                health: data.health
            });
        }
        // SCENARIO CHANGE
        else if (data.type === 'scenario_change') {
            io.emit('scenario_change', {
                scenario: data.scenario
            });
        }
    };

    // Execute battle
    const result = gameEngine.processBattle(emitCallback);

    // Emit market update if we have data
    const marketCache = marketData.getCache();
    if (marketCache) {
        io.emit('market_update', {
            tokenA: marketCache.tokenA,
            tokenB: marketCache.tokenB
        });
    }

    // Reset to idle if no battle activity
    if (!result && gameEngine.state.currentScenario !== 'idle') {
        gameEngine.state.currentScenario = 'idle';
        io.emit('scenario_change', { scenario: 'idle' });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 START LOOPS
// ═══════════════════════════════════════════════════════════════════════════

setInterval(fetchMarketDataLoop, config.game.marketDataInterval);
setInterval(processBattleLoop, config.game.battleInterval);

// Initialize
fetchMarketDataLoop();

// ═══════════════════════════════════════════════════════════════════════════
// 🌐 SOCKET.IO CONNECTION HANDLING
// ═══════════════════════════════════════════════════════════════════════════

io.on('connection', (socket) => {
    connectedClients++;
    console.log(`✅ Client connected: ${socket.id} | Total: ${connectedClients}`);

    io.emit('user_count', connectedClients);

    const state = gameEngine.getState();
    const marketCache = marketData.getCache();

    // Send initial state to client
    socket.emit('initial_state', {
        config: {
            tokenA: config.tokens.tokenA,
            tokenB: config.tokens.tokenB,
            roundsToWin: config.game.roundsToWin,
            isMock: config.mock.enabled
        },
        health: state.health,
        scenario: state.currentScenario,
        combo: state.combo,
        currentRound: state.currentRound,
        score: state.score,
        isGameOver: state.isGameOver,
        winner: state.winner,
        lastDamage: state.lastDamage,
        marketData: {
            tokenA: marketCache.tokenA,
            tokenB: marketCache.tokenB
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`❌ Client disconnected: ${socket.id} | Total: ${connectedClients}`);
        io.emit('user_count', connectedClients);
    });

    // Manual battle trigger
    socket.on('manual_battle', () => {
        if (config.mock.enabled && config.mock.manualMode) {
            console.log('⚔️ Manual battle triggered by client');
            processBattleLoop();
        }
    });

    // Game reset
    socket.on('reset_game', () => {
        gameEngine.resetGame();
        if (config.mock.enabled) {
            marketData.reset();
        }
        io.emit('game_reset', {
            health: gameEngine.getState().health,
            currentRound: 1,
            score: { tokenA: 0, tokenB: 0 }
        });
        console.log('🔄 Game manually reset');
    });

    // Test scenario
    socket.on('test_scenario', (scenario) => {
        gameEngine.state.currentScenario = scenario;
        io.emit('scenario_change', { scenario });
        console.log(`🎮 Test scenario: ${scenario}`);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎮 MOCK CONTROLS (Socket Events)
    // ═══════════════════════════════════════════════════════════════════════════

    if (config.mock.enabled) {
        socket.on('mock_pump', (data) => {
            marketData.forcePump(data.token, data.intensity || 1);
        });

        socket.on('mock_dump', (data) => {
            marketData.forceDump(data.token, data.intensity || 1);
        });

        socket.on('mock_set_trend', (data) => {
            marketData.setTrend(data.token, data.trend);
        });

        socket.on('mock_set_volatility', (value) => {
            marketData.setVolatility(value);
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// 📊 HTTP API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: 'Custom Token Battle Arena',
        version: '2.0.0',
        mode: config.mock.enabled ? 'MOCK' : 'LIVE',
        tokens: {
            tokenA: config.tokens.tokenA.symbol,
            tokenB: config.tokens.tokenB.symbol
        }
    });
});

// Health check endpoints
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

// Game status endpoint
app.get('/status', (req, res) => {
    const state = gameEngine.getState();
    const marketCache = marketData.getCache();

    res.json({
        status: 'running',
        mode: config.mock.enabled ? 'MOCK' : 'LIVE',
        clients: connectedClients,
        game: {
            currentRound: state.currentRound,
            score: state.score,
            health: state.health,
            isGameOver: state.isGameOver,
            winner: state.winner ? config.tokens[state.winner].symbol : null
        },
        market: {
            tokenA: {
                ...config.tokens.tokenA,
                ...marketCache.tokenA
            },
            tokenB: {
                ...config.tokens.tokenB,
                ...marketCache.tokenB
            }
        }
    });
});

// Get current configuration
app.get('/api/config', (req, res) => {
    res.json({
        mode: config.mock.enabled ? 'mock' : 'live',
        tokens: {
            tokenA: config.tokens.tokenA,
            tokenB: config.tokens.tokenB
        },
        game: {
            roundsToWin: config.game.roundsToWin,
            maxHealth: config.game.maxHealth,
            damageMultiplier: config.game.damageMultiplier
        }
    });
});

// Get EXACT market data with full details
app.get('/api/market/details', async (req, res) => {
    try {
        const cache = marketData.getCache();

        res.json({
            timestamp: Date.now(),
            tokenA: {
                symbol: config.tokens.tokenA.symbol,
                name: config.tokens.tokenA.name,
                address: config.tokens.tokenA.address,
                chain: config.tokens.tokenA.chain,
                marketData: {
                    marketCap: cache.tokenA.marketCap,
                    marketCapFormatted: `$${cache.tokenA.marketCap.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                    price: cache.tokenA.price,
                    priceFormatted: `$${cache.tokenA.price.toFixed(6)}`,
                    change24h: cache.tokenA.priceChange24h,
                    change24hFormatted: `${cache.tokenA.priceChange24h >= 0 ? '+' : ''}${cache.tokenA.priceChange24h.toFixed(2)}%`,
                    volume24h: cache.tokenA.volume24h,
                    volume24hFormatted: `$${cache.tokenA.volume24h.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                    lastUpdate: cache.tokenA.lastUpdate,
                    lastUpdateFormatted: new Date(cache.tokenA.lastUpdate).toLocaleString()
                }
            },
            tokenB: {
                symbol: config.tokens.tokenB.symbol,
                name: config.tokens.tokenB.name,
                address: config.tokens.tokenB.address,
                chain: config.tokens.tokenB.chain,
                marketData: {
                    marketCap: cache.tokenB.marketCap,
                    marketCapFormatted: `$${cache.tokenB.marketCap.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                    price: cache.tokenB.price,
                    priceFormatted: `$${cache.tokenB.price.toFixed(6)}`,
                    change24h: cache.tokenB.priceChange24h,
                    change24hFormatted: `${cache.tokenB.priceChange24h >= 0 ? '+' : ''}${cache.tokenB.priceChange24h.toFixed(2)}%`,
                    volume24h: cache.tokenB.volume24h,
                    volume24hFormatted: `$${cache.tokenB.volume24h.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                    lastUpdate: cache.tokenB.lastUpdate,
                    lastUpdateFormatted: new Date(cache.tokenB.lastUpdate).toLocaleString()
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 TOKEN CONFIGURATION ENDPOINTS (WITH API KEY PROTECTION)
// ═══════════════════════════════════════════════════════════════════════════

// Set Token A (protected with API key)
app.post('/api/config/tokenA', validateApiKey, async (req, res) => {
    try {
        const { address, name, symbol, chain } = req.body;

        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Token address is required'
            });
        }

        config.tokens.tokenA.address = address;
        if (name) config.tokens.tokenA.name = name;
        if (symbol) config.tokens.tokenA.symbol = symbol;
        if (chain) config.tokens.tokenA.chain = chain;
        config.tokens.tokenA.isMock = false;

        console.log('✅ Token A configured:', config.tokens.tokenA);

        if (!config.mock.enabled) {
            await marketData.fetchMarketData();
        }

        io.emit('config_update', {
            tokenA: config.tokens.tokenA,
            tokenB: config.tokens.tokenB
        });

        res.json({
            success: true,
            message: 'Token A configured successfully',
            token: config.tokens.tokenA
        });

    } catch (error) {
        console.error('❌ Error configuring Token A:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Set Token B (protected with API key)
app.post('/api/config/tokenB', validateApiKey, async (req, res) => {
    try {
        const { address, name, symbol, chain } = req.body;

        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Token address is required'
            });
        }

        config.tokens.tokenB.address = address;
        if (name) config.tokens.tokenB.name = name;
        if (symbol) config.tokens.tokenB.symbol = symbol;
        if (chain) config.tokens.tokenB.chain = chain;
        config.tokens.tokenB.isMock = false;

        console.log('✅ Token B configured:', config.tokens.tokenB);

        if (!config.mock.enabled) {
            await marketData.fetchMarketData();
        }

        io.emit('config_update', {
            tokenA: config.tokens.tokenA,
            tokenB: config.tokens.tokenB
        });

        res.json({
            success: true,
            message: 'Token B configured successfully',
            token: config.tokens.tokenB
        });

    } catch (error) {
        console.error('❌ Error configuring Token B:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Set both tokens at once (protected with API key)
app.post('/api/config/tokens', validateApiKey, async (req, res) => {
    try {
        const { tokenA, tokenB } = req.body;

        if (!tokenA?.address || !tokenB?.address) {
            return res.status(400).json({
                success: false,
                error: 'Both token addresses are required'
            });
        }

        // Update Token A
        config.tokens.tokenA.address = tokenA.address;
        if (tokenA.name) config.tokens.tokenA.name = tokenA.name;
        if (tokenA.symbol) config.tokens.tokenA.symbol = tokenA.symbol;
        if (tokenA.chain) config.tokens.tokenA.chain = tokenA.chain;
        config.tokens.tokenA.isMock = false;

        // Update Token B
        config.tokens.tokenB.address = tokenB.address;
        if (tokenB.name) config.tokens.tokenB.name = tokenB.name;
        if (tokenB.symbol) config.tokens.tokenB.symbol = tokenB.symbol;
        if (tokenB.chain) config.tokens.tokenB.chain = tokenB.chain;
        config.tokens.tokenB.isMock = false;

        console.log('✅ Both tokens configured');
        console.log('   Token A:', config.tokens.tokenA);
        console.log('   Token B:', config.tokens.tokenB);

        if (!config.mock.enabled) {
            await marketData.fetchMarketData();
        }

        io.emit('config_update', {
            tokenA: config.tokens.tokenA,
            tokenB: config.tokens.tokenB
        });

        res.json({
            success: true,
            message: 'Both tokens configured successfully',
            tokens: {
                tokenA: config.tokens.tokenA,
                tokenB: config.tokens.tokenB
            }
        });

    } catch (error) {
        console.error('❌ Error configuring tokens:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Toggle between mock and live mode (protected with API key)
app.post('/api/config/mode', validateApiKey, (req, res) => {
    try {
        const { mode } = req.body;

        if (mode === 'mock') {
            config.mock.enabled = true;
            console.log('🎲 Switched to MOCK mode');
        } else if (mode === 'live') {
            config.mock.enabled = false;
            console.log('🔴 Switched to LIVE mode');
        } else {
            return res.status(400).json({
                success: false,
                error: 'Mode must be "mock" or "live"'
            });
        }

        io.emit('mode_change', {
            mode: config.mock.enabled ? 'mock' : 'live'
        });

        res.json({
            success: true,
            mode: config.mock.enabled ? 'mock' : 'live'
        });

    } catch (error) {
        console.error('❌ Error changing mode:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Admin reset endpoint (protected with API key)
app.post('/admin/reset', validateApiKey, (req, res) => {
    gameEngine.resetGame();
    if (config.mock.enabled) {
        marketData.reset();
    }
    io.emit('game_reset', {
        health: gameEngine.getState().health,
        currentRound: 1,
        score: { tokenA: 0, tokenB: 0 }
    });
    res.json({ success: true, message: 'Game reset' });
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎮 MOCK CONTROL ENDPOINTS (HTTP API) - Protected with API key
// ═══════════════════════════════════════════════════════════════════════════

if (config.mock.enabled) {
    app.post('/mock/pump/:token', validateApiKey, (req, res) => {
        const token = req.params.token;
        const intensity = req.body.intensity || 1;
        marketData.forcePump(token, intensity);
        io.emit('market_manual_update', marketData.getCache());
        res.json({ success: true, token, action: 'pump' });
    });

    app.post('/mock/dump/:token', validateApiKey, (req, res) => {
        const token = req.params.token;
        const intensity = req.body.intensity || 1;
        marketData.forceDump(token, intensity);
        io.emit('market_manual_update', marketData.getCache());
        res.json({ success: true, token, action: 'dump' });
    });

    app.post('/mock/trend/:token', validateApiKey, (req, res) => {
        const token = req.params.token;
        const trend = req.body.trend;
        marketData.setTrend(token, trend);
        res.json({ success: true, token, trend });
    });

    app.post('/mock/volatility', validateApiKey, (req, res) => {
        const value = parseFloat(req.body.value);
        marketData.setVolatility(value);
        res.json({ success: true, volatility: value });
    });

    app.post('/mock/reset', validateApiKey, (req, res) => {
        marketData.reset();
        io.emit('market_manual_update', marketData.getCache());
        res.json({ success: true, message: 'Mock data reset' });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 SERVER START
// ═══════════════════════════════════════════════════════════════════════════

server.listen(PORT, () => {
    console.log(`\n🚀 Custom Token Battle Arena Server`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🎮 Mode: ${config.mock.enabled ? '🎲 MOCK (TEST)' : '🔴 LIVE'}`);
    console.log(`\n⚔️  BATTLE:`);
    console.log(`   ${config.tokens.tokenA.symbol} (${config.tokens.tokenA.name})`);
    console.log(`   VS`);
    console.log(`   ${config.tokens.tokenB.symbol} (${config.tokens.tokenB.name})`);
    console.log(`\n🎮 Best of ${config.game.roundsToWin * 2 - 1} rounds`);
    console.log(`📊 Status: http://localhost:${PORT}/status`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
    console.log(`🔐 API Key: ${API_KEY === 'your-secret-api-key-change-this' ? '⚠️  DEFAULT (CHANGE IN .env!)' : '✅ Configured'}`);

    if (config.mock.enabled) {
        console.log(`\n🎮 MOCK CONTROLS (HTTP with API Key):`);
        console.log(`   POST /mock/pump/tokenA - Force pump Token A`);
        console.log(`   POST /mock/dump/tokenB - Force dump Token B`);
        console.log(`   POST /mock/trend/tokenA {"trend":"pumping"}`);
        console.log(`   POST /mock/volatility {"value":0.8}`);
        console.log(`   POST /mock/reset - Reset market data`);
    }
    console.log('\n');
});
