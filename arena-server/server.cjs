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

const fs = require('fs');
const path = require('path');

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
// 🔧 TOKEN CONFIGURATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Set Token A
app.post('/api/config/tokenA', async (req, res) => {
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
// Dodaj u HTTP API sekciju (~linija 230)
app.post('/api/set-tokens', (req, res) => {
    const { tokenA, tokenB } = req.body;
    
    if (tokenA) {
        config.tokens.tokenA = { ...config.tokens.tokenA, ...tokenA };
    }
    if (tokenB) {
        config.tokens.tokenB = { ...config.tokens.tokenB, ...tokenB };
    }
    
    marketData.reset(); // Reset cache
    gameEngine.resetGame(); // Reset igre
    
    res.json({ success: true, tokens: config.tokens });
});
// Set Token B
app.post('/api/config/tokenB', async (req, res) => {
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

// Set both tokens at once
app.post('/api/config/tokens', (req, res) => {
    try {
        const { tokenA, tokenB } = req.body;

        // Read current config
        const configPath = path.join(__dirname, 'config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');

        // Update tokenA
        if (tokenA) {
            configContent = configContent.replace(
                /tokenA:\s*{[^}]*}/s,
                `tokenA: ${JSON.stringify(tokenA, null, 12).replace(/"/g, "'")}`
            );
        }

        // Update tokenB
        if (tokenB) {
            configContent = configContent.replace(
                /tokenB:\s*{[^}]*}/s,
                `tokenB: ${JSON.stringify(tokenB, null, 12).replace(/"/g, "'")}`
            );
        }

        // Write back to file
        fs.writeFileSync(configPath, configContent);

        // Reload config
        delete require.cache[require.resolve('./config')];
        const newConfig = require('./config');

        res.json({ success: true, tokens: newConfig.tokens });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle between mock and live mode
app.post('/api/config/mode', (req, res) => {
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

// Admin reset endpoint
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

// ═══════════════════════════════════════════════════════════════════════════
// 🎮 MOCK CONTROL ENDPOINTS (HTTP API)
// ═══════════════════════════════════════════════════════════════════════════

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
        const trend = req.body.trend;
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
// server-debug-endpoints.cjs - ADD TO YOUR SERVER.CJS

// 🐛 COMPREHENSIVE DEBUG ENDPOINT
app.get('/debug', (req, res) => {
    const state = gameEngine.getState();
    const marketCache = marketData.getCache();

    res.json({
        server: {
            status: 'running',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            pid: process.pid,
            nodeVersion: process.version,
            platform: process.platform
        },
        config: {
            mode: config.mock.enabled ? 'mock' : 'live',
            tokens: {
                tokenA: {
                    symbol: config.tokens.tokenA.symbol,
                    name: config.tokens.tokenA.name,
                    chain: config.tokens.tokenA.chain,
                    isMock: config.tokens.tokenA.isMock
                },
                tokenB: {
                    symbol: config.tokens.tokenB.symbol,
                    name: config.tokens.tokenB.name,
                    chain: config.tokens.tokenB.chain,
                    isMock: config.tokens.tokenB.isMock
                }
            },
            intervals: {
                battleInterval: config.game.battleInterval,
                marketDataInterval: config.game.marketDataInterval,
                attackCooldown: config.game.attackCooldown
            }
        },
        connections: {
            socketio: {
                connected: connectedClients,
                transports: io.sockets.sockets.size > 0
                    ? Array.from(io.sockets.sockets.values()).map(s => ({
                        id: s.id,
                        transport: s.conn.transport.name
                    }))
                    : []
            }
        },
        game: {
            currentRound: state.currentRound,
            maxRounds: state.maxRounds,
            isRoundActive: state.isRoundActive,
            isGameOver: state.isGameOver,
            winner: state.winner,
            score: state.score,
            health: state.health,
            combo: state.combo,
            currentScenario: state.currentScenario,
            lastAttacker: state.lastAttacker,
            lastAttackTime: state.lastAttackTime,
            timeSinceLastAttack: Date.now() - state.lastAttackTime,
            cooldownRemaining: Math.max(0, config.game.attackCooldown - (Date.now() - state.lastAttackTime))
        },
        market: {
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

console.log('\n🐛 DEBUG ENDPOINTS LOADED:');
console.log('   GET  /debug - Full diagnostic info');
console.log('   GET  /debug/test-connection - Quick connection test');
console.log('   GET  /debug/market - Market data diagnostics');
console.log('   GET  /debug/websocket - WebSocket diagnostics');
console.log('   POST /debug/test-emit - Test event emission');
console.log('   GET  /health - Enhanced health check');
console.log('   GET  /ping - Simple ping');

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
