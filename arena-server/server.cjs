// server.cjs - RENDER-SAFE COMPLETE VERSION
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
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3001;
let connectedClients = 0;

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 MARKET DATA FETCHING (sa zaštitom)
// ═══════════════════════════════════════════════════════════════════════════
async function fetchMarketDataLoop() {
  try {
    const data = await marketData.fetchMarketData();
    if (data) gameEngine.updateMarketData(data);
  } catch (e) {
    console.error('⚠️ fetchMarketDataLoop error:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ⚔️ BATTLE PROCESSING
// ═══════════════════════════════════════════════════════════════════════════
function processBattleLoop() {
  try {
    const emitCallback = (data) => {
      if (!data || !data.type) return;

      if (data.type === 'round_start') {
        io.emit('round_start', {
          currentRound: data.currentRound,
          health: data.health,
          score: data.score,
          scenario: data.scenario
        });
      } else if (data.type === 'round_end') {
        io.emit('round_end', {
          winner: data.winner,
          currentRound: data.currentRound,
          score: data.score,
          health: data.health
        });
      } else if (data.type === 'game_over') {
        io.emit('game_over', {
          winner: data.winner,
          score: data.score,
          isGameOver: true
        });
      } else if (data.type === 'game_reset') {
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
      const cache = safeCache();

      io.emit('battle_update', {
        ...battleResult,
        lastDamage: state.lastDamage,
        isGameOver: state.isGameOver,
        winner: state.winner,
        marketData: {
          tokenA: {
            price: cache.tokenA.price,
            change24h: cache.tokenA.priceChange24h,
            marketCap: cache.tokenA.marketCap,
            volume24h: cache.tokenA.volume24h
          },
          tokenB: {
            price: cache.tokenB.price,
            change24h: cache.tokenB.priceChange24h,
            marketCap: cache.tokenB.marketCap,
            volume24h: cache.tokenB.volume24h
          }
        }
      });
    } else if (battleResult && battleResult.type === 'idle') {
      io.emit('scenario_change', { scenario: 'idle' });
    }
  } catch (e) {
    console.error('⚠️ processBattleLoop error:', e.message);
  }
}

// Helper: siguran market cache
function safeCache() {
  const c = marketData.getCache ? marketData.getCache() : {};
  const safeTok = () => ({
    price: 0, priceChange24h: 0, marketCap: 0, volume24h: 0, lastUpdate: Date.now()
  });
  return {
    tokenA: { ...(c.tokenA || safeTok()) },
    tokenB: { ...(c.tokenB || safeTok()) }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🌐 SOCKET.IO
// ═══════════════════════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  connectedClients++;
  console.log(`✅ Client connected: ${socket.id} | Total: ${connectedClients}`);
  io.emit('user_count', connectedClients);

  const state = gameEngine.getState();
  const cache = safeCache();

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
    marketData: { tokenA: cache.tokenA, tokenB: cache.tokenB }
  });

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`❌ Client disconnected: ${socket.id} | Total: ${connectedClients}`);
    io.emit('user_count', connectedClients);
  });

  socket.on('manual_battle', () => {
    if (config.mock.enabled && config.mock.manualMode) {
      console.log('⚔️ Manual battle triggered');
      processBattleLoop();
    }
  });

  socket.on('reset_game', () => {
    gameEngine.resetGame();
    if (config.mock.enabled && typeof marketData.reset === 'function') {
      marketData.reset();
    }
    io.emit('game_reset', {
      health: gameEngine.getState().health,
      currentRound: 1,
      score: { tokenA: 0, tokenB: 0 }
    });
    console.log('🔄 Game manually reset');
  });

  socket.on('test_scenario', (scenario) => {
    gameEngine.state.currentScenario = scenario;
    io.emit('scenario_change', { scenario });
    console.log(`🎮 Test scenario: ${scenario}`);
  });

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
/** HTTP API **/
// ═══════════════════════════════════════════════════════════════════════════
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

// 🧠 Render health endpoint (mora biti /api/health)
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'ok', t: Date.now() });
});


// Brzi ping
app.get('/ping', (req, res) => res.send('pong'));

// Status igre
app.get('/status', (req, res) => {
  const state = gameEngine.getState();
  const cache = safeCache();

  res.json({
    status: 'running',
    mode: config.mock.enabled ? 'MOCK' : 'LIVE',
    clients: connectedClients,
    game: {
      currentRound: state.currentRound,
      score: state.score,
      health: state.health,
      isGameOver: state.isGameOver,
      winner: state.winner ? (config.tokens[state.winner]?.symbol || state.winner) : null
    },
    market: {
      tokenA: { ...config.tokens.tokenA, ...cache.tokenA },
      tokenB: { ...config.tokens.tokenB, ...cache.tokenB }
    }
  });
});

// Trenutni config
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

