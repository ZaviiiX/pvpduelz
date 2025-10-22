// server.cjs - COMPLETE FIXED VERSION
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
// 🔄 MARKET DATA FETCHING
// ═══════════════════════════════════════════════════════════════════════════

async function fetchMarketDataLoop() {
    const data = await marketData.fetchMarketData();
    if (data) {
        gameEngine.updateMarketData(data);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ⚔️ BATTLE PROCESSING - FIXED WITH EMIT CALLBACK
// ═══════════════════════════════════════════════════════════════════════════

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
        // 🆕 GAME OVER EVENT
        else if (data.type === 'game_over') {
            console.log('📡 Emitting game_over event to all clients');
            io.emit('game_over', {
                winner: data.winner,
                score: data.score,
                isGameOver: true
            });
        }
        // 🆕 GAME RESET EVENT
        else if (data.type === 'game_reset') {
            console.log('📡 Emitting game_reset event to all clients');
            io.emit('game_reset', {
                currentRound: data.currentRound,
                health: data.health,
                score: data.score,
                scenario: data.scenario
            });
        }
    };

    // Pass callback to processBattle
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
        mode: config.mock.enabled ? 'mock' : 'live',
        game: {
            tokenA: config.tokens.tokenA.symbol,
            tokenB: config.tokens.tokenB.symbol,
            roundsToWin: config.game.roundsToWin
        },
        server: {
            connectedClients,
            uptime: Math.floor(process.uptime())
        }
    });
});

