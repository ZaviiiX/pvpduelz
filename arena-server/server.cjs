// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: [
            "https://arena-frontend-xwmh.onrender.com",
            "https://arena-server-gh2h.onrender.com",
            "http://localhost:5173"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});
app.use(cors());

// 🌐 GLOBAL STATE
let globalState = {
    currentScenario: 'idle',
    videoTime: 0,
    videoStartTime: Date.now(),
    health: { sol: 100, bnb: 100 },
    marketData: {
        sol: { price: 0, change24h: 0 },
        bnb: { price: 0, change24h: 0 }
    },
    lastDamage: { sol: 0, bnb: 0 },
    pendingScenario: null,
    isTransitioning: false,
    connectedUsers: 0,
    testMode: false, // ✅ Test mode flag
    videoDurations: {
        idle: 999999,
        solPump: 5,
        bnbPump: 5,
        solDump: 5,
        bnbDump: 5,
        bothPump: 5,
        bothDump: 5,
        solBack: 5,
        bnbBack: 5,
        bothBack: 5,
    }
};

// 📊 MOCK Market Data
async function fetchMarketData() {
    const solChange = (Math.random() - 0.5) * 20;
    const bnbChange = (Math.random() - 0.5) * 20;

    return {
        sol: { price: 100, change24h: solChange },
        bnb: { price: 400, change24h: bnbChange }
    };
}

// 💚 UPDATE HEALTH
function updateHealth() {
    const { sol, bnb } = globalState.marketData;

    if (sol.change24h > 2) {
        globalState.health.sol = Math.min(100, globalState.health.sol + 5);
    } else if (sol.change24h < -2) {
        const damage = Math.abs(sol.change24h) * 2;
        globalState.health.sol = Math.max(0, globalState.health.sol - damage);
        globalState.lastDamage.sol = Date.now();
    }

    if (bnb.change24h > 2) {
        globalState.health.bnb = Math.min(100, globalState.health.bnb + 5);
    } else if (bnb.change24h < -2) {
        const damage = Math.abs(bnb.change24h) * 2;
        globalState.health.bnb = Math.max(0, globalState.health.bnb - damage);
        globalState.lastDamage.bnb = Date.now();
    }
}

// 🎬 VIDEO END HANDLER
function handleVideoEnd() {
    console.log('🎬 Server: Video ended:', globalState.currentScenario);

    if (globalState.pendingScenario) {
        changeScenario(globalState.pendingScenario);
        globalState.pendingScenario = null;
        globalState.isTransitioning = false;
        return;
    }

    if (globalState.currentScenario.includes('Pump') || globalState.currentScenario.includes('Dump')) {
        const backScenario = globalState.currentScenario.includes('sol') ? 'solBack' :
            globalState.currentScenario.includes('bnb') ? 'bnbBack' : 'bothBack';
        changeScenario(backScenario);
        return;
    }

    if (globalState.currentScenario.includes('Back')) {
        changeScenario('idle');
        globalState.isTransitioning = false;
        return;
    }
}

// 🔄 CHANGE SCENARIO
function changeScenario(scenario) {
    console.log(`🎬 Server: Changing scenario to: ${scenario}`);
    globalState.currentScenario = scenario;
    globalState.videoTime = 0;
    globalState.videoStartTime = Date.now();

    io.emit('scenario_change', {
        scenario,
        timestamp: Date.now()
    });
}

// ⏱️ VIDEO SYNC - runs every second (SAMO JEDAN!)
// ⏱️ VIDEO SYNC
setInterval(() => {
    const elapsed = (Date.now() - globalState.videoStartTime) / 1000;
    const duration = globalState.videoDurations[globalState.currentScenario] || 10;

    globalState.videoTime = elapsed;

    // ✅ DEBUG: Loguj test mode status
    if (elapsed >= duration && globalState.currentScenario !== 'idle') {
        console.log(`⏰ Timer check: testMode=${globalState.testMode}, elapsed=${elapsed}s, duration=${duration}s`);
    }

    if (!globalState.testMode && elapsed >= duration && globalState.currentScenario !== 'idle') {
        console.log(`⏰ Server timer: Video duration reached, transitioning...`);
        handleVideoEnd();
    }

    // Sync video time (not for idle - it loops)
    if (globalState.currentScenario !== 'idle') {
        io.emit('video_sync', {
            scenario: globalState.currentScenario,
            time: globalState.videoTime,
            timestamp: Date.now()
        });
    }
}, 1000);

// 📊 MARKET UPDATE - every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
    console.log('📊 Fetching market data...');

    const newMarketData = await fetchMarketData();
    globalState.marketData = newMarketData;

    updateHealth();

    io.emit('state_update', {
        health: globalState.health,
        marketData: globalState.marketData,
        lastDamage: globalState.lastDamage,
        pendingScenario: globalState.pendingScenario,
        isTransitioning: globalState.isTransitioning
    });
});

// 🔌 SOCKET CONNECTION
io.on('connection', (socket) => {
    globalState.connectedUsers++;
    console.log(`✅ User connected (Total: ${globalState.connectedUsers})`);

    socket.emit('initial_state', globalState);
    io.emit('user_count', globalState.connectedUsers);

    socket.on('disconnect', () => {
        globalState.connectedUsers--;
        console.log(`❌ User disconnected (Total: ${globalState.connectedUsers})`);
        io.emit('user_count', globalState.connectedUsers);

        // ✅ Ako niko nije konektovan, resetuj test mode
        if (globalState.connectedUsers === 0) {
            globalState.testMode = false;
            console.log('🔄 Test mode disabled (no users)');
        }
    });

    socket.on('test_scenario', (scenario) => {
        console.log('🧪 Test scenario:', scenario);

        // ✅ Aktiviraj test mod
        globalState.testMode = true;
        console.log('🧪 Test mode ENABLED');

        // Promeni scenario
        changeScenario(scenario);
        globalState.isTransitioning = false;
        globalState.pendingScenario = null;
    });

    // ✅ Klijent javi kada je video završen
    socket.on('video_ended', (data) => {
        console.log('🎬 Client reported video ended:', data.scenario, '→', data.nextScenario);

        if (globalState.testMode) {
            // U test modu, klijent kontroliše!
            if (data.nextScenario) {
                console.log('✅ Accepting client transition to:', data.nextScenario);
                changeScenario(data.nextScenario);
            }
        }
    });

    socket.on('test_health', ({ sol, bnb }) => {
        console.log('🧪 Test health:', { sol, bnb });
        if (sol !== undefined) globalState.health.sol = Math.max(0, Math.min(100, sol));
        if (bnb !== undefined) globalState.health.bnb = Math.max(0, Math.min(100, bnb));
        io.emit('state_update', {
            health: globalState.health,
            marketData: globalState.marketData,
            lastDamage: globalState.lastDamage,
        });
    });

    socket.on('reset_health', () => {
        console.log('🧪 Reset health');
        globalState.health = { sol: 100, bnb: 100 };
        io.emit('state_update', {
            health: globalState.health,
            marketData: globalState.marketData,
            lastDamage: globalState.lastDamage,
        });
    });
});

// 🌐 API
app.get('/api/state', (req, res) => {
    res.json(globalState);
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        users: globalState.connectedUsers
    });
});

// 🚀 START
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Arena Server running on port ${PORT}`);
    console.log(`🌐 WebSocket ready at ws://localhost:${PORT}`);
});
