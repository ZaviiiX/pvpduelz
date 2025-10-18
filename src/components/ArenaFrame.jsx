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
          </div>

          <div className={cls(
              "absolute inset-0 flex items-center justify-center text-white text-[12px] font-black",
              isCritical && "animate-pulse"
          )} style={{ textShadow: '2px 2px 0 #000' }}>
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

function TokenShield({ label = "SOL", tone = "#14F195", isActive = false, marketChange = 0 }) {
  const isMoving = Math.abs(marketChange) > 0.5;

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
            isActive && 'scale-110'
        )}>
          <img
              src={`/images/${label.toLowerCase()}_logo.png`}
              className="w-20 h-20 drop-shadow-[0_0_10px_rgba(0,0,0,0.6)]"
              alt={label}
          />
        </div>

        {isMoving && (
            <div className={cls(
                "absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 font-bold text-[8px] pixel-font border-2",
                marketChange > 0
                    ? "bg-green-500 text-black border-green-700"
                    : "bg-red-500 text-white border-red-700"
            )}
                 style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
              {marketChange > 0 ? '+' : ''}{marketChange.toFixed(1)}%
            </div>
        )}
      </div>
  );
}

export default function ArenaFrame({
                                     aspect = "16/9",
                                     leftToken = { label: "SOLANA", tone: "#14F195" },
                                     rightToken = { label: "BNB", tone: "#F0B90B" },
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
                                   }) {
  const video1Ref = useRef(null);
  const video2Ref = useRef(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // ✅ JOIN ARENA STATE
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [currentScenario, setCurrentScenario] = useState("idle");
  const [pendingScenario, setPendingScenario] = useState(null);
  const lastScenarioChangeRef = useRef(0);
  const currentScenarioRef = useRef("idle");

  const [health, setHealth] = useState({ sol: 100, bnb: 100 });
  const [lastDamage, setLastDamage] = useState({ sol: 0, bnb: 0 });
  const [marketData, setMarketData] = useState({
    sol: { price: 0, change24h: 0 },
    bnb: { price: 0, change24h: 0 },
  });

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    currentScenarioRef.current = currentScenario;
  }, [currentScenario]);

  // ✅ JOIN ARENA HANDLER
  const handleJoinArena = () => {
    setIsLoading(true);

    // Simulate loading (preload videa)
    setTimeout(() => {
      setHasJoined(true);
      setIsLoading(false);
    }, 1500);
  };

  useEffect(() => {
    if (!hasJoined) return; // ✅ Ne učitavaj dok ne join-uješ

    if (video1Ref.current && videos.idle) {
      video1Ref.current.src = videos.idle;
      video1Ref.current.loop = true;
      video1Ref.current.style.opacity = '1';
      video1Ref.current.style.zIndex = '2';
      video1Ref.current.load();
      video1Ref.current.play().catch(e => console.error("Initial play:", e));
    }
  }, [videos.idle, hasJoined]);

  // 🌐 WEBSOCKET
  useEffect(() => {
    if (!syncMode || !hasJoined) return; // ✅ Ne konektuj dok ne join-uješ

    const socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected');
      setIsConnected(false);
    });

    socket.on('initial_state', (state) => {
      setCurrentScenario(state.currentScenario);
      setHealth(state.health);
      setMarketData(state.marketData);
      setLastDamage(state.lastDamage);
      setPendingScenario(state.pendingScenario);
    });

    socket.on('state_update', (update) => {
      if (update.health) setHealth(update.health);
      if (update.marketData) setMarketData(update.marketData);
      if (update.lastDamage) setLastDamage(update.lastDamage);
      if (update.pendingScenario !== undefined) setPendingScenario(update.pendingScenario);
    });

    socket.on('scenario_change', ({ scenario }) => {
      if (scenario === currentScenarioRef.current) return;
      console.log('🎬 Server:', scenario);
      setCurrentScenario(scenario);
    });

    socket.on('user_count', (count) => setUserCount(count));

    return () => socket.disconnect();
  }, [syncMode, serverUrl, hasJoined]);

  // 🎬 VIDEO SWITCHING
  useEffect(() => {
    if (!hasJoined) return;

    const videoSrc = videos[currentScenario];
    if (!videoSrc) return;

    const currentVideo = activeVideoIndex === 0 ? video1Ref.current : video2Ref.current;
    const nextVideo = activeVideoIndex === 0 ? video2Ref.current : video1Ref.current;

    if (!nextVideo || !currentVideo) return;

    console.log(`🎬 ${currentScenario}`);

    nextVideo.src = videoSrc;
    nextVideo.loop = currentScenario === "idle";
    nextVideo.preload = "auto";
    nextVideo.load();

    const handleCanPlay = () => {
      nextVideo.currentTime = 0;

      nextVideo.play().then(() => {
        console.log(`▶️ Playing: ${currentScenario}`);

        currentVideo.style.opacity = '0';
        currentVideo.style.zIndex = '1';
        nextVideo.style.opacity = '1';
        nextVideo.style.zIndex = '2';

        setActiveVideoIndex(prev => prev === 0 ? 1 : 0);

        setTimeout(() => {
          currentVideo.pause();
          currentVideo.currentTime = 0;
        }, 100);

      }).catch(e => console.error("❌ Play error:", e));
    };

    nextVideo.addEventListener('canplaythrough', handleCanPlay, { once: true });

    return () => {
      nextVideo.removeEventListener('canplaythrough', handleCanPlay);
    };

  }, [currentScenario, hasJoined]);

  const handleVideoEnded = useCallback(() => {
    console.log('🏁 END:', currentScenario);

    let nextScenario = null;

    if (pendingScenario) {
      nextScenario = pendingScenario;
      setCurrentScenario(pendingScenario);
      setPendingScenario(null);
    } else if (currentScenario.includes("Pump") || currentScenario.includes("Dump")) {
      const token = currentScenario.includes("sol") ? "sol" :
          currentScenario.includes("bnb") ? "bnb" : "both";
      nextScenario = `${token}Back`;
      setCurrentScenario(nextScenario);
    } else if (currentScenario.includes("Back")) {
      nextScenario = "idle";
      setCurrentScenario(nextScenario);
    }

    if (nextScenario && syncMode && socketRef.current && testingMode) {
      socketRef.current.emit('video_ended', {
        scenario: currentScenario,
        nextScenario: nextScenario
      });
    }
  }, [pendingScenario, currentScenario, syncMode, testingMode]);

  useEffect(() => {
    if (!hasJoined) return;

    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (video1) video1.addEventListener('ended', handleVideoEnded);
    if (video2) video2.addEventListener('ended', handleVideoEnded);

    return () => {
      if (video1) video1.removeEventListener('ended', handleVideoEnded);
      if (video2) video2.removeEventListener('ended', handleVideoEnded);
    };
  }, [handleVideoEnded, hasJoined]);

  const getTokenStatus = (token) => {
    const isSol = token.label.toLowerCase().includes('sol');
    const scenario = currentScenario.toLowerCase();
    const isRelevantToken = scenario.includes(isSol ? 'sol' : 'bnb') || scenario.includes('both');

    return { isActive: isRelevantToken };
  };

  const handleScenarioChange = useCallback((newScenario) => {
    const now = Date.now();
    if (now - lastScenarioChangeRef.current < 500) return;

    if (syncMode && socketRef.current && testingMode) {
      console.log('🎮 Button:', newScenario);
      lastScenarioChangeRef.current = now;
      socketRef.current.emit('test_scenario', newScenario);
      return;
    }

    if (newScenario === currentScenario) return;

    lastScenarioChangeRef.current = now;
    setPendingScenario(newScenario);

    const currentVideo = activeVideoIndex === 0 ? video1Ref.current : video2Ref.current;
    if (currentVideo) currentVideo.loop = false;
  }, [currentScenario, syncMode, testingMode, activeVideoIndex]);

  useEffect(() => {
    if (!testingMode || !hasJoined) return;

    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const keyMap = {
        '1': 'idle', '2': 'solPump', '3': 'bnbPump', '4': 'bothPump',
        '5': 'solDump', '6': 'bnbDump', '7': 'bothDump',
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
        if (typeof action === 'function') action();
        else handleScenarioChange(action);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [testingMode, handleScenarioChange, syncMode, hasJoined]);

  const shouldShake = currentScenario.includes('Pump') || currentScenario.includes('Dump');

  // ✅ JOIN ARENA SCREEN
  if (!hasJoined) {
    return (
        <section className="relative w-full h-screen flex items-center justify-center bg-[#0b0d10] overflow-hidden">
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-15px); }
            }
            @keyframes blink {
              0%, 49% { opacity: 1; }
              50%, 100% { opacity: 0; }
            }
            @keyframes pulse-glow {
              0%, 100% { box-shadow: 0 0 20px rgba(20, 241, 149, 0.5), 0 0 40px rgba(20, 241, 149, 0.3); }
              50% { box-shadow: 0 0 30px rgba(20, 241, 149, 0.8), 0 0 60px rgba(20, 241, 149, 0.5); }
            }
            @keyframes slideIn {
              from { transform: translateY(-30px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .pixel-font { font-family: 'Press Start 2P', monospace; }
            .animate-float { animation: float 3s ease-in-out infinite; }
            .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
            .animate-slide-in { animation: slideIn 0.8s ease-out; }
          `}</style>

          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c0f] via-[#0f1318] to-[#1a1f28]" />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `repeating-linear-gradient(0deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px)`,
            backgroundSize: '40px 40px'
          }} />

          {/* Vignette */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.7) 100%)'
          }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-12 animate-slide-in">

            {/* Title */}
            <div className="text-center">
              <div className="pixel-font text-[#14F195] text-[32px] mb-4" style={{
                textShadow: '4px 4px 0 rgba(0,0,0,0.8), 0 0 20px rgba(20, 241, 149, 0.5)'
              }}>
                CRYPTO ARENA
              </div>
              <div className="pixel-font text-yellow-400 text-[12px]" style={{
                textShadow: '2px 2px 0 rgba(0,0,0,0.8)'
              }}>
                LIVE BATTLE ROYALE
              </div>
            </div>

            {/* Token Logos */}
            <div className="flex items-center gap-16">
              <div className="animate-float">
                <img src="/images/solana_logo.png" alt="Solana" className="w-24 h-24 drop-shadow-[0_0_20px_rgba(20,241,149,0.6)]" />
              </div>
              <div className="pixel-font text-[48px] text-red-500" style={{
                textShadow: '4px 4px 0 rgba(0,0,0,0.8)'
              }}>
                VS
              </div>
              <div className="animate-float" style={{ animationDelay: '0.5s' }}>
                <img src="/images/bnb_logo.png" alt="BNB" className="w-24 h-24 drop-shadow-[0_0_20px_rgba(240,185,11,0.6)]" />
              </div>
            </div>

            {/* Join Button */}
            {!isLoading ? (
                <button
                    onClick={handleJoinArena}
                    className="pixel-font text-[16px] px-12 py-6 bg-[#14F195] text-black border-4 border-[#0ea270]
                             hover:bg-[#0ea270] hover:scale-105 active:scale-95
                             transition-all duration-200 animate-pulse-glow cursor-pointer"
                    style={{
                      textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
                      boxShadow: '6px 6px 0 rgba(0,0,0,0.5)'
                    }}
                >
                  JOIN ARENA
                </button>
            ) : (
                <div className="pixel-font text-[16px] px-12 py-6 bg-gray-700 text-white border-4 border-gray-600"
                     style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.5)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-[#14F195]" style={{ animation: 'blink 0.8s infinite' }} />
                    LOADING...
                  </div>
                </div>
            )}

            {/* Info */}
            <div className="pixel-font text-[8px] text-gray-500 text-center max-w-md">
              <div style={{ animation: 'blink 2s infinite' }}>▼ PRESS TO ENTER ▼</div>
            </div>
          </div>

          {/* Bottom decoration */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pixel-font text-[8px] text-gray-600">
            POWERED BY BLOCKCHAIN TECHNOLOGY
          </div>
        </section>
    );
  }

  // ✅ MAIN ARENA (nakon join-a)
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
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5px, 2px); }
          20% { transform: translate(4px, -3px); }
          30% { transform: translate(-3px, 4px); }
          40% { transform: translate(5px, -2px); }
          50% { transform: translate(-4px, 3px); }
          60% { transform: translate(3px, -4px); }
          70% { transform: translate(-5px, 2px); }
          80% { transform: translate(4px, -3px); }
          90% { transform: translate(-2px, 2px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-screen-shake { animation: screenShake 0.5s ease-in-out infinite; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }
      `}</style>

        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c0f] via-[#0f1318] to-[#1a1f28]" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(0deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.5) 100%)'
        }} />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pixel-font">
          <div className="relative flex items-center gap-3 px-6 py-3 bg-black border-4 border-gray-800">
            {syncMode && (
                <>
                  <div className={cls("w-3 h-3", isConnected ? "bg-green-500" : "bg-red-500")}
                       style={{ animation: 'blink 2s infinite' }} />
                  <span className={cls("text-[10px]", isConnected ? "text-green-400" : "text-red-400")}>
                    {isConnected ? '🌐 SYNC' : '⚠️ OFFLINE'}
                  </span>
                  {isConnected && userCount > 0 && <span className="text-[8px] text-gray-500">[{userCount} 👥]</span>}
                  <div className="w-1 h-4 bg-gray-600" />
                </>
            )}
            <div className="w-3 h-3 bg-red-500" style={{ animation: 'blink 1s infinite' }} />
            <span className="text-[10px] text-yellow-400">CRYPTO ARENA</span>
          </div>
        </div>

        <div className="absolute top-20 left-6 z-20">
          <HealthBar health={health.sol} side="left" label="SOLANA" lastDamage={lastDamage.sol} />
        </div>

        <div className="absolute top-20 right-6 z-20">
          <HealthBar health={health.bnb} side="right" label="BNB" lastDamage={lastDamage.bnb} />
        </div>

        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
          <TokenShield {...leftToken} {...getTokenStatus(leftToken)} marketChange={marketData.sol.change24h} />
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
          <TokenShield {...rightToken} {...getTokenStatus(rightToken)} marketChange={marketData.bnb.change24h} />
        </div>

        <div style={{
          position: 'relative', zIndex: 10, aspectRatio: aspect,
          width: fullHeight ? "auto" : "min(92vw, 1100px)",
          height: fullHeight ? "calc(100vh - 180px)" : undefined,
          maxWidth: "min(92vw, 1600px)",
          maxHeight: fullHeight ? "calc(100vh - 180px)" : undefined
        }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{
              position: 'absolute', inset: '-2rem',
              background: 'linear-gradient(to bottom, rgb(31, 41, 55), rgb(17, 24, 39), rgb(0, 0, 0))',
              border: '8px solid rgb(55, 65, 81)',
              boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.8)'
            }} />

            <div style={{
              position: 'absolute', inset: '-0.5rem',
              background: 'black', border: '4px solid rgb(17, 24, 39)'
            }} />

            <div style={{
              position: 'relative', width: '100%', height: '100%',
              overflow: 'hidden', border: '4px solid rgb(31, 41, 55)'
            }}>
              <video ref={video1Ref} playsInline muted preload="auto"
                     style={{
                       position: 'absolute', top: 0, left: 0,
                       width: '100%', height: '100%', objectFit: 'cover',
                       opacity: 0, zIndex: 1
                     }} />

              <video ref={video2Ref} playsInline muted preload="auto"
                     style={{
                       position: 'absolute', top: 0, left: 0,
                       width: '100%', height: '100%', objectFit: 'cover',
                       opacity: 0, zIndex: 1
                     }} />

              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 2px, transparent 2px, transparent 4px)',
                pointerEvents: 'none', zIndex: 10
              }} />
            </div>
          </div>
        </div>

        {testingMode && (
            <div className="absolute bottom-6 right-6 z-30 pixel-font">
              <div className="bg-black border-4 border-gray-700 p-3" style={{ minWidth: '200px' }}>
                <div className="text-[8px] text-yellow-400 mb-3">
                  🧪 TEST | {currentScenario}
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { key: "idle", label: "IDLE", s: "1" },
                    { key: "solPump", label: "SOL+", s: "2" },
                    { key: "bnbPump", label: "BNB+", s: "3" },
                    { key: "bothPump", label: "BOTH+", s: "4" },
                    { key: "solDump", label: "SOL-", s: "5" },
                    { key: "bnbDump", label: "BNB-", s: "6" },
                    { key: "bothDump", label: "BOTH-", s: "7" },
                  ].map(({ key, label, s }) => (
                      <button key={key} onClick={() => handleScenarioChange(key)}
                              className={cls("px-3 py-2 text-[8px] border-2",
                                  currentScenario === key
                                      ? "bg-yellow-500 text-black border-yellow-700"
                                      : "bg-gray-800 text-white border-gray-600"
                              )}>
                        {label} [{s}]
                      </button>
                  ))}
                </div>
              </div>
            </div>
        )}
      </section>
  );
}