// Detaljni market podaci (formatirani stringovi)
app.get('/api/market/details', async (req, res) => {
  try {
    const cache = safeCache();

    const toFmt = (n, d = 0) => {
      if (typeof n !== 'number' || !isFinite(n)) return '—';
      return n.toLocaleString('en-US', { maximumFractionDigits: d });
    };
    const signPct = (n) => {
      if (typeof n !== 'number' || !isFinite(n)) return '—';
      return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
    };

    res.json({
      timestamp: Date.now(),
      tokenA: {
        symbol: config.tokens.tokenA.symbol,
        name: config.tokens.tokenA.name,
        address: config.tokens.tokenA.address,
        chain: config.tokens.tokenA.chain,
        marketData: {
          marketCap: cache.tokenA.marketCap,
          marketCapFormatted: `$${toFmt(cache.tokenA.marketCap)}`,
          price: cache.tokenA.price,
          priceFormatted: `$${(Number(cache.tokenA.price) || 0).toFixed(6)}`,
          change24h: cache.tokenA.priceChange24h,
          change24hFormatted: signPct(cache.tokenA.priceChange24h),
          volume24h: cache.tokenA.volume24h,
          volume24hFormatted: `$${toFmt(cache.tokenA.volume24h)}`,
          lastUpdate: cache.tokenA.lastUpdate,
          lastUpdateFormatted: new Date(cache.tokenA.lastUpdate || Date.now()).toLocaleString()
        }
      },
      tokenB: {
        symbol: config.tokens.tokenB.symbol,
        name: config.tokens.tokenB.name,
        address: config.tokens.tokenB.address,
        chain: config.tokens.tokenB.chain,
        marketData: {
          marketCap: cache.tokenB.marketCap,
          marketCapFormatted: `$${toFmt(cache.tokenB.marketCap)}`,
          price: cache.tokenB.price,
          priceFormatted: `$${(Number(cache.tokenB.price) || 0).toFixed(6)}`,
          change24h: cache.tokenB.priceChange24h,
          change24hFormatted: signPct(cache.tokenB.priceChange24h),
          volume24h: cache.tokenB.volume24h,
          volume24hFormatted: `$${toFmt(cache.tokenB.volume24h)}`,
          lastUpdate: cache.tokenB.lastUpdate,
          lastUpdateFormatted: new Date(cache.tokenB.lastUpdate || Date.now()).toLocaleString()
        }
      }
    });
  } catch (error) {
    console.error('❌ /api/market/details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// (Opcionalno) Mock HTTP kontrole
if (config.mock.enabled) {
  app.post('/mock/pump/:token', (req, res) => {
    const token = req.params.token;
    const intensity = req.body.intensity || 1;
    marketData.forcePump(token, intensity);
    io.emit('market_manual_update', safeCache());
    res.json({ success: true, token, action: 'pump' });
  });

  app.post('/mock/dump/:token', (req, res) => {
    const token = req.params.token;
    const intensity = req.body.intensity || 1;
    marketData.forceDump(token, intensity);
    io.emit('market_manual_update', safeCache());
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
    io.emit('market_manual_update', safeCache());
    res.json({ success: true, message: 'Mock data reset' });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 SET TOKENS API
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/set-tokens', (req, res) => {
  const { tokenA, tokenB } = req.body;
  
  try {
    if (tokenA) {
      config.tokens.tokenA = {
        symbol: tokenA.symbol || config.tokens.tokenA.symbol,
        name: tokenA.name || config.tokens.tokenA.name,
        address: tokenA.address || config.tokens.tokenA.address
      };
    }
    
    if (tokenB) {
      config.tokens.tokenB = {
        symbol: tokenB.symbol || config.tokens.tokenB.symbol,
        name: tokenB.name || config.tokens.tokenB.name,
        address: tokenB.address || config.tokens.tokenB.address
      };
    }
    
    // Reset sve
    if (config.mock.enabled && typeof marketData.reset === 'function') {
      marketData.reset();
    }
    gameEngine.resetGame();
    
    // Notifikuj klijente
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
    console.error('❌ set-tokens error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// Jednostavni debug (siguran)
app.get('/debug', (req, res) => {
  try {
    const state = gameEngine.getState();
    const cache = safeCache();
    res.json({
      server: {
        status: 'running',
        uptime: process.uptime(),
        pid: process.pid,
        nodeVersion: process.version,
        clients: connectedClients
      },
      mode: config.mock.enabled ? 'mock' : 'live',
      tokens: { tokenA: config.tokens.tokenA, tokenB: config.tokens.tokenB },
      game: {
        currentRound: state.currentRound,
        score: state.score,
        health: state.health,
        isGameOver: state.isGameOver,
        winner: state.winner,
        scenario: state.currentScenario,
        combo: state.combo
      },
      market: cache,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 START SERVER + LOOPS (poslije listen za sigurniji health)
// ═══════════════════════════════════════════════════════════════════════════
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Custom Token Battle Arena Server`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🎮 Mode: ${config.mock.enabled ? '🎲 MOCK (TEST)' : '🔴 LIVE'}`);
  console.log(`⚔  ${config.tokens.tokenA.symbol} (${config.tokens.tokenA.name}) VS ${config.tokens.tokenB.symbol} (${config.tokens.tokenB.name})`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);

  // Pokreni loopove s malim delayem da health odmah prođe
  const MD_INTERVAL = config.game.marketDataInterval || 5000;
  const BTL_INTERVAL = config.game.battleInterval || 1000;

  setTimeout(() => {
    fetchMarketDataLoop().catch(() => {});
    setInterval(fetchMarketDataLoop, MD_INTERVAL);
  }, 800);

  setTimeout(() => {
    processBattleLoop();
    setInterval(processBattleLoop, BTL_INTERVAL);
  }, 1200);
});
