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
    videoDurations: {
        idle: 999999, // Idle loops forever, don't track time
        solPump: 5,
        bnbPump: 5,
        solDump: 5,
        bnbDump: 5,
        bothPump: 5,
        bothDump: 5,
        solBack: 3,
        bnbBack: 3,
        bothBack: 3,
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
    console.log('🎬 Video ended:', globalState.currentScenario);

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
    console.log(`🎬 Changing scenario to: ${scenario}`);
    globalState.currentScenario = scenario;
    globalState.videoTime = 0;
    globalState.videoStartTime = Date.now();

    io.emit('scenario_change', {
        scenario,
        timestamp: Date.now()
    });
}

// ⏱️ VIDEO SYNC - runs every second
setInterval(() => {
    const elapsed = (Date.now() - globalState.videoStartTime) / 1000;
    const duration = globalState.videoDurations[globalState.currentScenario] || 10;

    globalState.videoTime = elapsed;

    // Check if video should end (SKIP IDLE - it loops)
    if (elapsed >= duration && globalState.currentScenario !== 'idle') {
        handleVideoEnd();
    }

    // 🔧 FIX: Don't sync idle video (it loops)
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
    });

    socket.on('test_scenario', (scenario) => {
        console.log('🧪 Test scenario:', scenario);

        // 🔧 FIX: If IDLE, change immediately!
        if (globalState.currentScenario === 'idle') {
            console.log('⚡ IDLE detected, changing immediately!');
            changeScenario(scenario);
            globalState.isTransitioning = false;
        } else if (!globalState.isTransitioning) {
            // Otherwise, queue it
            globalState.pendingScenario = scenario;
            globalState.isTransitioning = true;
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
