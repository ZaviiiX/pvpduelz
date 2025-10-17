import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";

const cls = (...c) => c.filter(Boolean).join(" ");

// 💚 HEALTH BAR COMPONENT
function HealthBar({ health, maxHealth = 100, side = "left", label = "PLAYER", lastDamage = 0 }) {
  const healthPercent = (health / maxHealth) * 100;
  const isLowHealth = healthPercent < 30;
  const isCritical = healthPercent < 15;
  const isRecentDamage = Date.now() - lastDamage < 300;

  const getHealthColor = () => {
    if (healthPercent > 60) return 'bg-green-500';
    if (healthPercent > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
      <div className="pixel-font">
        <div className={cls(
            "text-[10px] text-white mb-1 tracking-wider",
            side === "left" ? "text-left" : "text-right"
        )}>
          {label}
        </div>

        <div className={cls(
            "relative bg-black border-4 border-gray-700 p-1",
            isRecentDamage && "animate-pulse"
        )} style={{
          width: '300px',
          height: '32px',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
          imageRendering: 'pixelated'
        }}>
          <div className="absolute inset-1 opacity-20" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }} />

          {isRecentDamage && (
              <div className="absolute inset-0 bg-red-500 opacity-60 animate-ping" style={{ animationDuration: '0.3s' }} />
          )}

          <div
              className={cls(
                  "relative h-full transition-all duration-300",
                  getHealthColor(),
                  isCritical && "animate-pulse"
              )}
              style={{
                width: `${healthPercent}%`,
                boxShadow: isLowHealth ? '0 0 10px currentColor' : 'none',
                imageRendering: 'pixelated'
              }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/20" />
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.2) 8px, rgba(0,0,0,0.2) 10px)',
            }} />
          </div>

          <div className={cls(
              "absolute inset-0 flex items-center justify-center text-white text-[12px] font-black",
              "drop-shadow-[2px_2px_0_rgba(0,0,0,1)]",
              isCritical && "animate-pulse"
          )} style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
            {Math.round(health)}
          </div>

          {isCritical && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] text-red-500 font-black animate-bounce">
                ⚠️ DANGER
              </div>
          )}
        </div>
      </div>
  );
}

function TokenShield({ label = "SOL", tone = "#14F195", isActive = false, isWinning = false, isLosing = false, marketChange = 0 }) {
  const changeIntensity = Math.min(Math.abs(marketChange) / 10, 1);
  const isMoving = Math.abs(marketChange) > 0.5;
  const isPumping = marketChange > 2;
  const isDumping = marketChange < -2;

  return (
      <div className="relative">
        {isActive && (
            <div
                className="absolute inset-0 blur-3xl opacity-60 animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${tone} 0%, transparent 70%)`,
                  transform: 'scale(1.5)'
                }}
            />
        )}

        <div className={cls(
            "relative animate-float transition-all duration-500",
            isActive && 'scale-110',
            isPumping && 'scale-125',
            isDumping && 'scale-95'
        )}>
          <img
              src={`/images/${label.toLowerCase()}_logo.png`}
              className="w-20 h-20 drop-shadow-[0_0_10px_rgba(0,0,0,0.6)] transition-all duration-500"
              style={{
                filter: `contrast(1.05) ${isActive ? 'brightness(1.2)' : ''} ${isPumping ? 'brightness(1.4) saturate(1.5)' : ''} ${isDumping ? 'brightness(0.7) saturate(0.5)' : ''}`,
              }}
          />
        </div>

        {isMoving && (
            <div className={cls(
                "absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 font-bold text-[8px] pixel-font",
                "border-2 transition-all duration-300",
                marketChange > 0
                    ? "bg-green-500 text-black border-green-700"
                    : "bg-red-500 text-white border-red-700"
            )}
                 style={{
                   boxShadow: '2px 2px 0 rgba(0,0,0,0.5)',
                   animation: 'blink 1s infinite',
                   imageRendering: 'pixelated'
                 }}>
              {marketChange > 0 ? '+' : ''}{marketChange.toFixed(1)}%
            </div>
        )}
      </div>
  );
}