// Current status
app.get('/status', (req, res) => {
    const state = gameEngine.getState();
    const marketCache = marketData.getCache();

    res.json({
        game: {
            currentRound: state.currentRound,
            score: state.score,
            health: state.health,
            scenario: state.currentScenario,
            isGameOver: state.isGameOver,
            winner: state.winner,
            combo: state.combo
        },
        tokens: {
            tokenA: config.tokens.tokenA,
            tokenB: config.tokens.tokenB
        },
        marketData: {
            tokenA: {
                ...marketCache.tokenA,
                age: Date.now() - marketCache.tokenA.lastUpdate,
                ageSeconds: Math.floor((Date.now() - marketCache.tokenA.lastUpdate) / 1000)
            },
            tokenB: {
                ...marketCache.tokenB,
                age: Date.now() - marketCache.tokenB.lastUpdate,
                ageSeconds: Math.floor((Date.now() - marketCache.tokenB.lastUpdate) / 1000)
            }
        },
        server: {
            connectedClients,
            mode: config.mock.enabled ? 'mock' : 'live',
            uptime: Math.floor(process.uptime())
        },
        timestamp: new Date().toISOString()
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎮 MOCK CONTROL ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

if (config.mock.enabled) {
    // Force pump tokenA
    app.post('/mock/pump/tokenA', (req, res) => {
        const intensity = req.body.intensity || 1;
        marketData.forcePump('tokenA', intensity);
        res.json({
            success: true,
            message: `Token A pumped (intensity: ${intensity})`,
            cache: marketData.getCache().tokenA
        });
    });

    // Force pump tokenB
    app.post('/mock/pump/tokenB', (req, res) => {
        const intensity = req.body.intensity || 1;
        marketData.forcePump('tokenB', intensity);
        res.json({
            success: true,
            message: `Token B pumped (intensity: ${intensity})`,
            cache: marketData.getCache().tokenB
        });
    });

    // Force dump tokenA
    app.post('/mock/dump/tokenA', (req, res) => {
        const intensity = req.body.intensity || 1;
        marketData.forceDump('tokenA', intensity);
        res.json({
            success: true,
            message: `Token A dumped (intensity: ${intensity})`,
            cache: marketData.getCache().tokenA
        });
    });

    // Force dump tokenB
    app.post('/mock/dump/tokenB', (req, res) => {
        const intensity = req.body.intensity || 1;
        marketData.forceDump('tokenB', intensity);
        res.json({
            success: true,
            message: `Token B dumped (intensity: ${intensity})`,
            cache: marketData.getCache().tokenB
        });
    });

    // Set trend for tokenA or tokenB
    app.post('/mock/trend/:token', (req, res) => {
        const token = req.params.token; // "tokenA" or "tokenB"
        const { trend } = req.body; // "pumping", "dumping", "sideways"

        if (!['tokenA', 'tokenB'].includes(token)) {
            return res.status(400).json({ error: 'Invalid token (use tokenA or tokenB)' });
        }

        if (!['pumping', 'dumping', 'sideways'].includes(trend)) {
            return res.status(400).json({ error: 'Invalid trend (use pumping/dumping/sideways)' });
        }

        marketData.setTrend(token, trend);

        res.json({
            success: true,
            message: `${token} trend set to ${trend}`,
            cache: marketData.getCache()[token]
        });
    });

    // Set volatility
    app.post('/mock/volatility', (req, res) => {
        const { value } = req.body; // 0.1 to 2.0

        if (!value || value < 0.1 || value > 2.0) {
            return res.status(400).json({ error: 'Volatility must be between 0.1 and 2.0' });
        }

        marketData.setVolatility(value);

        res.json({
            success: true,
            message: `Volatility set to ${value}`,
            volatility: value
        });
    });

    // Reset mock market data
    app.post('/mock/reset', (req, res) => {
        marketData.reset();
        res.json({
            success: true,
            message: 'Mock market data reset',
            cache: marketData.getCache()
        });
    });

    // Get mock info
    app.get('/mock/info', (req, res) => {
        res.json({
            enabled: config.mock.enabled,
            manualMode: config.mock.manualMode,
            cache: marketData.getCache(),
            endpoints: [
                'POST /mock/pump/tokenA',
                'POST /mock/pump/tokenB',
                'POST /mock/dump/tokenA',
                'POST /mock/dump/tokenB',
                'POST /mock/trend/:token {"trend":"pumping|dumping|sideways"}',
                'POST /mock/volatility {"value":0.5-2.0}',
                'POST /mock/reset'
            ]
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 DEBUG ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Full debug info
app.get('/debug', async (req, res) => {
    const state = gameEngine.getState();
    const marketCache = marketData.getCache();

    res.json({
        server: {
            uptime: Math.floor(process.uptime()),
            memory: {
                used: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024)
            },
            clients: connectedClients
        },
        config: {
            mode: config.mock.enabled ? 'mock' : 'live',
            mockManualMode: config.mock.manualMode,
            battleInterval: config.game.battleInterval,
            marketDataInterval: config.game.marketDataInterval,
            roundsToWin: config.game.roundsToWin,
            tokens: config.tokens
        },
        game: {
            currentRound: state.currentRound,
            score: state.score,
            health: state.health,
            scenario: state.currentScenario,
            combo: state.combo,
            isGameOver: state.isGameOver,
            winner: state.winner,
            lastDamage: state.lastDamage
        },
        marketData: {
            tokenA: {
                ...marketCache.tokenA,
                age: Date.now() - marketCache.tokenA.lastUpdate,
                ageSeconds: Math.floor((Date.now() - marketCache.tokenA.lastUpdate) / 1000)
            },
            tokenB: {
                ...marketCache.tokenB,
                age: Date.now() - marketCache.tokenB.lastUpdate,
                ageSeconds: Math.floor((Date.now() - marketCache.tokenB.lastUpdate) / 1000)
            }
        },
        timestamp: new Date().toISOString()
    });
});

// 🔍 QUICK CONNECTION TEST
app.get('/debug/test-connection', (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    res.json({
        success: true,
        message: 'Server is reachable',
        server: {
            time: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            memory: {
                used: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024)
            }
        },
        client: {
            ip: clientIP,
            userAgent: req.headers['user-agent']
        },
        socketio: {
            path: '/socket.io',
            connected: connectedClients,
            available: true
        }
    });
});

// 📊 MARKET DATA DIAGNOSTICS
app.get('/debug/market', async (req, res) => {
    const marketCache = marketData.getCache();

    // Try a fresh fetch
    let freshData = null;
    let fetchError = null;

    try {
        freshData = await marketData.fetchMarketData();
    } catch (error) {
        fetchError = error.message;
    }

    res.json({
        cache: {
            tokenA: {
                ...marketCache.tokenA,
                cacheAge: Date.now() - marketCache.tokenA.lastUpdate,
                cacheAgeMinutes: Math.floor((Date.now() - marketCache.tokenA.lastUpdate) / 60000)
            },
            tokenB: {
                ...marketCache.tokenB,
                cacheAge: Date.now() - marketCache.tokenB.lastUpdate,
                cacheAgeMinutes: Math.floor((Date.now() - marketCache.tokenB.lastUpdate) / 60000)
            }
        },
        freshFetch: {
            success: !fetchError,
            error: fetchError,
            data: freshData
        },
        config: {
            mode: config.mock.enabled ? 'mock' : 'live',
            fetchInterval: config.game.marketDataInterval,
            fetchIntervalSeconds: config.game.marketDataInterval / 1000
        }
    });
});

// 🔌 WEBSOCKET DIAGNOSTICS
app.get('/debug/websocket', (req, res) => {
    const sockets = Array.from(io.sockets.sockets.values());

    res.json({
        server: {
            namespace: '/',
            clients: connectedClients,
            rooms: Array.from(io.sockets.adapter.rooms.keys())
        },
        clients: sockets.map(socket => ({
            id: socket.id,
            connected: socket.connected,
            transport: socket.conn.transport.name,
            handshake: {
                time: socket.handshake.time,
                address: socket.handshake.address,
                headers: socket.handshake.headers['user-agent']
            }
        })),
        events: {
            listening: [
                'connection',
                'disconnect',
                'manual_battle',
                'reset_game',
                'test_scenario'
            ],
            emitting: [
                'initial_state',
                'battle_update',
                'round_end',
                'round_start',
                'game_over',
                'game_reset',
                'scenario_change',
                'user_count'
            ]
        }
    });
});

// 🧪 TEST EMIT
app.post('/debug/test-emit', (req, res) => {
    const { event, data } = req.body;

    if (!event) {
        return res.status(400).json({ error: 'Event name required' });
    }

    try {
        io.emit(event, data || {});
        res.json({
            success: true,
            message: `Emitted ${event} to ${connectedClients} clients`,
            event,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🏥 ENHANCED HEALTH CHECK
app.get('/health', (req, res) => {
    const marketCache = marketData.getCache();
    const state = gameEngine.getState();

    const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        checks: {
            server: {
                status: 'ok',
                uptime: process.uptime()
            },
            game: {
                status: state.isGameOver ? 'game_over' : 'running',
                round: state.currentRound
            },
            market: {
                status: 'ok',
                tokenA_age: Math.floor((Date.now() - marketCache.tokenA.lastUpdate) / 1000),
                tokenB_age: Math.floor((Date.now() - marketCache.tokenB.lastUpdate) / 1000),
                tokenA_mc: marketCache.tokenA.marketCap,
                tokenB_mc: marketCache.tokenB.marketCap
            },
            websocket: {
                status: 'ok',
                clients: connectedClients
            }
        }
    };

    // Check if market data is too old
    const maxAge = 120; // 2 minutes
    if (healthStatus.checks.market.tokenA_age > maxAge ||
        healthStatus.checks.market.tokenB_age > maxAge) {
        healthStatus.checks.market.status = 'warning';
        healthStatus.checks.market.message = 'Market data is stale';
    }

    // Check if market cap is 0
    if (marketCache.tokenA.marketCap === 0 || marketCache.tokenB.marketCap === 0) {
        healthStatus.checks.market.status = 'error';
        healthStatus.checks.market.message = 'Market cap is 0';
        healthStatus.status = 'degraded';
    }

    res.json(healthStatus);
});

// 🚨 PING ENDPOINT (ultra lightweight)
app.get('/ping', (req, res) => {
    res.send('pong');
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 SET TOKENS API - NOVO!
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/set-tokens', (req, res) => {
    const { tokenA, tokenB } = req.body;
    
    try {
        if (tokenA) {
            config.tokens.tokenA = {
                symbol: tokenA.symbol || config.tokens.tokenA.symbol,
                name: tokenA.name || config.tokens.tokenA.name,
                address: tokenA.address || config.tokens.tokenA.address,
                coingeckoId: tokenA.coingeckoId || config.tokens.tokenA.coingeckoId
            };
        }
        
        if (tokenB) {
            config.tokens.tokenB = {
                symbol: tokenB.symbol || config.tokens.tokenB.symbol,
                name: tokenB.name || config.tokens.tokenB.name,
                address: tokenB.address || config.tokens.tokenB.address,
                coingeckoId: tokenB.coingeckoId || config.tokens.tokenB.coingeckoId
            };
        }
        
        // Reset sve
        if (config.mock.enabled) {
            marketData.reset();
        }
        gameEngine.resetGame();
        
        // Notifikuj sve klijente
        io.emit('tokens_updated', {
            tokenA: config.tokens.tokenA,
            tokenB: config.tokens.tokenB
        });
        
        console.log('🎯 Tokens updated:', config.tokens.tokenA.symbol, 'vs', config.tokens.tokenB.symbol);
        
        res.json({
            success: true,
            message: 'Tokens updated successfully',
            tokens: {
                tokenA: config.tokens.tokenA,
                tokenB: config.tokens.tokenB
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

console.log('\n🐛 DEBUG ENDPOINTS LOADED:');
console.log('   GET  /debug - Full diagnostic info');
console.log('   GET  /debug/test-connection - Quick connection test');
console.log('   GET  /debug/market - Market data diagnostics');
console.log('   GET  /debug/websocket - WebSocket diagnostics');
console.log('   POST /debug/test-emit - Test event emission');
console.log('   GET  /health - Enhanced health check');
console.log('   GET  /ping - Simple ping');
console.log('   POST /api/set-tokens - Set custom tokens ⭐ NEW!');

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

    if (config.mock.enabled) {
        console.log(`\n🎮 MOCK CONTROLS (HTTP):`);
        console.log(`   POST /mock/pump/tokenA - Force pump Token A`);
        console.log(`   POST /mock/dump/tokenB - Force dump Token B`);
        console.log(`   POST /mock/trend/tokenA {"trend":"pumping"}`);
        console.log(`   POST /mock/volatility {"value":0.8}`);
        console.log(`   POST /mock/reset - Reset market data`);
    }
    console.log('\n');
});
