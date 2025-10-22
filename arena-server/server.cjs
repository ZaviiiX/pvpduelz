// server.cjs - WITH API KEY PROTECTED MOCK ENDPOINTS
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const config = require('./config');
const gameEngine = require('./gameEngine');


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

// 🔐 API KEY (set in .env or use default)
const API_KEY = process.env.API_KEY || 'danisjekralj';

let connectedClients = 0;

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 API KEY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

function requireApiKey(req, res, next) {
    const providedKey = req.headers['x-api-key'] || req.query.apiKey;

    if (!providedKey || providedKey !== API_KEY) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Valid API key required. Use X-API-Key header or ?apiKey= query param'
        });
    }

    console.log(`✅ API Key validated for ${req.method} ${req.path}`);
    next();
}

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
// ⚔️ BATTLE PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

function processBattleLoop() {
    const emitCallback = (data) => {
        if (data.type === 'round_start') {
            io.emit('round_start', {
                currentRound: data.currentRound,
                health: data.health,
                score: data.score,
                scenario: data.scenario
            });
        }
        else if (data.type === 'round_end') {
            io.emit('round_end', {
                winner: data.winner,
                currentRound: data.currentRound,
                score: data.score,
                health: data.health
            });
        }
        else if (data.type === 'game_over') {
            io.emit('game_over', {
                winner: data.winner,
                score: data.score,
                isGameOver: true
            });
        }
        else if (data.type === 'game_reset') {
            io.emit('game_reset', {
                currentRound: data.currentRound,
                health: data.health,
                score: data.score,
                scenario: data.scenario
            });
        }
    };

    const battleResult = gameEngine.processBattle(emitCallback);

    if (battleResult && battleResult.type === 'battle') {
        const state = gameEngine.getState();
        const marketCache = marketData.getCache();

        io.emit('battle_update', {
            ...battleResult,
            lastDamage: state.lastDamage,
            isGameOver: state.isGameOver,
            winner: state.winner,
            marketData: {
                tokenA: {
                    price: marketCache.tokenA.price,
                    change24h: marketCache.tokenA.priceChange24h,
                    marketCap: marketCache.tokenA.marketCap,
                    volume24h: marketCache.tokenA.volume24h
                },
                tokenB: {
                    price: marketCache.tokenB.price,
                    change24h: marketCache.tokenB.priceChange24h,
                    marketCap: marketCache.tokenB.marketCap,
                    volume24h: marketCache.tokenB.volume24h
                }
            }
        });
    } else if (battleResult && battleResult.type === 'idle') {
        io.emit('scenario_change', { scenario: 'idle' });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 START LOOPS
// ═══════════════════════════════════════════════════════════════════════════

setInterval(fetchMarketDataLoop, config.game.marketDataInterval);
setInterval(processBattleLoop, config.game.battleInterval);
fetchMarketDataLoop();

// ═══════════════════════════════════════════════════════════════════════════
// 🎮 MOCK CONTROL ENDPOINTS (Protected by API Key)
// ═══════════════════════════════════════════════════════════════════════════

if (config.mock.enabled) {
    // PUMP token
    app.post('/mock/pump/:token', requireApiKey, (req, res) => {
        const token = req.params.token;
        const intensity = req.body.intensity || 1;

        if (token !== 'tokenA' && token !== 'tokenB') {
            return res.status(400).json({ error: 'Invalid token. Use tokenA or tokenB' });
        }

        marketData.forcePump(token, intensity);
        const cache = marketData.getCache();

        res.json({
            success: true,
            action: 'pump',
            token,
            intensity,
            newMarketCap: cache[token].marketCap,
            newPrice: cache[token].price,
            change: `+${(intensity * 0.5).toFixed(2)}%`
        });
    });

    // DUMP token
    app.post('/mock/dump/:token', requireApiKey, (req, res) => {
        const token = req.params.token;
        const intensity = req.body.intensity || 1;

        if (token !== 'tokenA' && token !== 'tokenB') {
            return res.status(400).json({ error: 'Invalid token. Use tokenA or tokenB' });
        }

        marketData.forceDump(token, intensity);
        const cache = marketData.getCache();

        res.json({
            success: true,
            action: 'dump',
            token,
            intensity,
            newMarketCap: cache[token].marketCap,
            newPrice: cache[token].price,
            change: `-${(intensity * 0.5).toFixed(2)}%`
        });
    });

    // SET TREND
    app.post('/mock/trend/:token', requireApiKey, (req, res) => {
        const token = req.params.token;
        const trend = req.body.trend;

        if (token !== 'tokenA' && token !== 'tokenB') {
            return res.status(400).json({ error: 'Invalid token. Use tokenA or tokenB' });
        }

        if (!['neutral', 'pumping', 'dumping'].includes(trend)) {
            return res.status(400).json({
                error: 'Invalid trend. Use: neutral, pumping, or dumping'
            });
        }

        marketData.setTrend(token, trend);

        res.json({
            success: true,
            token,
            trend,
            message: `${token} trend set to ${trend}`
        });
    });

    // SET VOLATILITY
    app.post('/mock/volatility', requireApiKey, (req, res) => {
        const value = req.body.value;

        if (typeof value !== 'number' || value < 0 || value > 1) {
            return res.status(400).json({
                error: 'Invalid volatility. Must be number between 0 and 1'
            });
        }

        marketData.setVolatility(value);

        res.json({
            success: true,
            volatility: value,
            message: `Volatility set to ${value}`
        });
    });

    // RESET MARKET
    app.post('/mock/reset', requireApiKey, (req, res) => {
        marketData.reset();
        const cache = marketData.getCache();

        res.json({
            success: true,
            message: 'Market data reset to defaults',
            marketData: {
                tokenA: cache.tokenA,
                tokenB: cache.tokenB
            }
        });
    });

    // TOGGLE MANUAL MODE
    app.post('/mock/manual-mode', requireApiKey, (req, res) => {
        const isManual = marketData.toggleManualMode();

        res.json({
            success: true,
            manualMode: isManual,
            message: isManual ? 'Manual mode ON - market frozen' : 'Manual mode OFF - auto updates'
        });
    });

    // GET CURRENT MOCK STATE
    app.get('/mock/status', requireApiKey, (req, res) => {
        const cache = marketData.getCache();

        res.json({
            mode: 'mock',
            manualMode: config.mock.manualMode,
            volatility: config.mock.volatility,
            tokenA: cache.tokenA,
            tokenB: cache.tokenB
        });
    });

    // SET TOKEN ADDRESS
    app.post('/mock/set-address/:token', requireApiKey, (req, res) => {
        const token = req.params.token;
        const { address, symbol, name, chain } = req.body;

        if (token !== 'tokenA' && token !== 'tokenB') {
            return res.status(400).json({ error: 'Invalid token. Use tokenA or tokenB' });
        }

        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        // Update config
        if (address) config.tokens[token].address = address;
        if (symbol) config.tokens[token].symbol = symbol;
        if (name) config.tokens[token].name = name;
        if (chain) config.tokens[token].chain = chain;

        // Emit update to all clients
        io.emit('token_config_update', {
            token,
            config: config.tokens[token]
        });

        console.log(`🔄 Token ${token} updated:`, config.tokens[token]);

        res.json({
            success: true,
            token,
            config: config.tokens[token],
            message: `${token} configuration updated`
        });
    });

    // SET BOTH TOKENS AT ONCE
    app.post('/mock/set-tokens', requireApiKey, (req, res) => {
        const { tokenA, tokenB } = req.body;

        if (!tokenA || !tokenB) {
            return res.status(400).json({
                error: 'Both tokenA and tokenB are required',
                example: {
                    tokenA: { address: "CA_ADDRESS_A", symbol: "TKA", name: "Token A", chain: "solana" },
                    tokenB: { address: "CA_ADDRESS_B", symbol: "TKB", name: "Token B", chain: "bsc" }
                }
            });
        }

        // Update tokenA
        if (tokenA.address) config.tokens.tokenA.address = tokenA.address;
        if (tokenA.symbol) config.tokens.tokenA.symbol = tokenA.symbol;
        if (tokenA.name) config.tokens.tokenA.name = tokenA.name;
        if (tokenA.chain) config.tokens.tokenA.chain = tokenA.chain;

        // Update tokenB
        if (tokenB.address) config.tokens.tokenB.address = tokenB.address;
        if (tokenB.symbol) config.tokens.tokenB.symbol = tokenB.symbol;
        if (tokenB.name) config.tokens.tokenB.name = tokenB.name;
        if (tokenB.chain) config.tokens.tokenB.chain = tokenB.chain;

        // Emit update to all clients
        io.emit('token_config_update', {
            tokenA: config.tokens.tokenA,
            tokenB: config.tokens.tokenB
        });

        console.log(`🔄 Both tokens updated:`, config.tokens);

        res.json({
            success: true,
            message: 'Both tokens updated successfully',
            tokens: {
                tokenA: config.tokens.tokenA,
                tokenB: config.tokens.tokenB
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 TOKEN CONFIGURATION (Works in BOTH mock and live mode)
// ═══════════════════════════════════════════════════════════════════════════

// SET BOTH TOKENS AT ONCE (Works in live mode!)
app.post('/api/set-tokens', requireApiKey, (req, res) => {
    const { tokenA, tokenB } = req.body;

    if (!tokenA || !tokenB) {
        return res.status(400).json({
            error: 'Both tokenA and tokenB are required',
            example: {
                tokenA: { address: "CA_ADDRESS_A", symbol: "TKA", name: "Token A", chain: "solana" },
                tokenB: { address: "CA_ADDRESS_B", symbol: "TKB", name: "Token B", chain: "bsc" }
            }
        });
    }

    // Update tokenA
    if (tokenA.address) config.tokens.tokenA.address = tokenA.address;
    if (tokenA.symbol) config.tokens.tokenA.symbol = tokenA.symbol;
    if (tokenA.name) config.tokens.tokenA.name = tokenA.name;
    if (tokenA.chain) config.tokens.tokenA.chain = tokenA.chain;

    // Update tokenB
    if (tokenB.address) config.tokens.tokenB.address = tokenB.address;
    if (tokenB.symbol) config.tokens.tokenB.symbol = tokenB.symbol;
    if (tokenB.name) config.tokens.tokenB.name = tokenB.name;
    if (tokenB.chain) config.tokens.tokenB.chain = tokenB.chain;

    // Emit update to all clients
    io.emit('token_config_update', {
        tokenA: config.tokens.tokenA,
        tokenB: config.tokens.tokenB
    });

    console.log(`🔄 Both tokens updated:`, config.tokens);

    res.json({
        success: true,
        message: 'Both tokens updated successfully',
        mode: config.mock.enabled ? 'mock' : 'live',
        tokens: {
            tokenA: config.tokens.tokenA,
            tokenB: config.tokens.tokenB
        }
    });
});

// SET SINGLE TOKEN (Works in live mode!)
app.post('/api/set-token/:token', requireApiKey, (req, res) => {
    const token = req.params.token;
    const { address, symbol, name, chain } = req.body;

    if (token !== 'tokenA' && token !== 'tokenB') {
        return res.status(400).json({ error: 'Invalid token. Use tokenA or tokenB' });
    }

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    // Update config
    if (address) config.tokens[token].address = address;
    if (symbol) config.tokens[token].symbol = symbol;
    if (name) config.tokens[token].name = name;
    if (chain) config.tokens[token].chain = chain;

    // Emit update to all clients
    io.emit('token_config_update', {
        token,
        config: config.tokens[token]
    });

    console.log(`🔄 Token ${token} updated:`, config.tokens[token]);

    res.json({
        success: true,
        token,
        mode: config.mock.enabled ? 'mock' : 'live',
        config: config.tokens[token],
        message: `${token} configuration updated`
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 🌐 SOCKET.IO CONNECTION HANDLING
// ═══════════════════════════════════════════════════════════════════════════

io.on('connection', (socket) => {
    connectedClients++;
    console.log(`✅ Client connected: ${socket.id} | Total: ${connectedClients}`);

    io.emit('user_count', connectedClients);

    const state = gameEngine.getState();
    const marketCache = marketData.getCache();

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

    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`❌ Client disconnected: ${socket.id} | Total: ${connectedClients}`);
        io.emit('user_count', connectedClients);
    });

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
});

// ═══════════════════════════════════════════════════════════════════════════
// 📊 PUBLIC ENDPOINTS (No API Key Required)
// ═══════════════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
    res.json({
        name: 'Token Battle Arena API',
        version: '2.0',
        status: 'running',
        mode: config.mock.enabled ? 'mock' : 'live',
        endpoints: {
            public: [
                'GET /',
                'GET /health',
                'GET /status'
            ],
            protected: [
                'POST /api/set-tokens',
                'POST /api/set-token/:token',
                ...(config.mock.enabled ? [
                    'POST /mock/pump/:token',
                    'POST /mock/dump/:token',
                    'POST /mock/trend/:token',
                    'POST /mock/volatility',
                    'POST /mock/reset',
                    'POST /mock/manual-mode',
                    'GET /mock/status'
                ] : [])
            ]
        },
        apiKeyInfo: 'Protected endpoints require X-API-Key header or ?apiKey= query param'
    });
});

app.get('/health', (req, res) => {
    const marketCache = marketData.getCache();
    const state = gameEngine.getState();

    res.json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        game: {
            round: state.currentRound,
            gameOver: state.isGameOver
        },
        market: {
            tokenA_mc: marketCache.tokenA.marketCap,
            tokenB_mc: marketCache.tokenB.marketCap
        },
        clients: connectedClients
    });
});

app.get('/status', (req, res) => {
    const state = gameEngine.getState();
    const marketCache = marketData.getCache();

    res.json({
        game: {
            health: state.health,
            score: state.score,
            currentRound: state.currentRound,
            scenario: state.currentScenario,
            isGameOver: state.isGameOver,
            winner: state.winner
        },
        market: {
            tokenA: marketCache.tokenA,
            tokenB: marketCache.tokenB
        },
        server: {
            clients: connectedClients,
            uptime: Math.floor(process.uptime())
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 SERVER START
// ═══════════════════════════════════════════════════════════════════════════

server.listen(PORT, () => {
    console.log(`\n🚀 Token Battle Arena Server`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🎮 Mode: ${config.mock.enabled ? '🎲 MOCK' : '🔴 LIVE'}`);
    console.log(`\n⚔️  BATTLE:`);
    console.log(`   ${config.tokens.tokenA.symbol} vs ${config.tokens.tokenB.symbol}`);
    console.log(`\n📊 Public Endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/`);
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   GET  http://localhost:${PORT}/status`);

    if (config.mock.enabled) {
        console.log(`\n🔐 Protected Mock Endpoints (API Key: ${API_KEY}):`);
        console.log(`   POST http://localhost:${PORT}/mock/pump/tokenA`);
        console.log(`   POST http://localhost:${PORT}/mock/dump/tokenB`);
        console.log(`   POST http://localhost:${PORT}/mock/trend/tokenA`);
        console.log(`   POST http://localhost:${PORT}/mock/volatility`);
        console.log(`   POST http://localhost:${PORT}/mock/reset`);
        console.log(`   POST http://localhost:${PORT}/mock/manual-mode`);
        console.log(`   GET  http://localhost:${PORT}/mock/status`);
        console.log(`\n💡 Use header: X-API-Key: ${API_KEY}`);
    }
    console.log('\n');
});