export default function ArenaFrame({
                                     poster,
                                     aspect = "16/9",
                                     leftToken = { label: "SOLANA", tone: "#14F195" },
                                     rightToken = { label: "BNB", tone: "#F0B90B" },
                                     arenaImage = "/images/arena.png",
                                     arenaFit = "cover",
                                     arenaOpacity = 1,
                                     fullHeight = true,
                                     testingMode = true,
                                     syncMode = true,
                                     serverUrl = "https://arena-server-gh2h.onrender.com",
                                     videos = {
                                       idle: "/videos/solana-vs-bnb.mp4",
                                       solPump: "/videos/sol-winning.mp4",
                                       bnbPump: "/videos/bnb-winning.mp4",
                                       solDump: "/videos/sol-losing.mp4",
                                       bnbDump: "/videos/bnb-losing.mp4",
                                       bothPump: "/videos/both-pumping.mp4",
                                       bothDump: "/videos/both-dumping.mp4",
                                       solBack: "/videos/sol-back-to-stance.mp4",
                                       bnbBack: "/videos/bnb-back-to-stance.mp4",
                                       bothBack: "/videos/both-back-to-stance.mp4",
                                     },
                                     cryptoConfig = {
                                       enabled: false,
                                       solanaTokenAddress: "",
                                       bnbTokenAddress: "",
                                       checkInterval: 30000,
                                       pumpThreshold: 5,
                                       dumpThreshold: -5,
                                     },
                                   }) {
  // 🎬 SINGLE VIDEO REF
  const videoRef = useRef(null);

  const [loaded, setLoaded] = useState(false);
  const [arenaLoaded, setArenaLoaded] = useState(true);
  const [currentScenario, setCurrentScenario] = useState("idle");
  const [pendingScenario, setPendingScenario] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastScenarioChangeRef = useRef(0);
  const isLoadingRef = useRef(false);
  const currentScenarioRef = useRef("idle");
  const [marketData, setMarketData] = useState({
    sol: { price: 0, change24h: 0 },
    bnb: { price: 0, change24h: 0 },
  });

  const [health, setHealth] = useState({
    sol: 100,
    bnb: 100,
  });
  const [lastDamage, setLastDamage] = useState({
    sol: 0,
    bnb: 0,
  });

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);

  // Keep ref in sync with state
  useEffect(() => {
    currentScenarioRef.current = currentScenario;
  }, [currentScenario]);

  // 🌐 WEBSOCKET CONNECTION
  useEffect(() => {
    if (!syncMode) return;

    const socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to Arena Server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from Arena Server');
      setIsConnected(false);
    });

    socket.on('initial_state', (state) => {
      console.log('📦 Received initial state:', state);
      setCurrentScenario(state.currentScenario);
      setHealth(state.health);
      setMarketData(state.marketData);
      setLastDamage(state.lastDamage);
      setPendingScenario(state.pendingScenario);
      setIsTransitioning(state.isTransitioning);
    });

    socket.on('state_update', (update) => {
      if (update.health) setHealth(update.health);
      if (update.marketData) setMarketData(update.marketData);
      if (update.lastDamage) setLastDamage(update.lastDamage);
      if (update.pendingScenario !== undefined) setPendingScenario(update.pendingScenario);
      if (update.isTransitioning !== undefined) setIsTransitioning(update.isTransitioning);
    });

    socket.on('scenario_change', ({ scenario }) => {
      console.log('🎬 Scenario change from server:', scenario, 'current:', currentScenarioRef.current);

      // Ignore if same scenario
      if (scenario === currentScenarioRef.current) {
        console.log('⚠️ Same scenario, ignoring');
        return;
      }

      // Cooldown check - minimum 500ms između promjena
      const now = Date.now();
      if (now - lastScenarioChangeRef.current < 500) {
        console.log('⚠️ Scenario change too fast, ignoring');
        return;
      }

      lastScenarioChangeRef.current = now;
      setCurrentScenario(scenario);
    });

    socket.on('user_count', (count) => {
      setUserCount(count);
    });

    return () => {
      socket.disconnect();
    };
  }, [syncMode, serverUrl]);

  // 🎬 VIDEO SWITCHING - SINGLE VIDEO
  useEffect(() => {
    if (!currentScenario || !videoRef.current) return;

    // Prevent loading if already loading
    if (isLoadingRef.current) {
      console.log('⚠️ Video already loading, skipping');
      return;
    }

    console.log(`📺 Switching to: ${currentScenario}`);

    const videoSrc = videos[currentScenario];
    if (!videoSrc) {
      console.warn(`⚠️ Video not found for: ${currentScenario}`);
      return;
    }

    // Reset loaded state
    setLoaded(false);
    isLoadingRef.current = true;

    // Set video properties
    videoRef.current.src = videoSrc;
    videoRef.current.loop = currentScenario === "idle";
    videoRef.current.load();

    const handleLoadedData = () => {
      console.log(`✅ Video loaded: ${currentScenario}`);
      setLoaded(true);
      isLoadingRef.current = false;

      videoRef.current.play()
          .then(() => console.log(`▶️ Playing: ${currentScenario}`))
          .catch(err => {
            console.error("Video play error:", err);
            isLoadingRef.current = false;
          });
    };

    const handleError = (e) => {
      console.error(`❌ Video load error for ${currentScenario}:`, e);
      isLoadingRef.current = false;
      setLoaded(true); // Show video anyway
    };

    videoRef.current.addEventListener('loadeddata', handleLoadedData);
    videoRef.current.addEventListener('error', handleError);

    // Cleanup
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadeddata', handleLoadedData);
        videoRef.current.removeEventListener('error', handleError);
      }
    };

  }, [currentScenario, videos]);

  const getTokenStatus = (token) => {
    const isSol = token.label.toLowerCase().includes('sol');
    const scenario = currentScenario.toLowerCase();
    const isRelevantToken = scenario.includes(isSol ? 'sol' : 'bnb') || scenario.includes('both');

    return {
      isActive: isRelevantToken,
      isWinning: scenario.includes('pump') && isRelevantToken,
      isLosing: scenario.includes('dump') && isRelevantToken
    };
  };

  const handleVideoEnded = useCallback(() => {
    console.log("✅ Video ended:", currentScenario);

    if (pendingScenario) {
      setCurrentScenario(pendingScenario);
      setPendingScenario(null);
      setIsTransitioning(false);
      return;
    }

    if (currentScenario === "solPump" || currentScenario === "solDump") {
      setCurrentScenario("solBack");
      return;
    }

    if (currentScenario === "bnbPump" || currentScenario === "bnbDump") {
      setCurrentScenario("bnbBack");
      return;
    }

    if (currentScenario === "bothPump" || currentScenario === "bothDump") {
      setCurrentScenario("bothBack");
      return;
    }

    if (currentScenario === "solBack" || currentScenario === "bnbBack" || currentScenario === "bothBack") {
      setCurrentScenario("idle");
      setIsTransitioning(false);
      return;
    }

  }, [pendingScenario, currentScenario]);

  const handleScenarioChange = useCallback((newScenario) => {
    // Cooldown check
    const now = Date.now();
    if (now - lastScenarioChangeRef.current < 500) {
      console.log('⚠️ Scenario change too fast (manual), ignoring');
      return;
    }

    if (syncMode && socketRef.current && testingMode) {
      console.log(`🌐 Emitting test scenario: ${newScenario}`);
      lastScenarioChangeRef.current = now;
      socketRef.current.emit('test_scenario', newScenario);
      return;
    }

    if (isTransitioning || pendingScenario) {
      console.log("⚠️ Scenario change blocked");
      return;
    }

    if (newScenario === currentScenario) return;

    lastScenarioChangeRef.current = now;
    setPendingScenario(newScenario);
    setIsTransitioning(true);

    if (videoRef.current) {
      videoRef.current.loop = false;
    }
  }, [currentScenario, isTransitioning, pendingScenario, syncMode, testingMode]);

  useEffect(() => {
    if (!testingMode) return;

    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const keyMap = {
        '1': 'idle',
        '2': 'solPump',
        '3': 'bnbPump',
        '4': 'bothPump',
        '5': 'solDump',
        '6': 'bnbDump',
        '7': 'bothDump',
        ' ': () => {
          if (syncMode && socketRef.current) {
            socketRef.current.emit('reset_health');
          } else {
            setHealth({ sol: 100, bnb: 100 });
          }
        },
      };

      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        if (typeof action === 'function') {
          action();
        } else {
          handleScenarioChange(action);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [testingMode, handleScenarioChange, syncMode]);

  const shouldShake = currentScenario.includes('Pump') || currentScenario.includes('Dump');

  return (
      <section className={cls(
          "relative w-full h-screen grid place-items-center bg-[#0b0d10] overflow-hidden",
          shouldShake && 'animate-screen-shake'
      )}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-5px, 2px) rotate(-0.5deg); }
          20% { transform: translate(4px, -3px) rotate(0.5deg); }
          30% { transform: translate(-3px, 4px) rotate(-0.3deg); }
          40% { transform: translate(5px, -2px) rotate(0.4deg); }
          50% { transform: translate(-4px, 3px) rotate(-0.3deg); }
          60% { transform: translate(3px, -4px) rotate(0.5deg); }
          70% { transform: translate(-5px, 2px) rotate(-0.4deg); }
          80% { transform: translate(4px, -3px) rotate(0.3deg); }
          90% { transform: translate(-2px, 2px) rotate(-0.2deg); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-screen-shake { animation: screenShake 0.5s ease-in-out infinite; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        .scanlines {
          position: relative;
          overflow: hidden;
        }
        .scanlines::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          pointer-events: none;
          z-index: 100;
        }
      `}</style>

        <div className="absolute inset-0">
          {arenaImage && arenaLoaded ? (
              <>
                <img
                    src={arenaImage}
                    alt="arena background"
                    className="absolute inset-0 w-full h-full object-center select-none pointer-events-none blur-xl"
                    style={{ objectFit: arenaFit, opacity: arenaOpacity * 0.5 }}
                    onError={() => setArenaLoaded(false)}
                />
                <div className="absolute inset-0" style={{ boxShadow: "inset 0 -80px 150px rgba(0,0,0,0.5)" }} />
              </>
          ) : (
              <div className="absolute inset-0" style={{ background: '#0f1318' }} />
          )}
        </div>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="relative pixel-font">
            <div className="relative flex items-center gap-3 px-6 py-3 bg-black border-4 border-gray-800 scanlines">
              {syncMode && (
                  <>
                    <div className={cls(
                        "w-3 h-3",
                        isConnected ? "bg-green-500" : "bg-red-500"
                    )} style={{
                      animation: 'blink 2s infinite'
                    }} />
                    <span className={cls(
                        "text-[10px] tracking-widest",
                        isConnected ? "text-green-400" : "text-red-400"
                    )}>
                  {isConnected ? '🌐 SYNC' : '⚠️ OFFLINE'}
                </span>
                    {isConnected && userCount > 0 && (
                        <span className="text-[8px] text-gray-500">
                    [{userCount} 👥]
                  </span>
                    )}
                    <div className="w-1 h-4 bg-gray-600" />
                  </>
              )}

              <div className="w-3 h-3 bg-red-500" style={{ animation: 'blink 1s infinite' }} />
              <span className="text-[10px] text-yellow-400 tracking-widest">
              CRYPTO ARENA
            </span>
            </div>
          </div>
        </div>

        <div className="absolute top-20 left-6 z-20">
          <HealthBar
              health={health.sol}
              side="left"
              label="SOLANA"
              lastDamage={lastDamage.sol}
          />
        </div>

        <div className="absolute top-20 right-6 z-20">
          <HealthBar
              health={health.bnb}
              side="right"
              label="BNB"
              lastDamage={lastDamage.bnb}
          />
        </div>

        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
          <TokenShield
              {...leftToken}
              {...getTokenStatus(leftToken)}
              marketChange={marketData.sol.change24h}
          />
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
          <TokenShield
              {...rightToken}
              {...getTokenStatus(rightToken)}
              marketChange={marketData.bnb.change24h}
          />
        </div>

        <div className="relative z-10" style={{
          aspectRatio: aspect,
          width: fullHeight ? "auto" : "min(92vw, 1100px)",
          height: fullHeight ? "calc(100vh - 180px)" : undefined
        }}>
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-b from-gray-800 via-gray-900 to-black border-8 border-gray-700 scanlines"
                 style={{
                   boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.8)'
                 }}
            />

            <div className="absolute -inset-2 bg-black border-4 border-gray-900" />

            <div className="relative w-full h-full overflow-hidden scanlines border-4 border-gray-800">
              {/* Loading Indicator */}
              {!loaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                    <div className="pixel-font text-yellow-400 text-[10px] animate-pulse">
                      LOADING...
                    </div>
                  </div>
              )}

              <video
                  ref={videoRef}
                  className="w-full h-full block object-cover"
                  playsInline
                  autoPlay
                  muted
                  loop
                  onEnded={handleVideoEnded}
                  style={{
                    imageRendering: 'pixelated',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.3s'
                  }}
              />

              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 2px, transparent 2px, transparent 4px)',
                zIndex: 10
              }} />
            </div>
          </div>
        </div>

        {testingMode && (
            <div className="absolute bottom-6 right-6 z-30 pixel-font">
              <div className="bg-black border-4 border-gray-700 scanlines p-3" style={{
                minWidth: '200px',
                boxShadow: '8px 8px 0 rgba(0,0,0,0.5)'
              }}>
                <div className="text-[8px] text-yellow-400 mb-3">🧪 TEST MODE</div>

                <div className="flex flex-col gap-2">
                  {[
                    { key: "idle", label: "IDLE", shortcut: "1" },
                    { key: "solPump", label: "SOL+", shortcut: "2" },
                    { key: "bnbPump", label: "BNB+", shortcut: "3" },
                    { key: "bothPump", label: "BOTH+", shortcut: "4" },
                    { key: "solDump", label: "SOL-", shortcut: "5" },
                    { key: "bnbDump", label: "BNB-", shortcut: "6" },
                    { key: "bothDump", label: "BOTH-", shortcut: "7" },
                  ].map(({ key, label, shortcut }) => {
                    const isActive = currentScenario === key;

                    return (
                        <button
                            key={key}
                            onClick={() => handleScenarioChange(key)}
                            className={cls(
                                "px-3 py-2 text-[8px] border-2",
                                isActive
                                    ? "bg-yellow-500 text-black border-yellow-700"
                                    : "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                            )}
                        >
                          {label} [{shortcut}]
                        </button>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t-2 border-gray-800">
                  <div className="text-[6px] text-gray-500">
                    <div>1-7: Scenarios</div>
                    <div>SPACE: Reset HP</div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </section>
  );
}
