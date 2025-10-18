// server.js - MAIN SERVER SA MOCK SUPPORT
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

// 🔄 MARKET DATA FETCHING
async function fetchMarketDataLoop() {
    const data = await marketData.fetchMarketData();
    if (data) {
        gameEngine.updateMarketData(data);
    }
}

// ⚔️ BATTLE PROCESSING
function processBattleLoop() {
    const battleResult = gameEngine.processBattle();

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

// 🚀 START LOOPS
setInterval(fetchMarketDataLoop, config.game.marketDataInterval);
setInterval(processBattleLoop, config.game.battleInterval);

// Initialize
fetchMarketDataLoop();

// 🌐 SOCKET.IO
io.on('connection', (socket) => {
    connectedClients++;
    console.log(`✅ Client connected: ${socket.id} | Total: ${connectedClients}`);

    io.emit('user_count', connectedClients);

    const state = gameEngine.getState();
    const marketCache = marketData.getCache();

    console.log('🔍 CONFIG CHECK:');
    console.log('TokenA icon:', config.tokens.tokenA.icon);
    console.log('TokenB icon:', config.tokens.tokenB.icon);

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
// U socket.on('connection') delu, dodaj:

    socket.on('manual_battle', () => {
        if (config.mock.enabled && config.mock.manualMode) {
            console.log('⚔️ Manual battle triggered by client');
            processBattleLoop(); // Force battle check
        }
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

    // 🎮 MOCK CONTROLS
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

    socket.on('test_scenario', (scenario) => {
        gameEngine.state.currentScenario = scenario;
        io.emit('scenario_change', { scenario });
        console.log(`🎮 Test scenario: ${scenario}`);
    });
});

// 📊 API ENDPOINTS
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

// 🎮 MOCK CONTROL ENDPOINTS
if (config.mock.enabled) {
    app.post('/mock/pump/:token', (req, res) => {
        const token = req.params.token;
        const intensity = req.body.intensity || 1;
        marketData.forcePump(token, intensity);
        io.emit('market_manual_update', marketData.getCache());
        res.json({ success: true, token, action: 'pump' });
    });

    app.post('/mock/dump/:token', (req, res) => {
        const token = req.params.token;
        const intensity = req.body.intensity || 1;
        marketData.forceDump(token, intensity);
        io.emit('market_manual_update', marketData.getCache());
        res.json({ success: true, token, action: 'dump' });
    });

    app.post('/mock/trend/:token', (req, res) => {
        const token = req.params.token;
        const trend = req.body.trend; // neutral, pumping, dumping
        marketData.setTrend(token, trend);
        res.json({ success: true, token, trend });
    });

    app.post('/mock/volatility', (req, res) => {
        const value = parseFloat(req.body.value);
        marketData.setVolatility(value);
        res.json({ success: true, volatility: value });
    });

    app.post('/mock/reset', (req, res) => {
        marketData.reset();
        io.emit('market_manual_update', marketData.getCache());
        res.json({ success: true, message: 'Mock data reset' });
    });
}

app.post('/admin/reset', (req, res) => {
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

// 📊 API ENDPOINTS
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

// ✅ DODAJ OVO - Health check za Render
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

app.get('/api/health', (req, res) => {  // ✅ I OVO (Render traži /api/health)
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

app.get('/status', (req, res) => {
    // ... postojeći kod
});

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

    if (config.mock.enabled) {
        console.log(`\n🎮 MOCK CONTROLS:`);
        console.log(`   POST /mock/pump/tokenA - Force pump Token A`);
        console.log(`   POST /mock/dump/tokenB - Force dump Token B`);
        console.log(`   POST /mock/trend/tokenA {"trend":"pumping"}`);
        console.log(`   POST /mock/volatility {"value":0.8}`);
        console.log(`   POST /mock/reset - Reset market data`);
    }
    console.log('\n');
});
