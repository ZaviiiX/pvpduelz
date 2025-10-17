// components/ArenaFrame.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";

const cls = (...c) => c.filter(Boolean).join(" ");

// 💚 HEALTH BAR COMPONENT (Street Fighter style)
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

        {isMoving && (
            <div
                className="absolute inset-0 blur-2xl transition-all duration-1000"
                style={{
                  background: `radial-gradient(circle, ${marketChange > 0 ? '#00ff00' : '#ff0000'} 0%, transparent 70%)`,
                  opacity: changeIntensity * 0.8,
                  transform: `scale(${1.3 + changeIntensity * 0.7})`,
                  animation: 'pulse 2s ease-in-out infinite'
                }}
            />
        )}

        {isPumping && (
            <div className="absolute inset-0 animate-spin-slow">
              <svg viewBox="0 0 120 120" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 10px #00ff00)' }}>
                <circle
                    cx="60"
                    cy="60"
                    r="55"
                    fill="none"
                    stroke="#00ff00"
                    strokeWidth="3"
                    strokeDasharray={`${changeIntensity * 300} ${400 - changeIntensity * 300}`}
                    strokeLinecap="round"
                    opacity={changeIntensity}
                />
              </svg>
            </div>
        )}

        {isDumping && (
            <div className="absolute inset-0 animate-spin" style={{ animationDirection: 'reverse' }}>
              <svg viewBox="0 0 120 120" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 10px #ff0000)' }}>
                <circle
                    cx="60"
                    cy="60"
                    r="55"
                    fill="none"
                    stroke="#ff0000"
                    strokeWidth="3"
                    strokeDasharray={`${changeIntensity * 300} ${400 - changeIntensity * 300}`}
                    strokeLinecap="round"
                    opacity={changeIntensity}
                />
              </svg>
            </div>
        )}

        {isPumping && (
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                  <div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-green-400"
                      style={{
                        top: '50%',
                        left: '50%',
                        animation: `energyShoot${i % 4} 1.5s ease-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                        opacity: changeIntensity,
                        boxShadow: '0 0 10px #00ff00'
                      }}
                  />
              ))}
            </div>
        )}

        {isMoving && (
            <div
                className="absolute inset-0 opacity-40 transition-opacity duration-500"
                style={{
                  opacity: changeIntensity * 0.6,
                  filter: `drop-shadow(0 0 5px ${marketChange > 0 ? '#00ff00' : '#ff0000'})`
                }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <pattern id={`hex-${label}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <polygon
                        points="10,2 18,7 18,13 10,18 2,13 2,7"
                        fill="none"
                        stroke={marketChange > 0 ? '#00ff00' : '#ff0000'}
                        strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <circle cx="50" cy="50" r="45" fill={`url(#hex-${label})`} />
              </svg>
            </div>
        )}

        {isWinning && (
            <>
              <div className="absolute inset-0 animate-ping opacity-30">
                <div className="w-full h-full rounded-full" style={{ background: `radial-gradient(circle, ${tone} 0%, transparent 70%)` }} />
              </div>
              {[...Array(6)].map((_, i) => (
                  <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full animate-sparkle"
                      style={{
                        background: tone,
                        top: '50%',
                        left: '50%',
                        animation: `sparkle${i} 2s infinite`,
                        animationDelay: `${i * 0.3}s`
                      }}
                  />
              ))}
            </>
        )}

        {isLosing && (
            <div className="absolute inset-0 animate-shake">
              <div
                  className="w-full h-full opacity-40"
                  style={{
                    background: `radial-gradient(circle, #ff0000 0%, transparent 70%)`,
                    filter: 'blur(20px)'
                  }}
              />
            </div>
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
                transform: `scale(${1 + changeIntensity * 0.2}) ${isWinning ? 'scale(1.1)' : isLosing ? 'scale(0.95)' : ''}`,
                animation: isPumping ? 'energyPulse 0.5s ease-in-out infinite' : isDumping ? 'drainPulse 0.8s ease-in-out infinite' : undefined
              }}
          />

          {isWinning && (
              <div className="absolute inset-0 animate-spin-slow">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={tone}
                      strokeWidth="2"
                      strokeDasharray="10 5"
                      opacity="0.6"
                  />
                </svg>
              </div>
          )}
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

        {(isWinning || isLosing) && (
            <div className={cls(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] font-bold pixel-font border-2",
                isWinning ? 'bg-green-500 text-black border-green-700' : 'bg-red-500 text-white border-red-700'
            )}
                 style={{
                   animation: 'blink 0.5s infinite',
                   boxShadow: '2px 2px 0 rgba(0,0,0,0.5)',
                   imageRendering: 'pixelated'
                 }}>
              {isWinning ? 'PUMP' : 'DUMP'}
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
  // 🎬 DUAL VIDEO REFS FOR CROSSFADE
  const videoRef = useRef(null);
  const videoRef2 = useRef(null);
  const [activeVideo, setActiveVideo] = useState(1);

  const [loaded, setLoaded] = useState(false);
  const [arenaLoaded, setArenaLoaded] = useState(true);
  const [currentScenario, setCurrentScenario] = useState("idle");
  const [pendingScenario, setPendingScenario] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
  const [serverTime, setServerTime] = useState(0);

  // 🌐 WEBSOCKET CONNECTION
  useEffect(() => {
    if (!syncMode) return;

    console.log('🔌 Connecting to server:', serverUrl);
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
      setServerTime(state.videoTime);

      // Sync both videos just in case
      if (videoRef.current && state.videoTime > 0) {
        videoRef.current.currentTime = state.videoTime;
      }
      if (videoRef2.current && state.videoTime > 0) {
        videoRef2.current.currentTime = state.videoTime;
      }
    });

    socket.on('state_update', (update) => {
      console.log('🔄 State update:', update);
      if (update.health) setHealth(update.health);
      if (update.marketData) setMarketData(update.marketData);
      if (update.lastDamage) setLastDamage(update.lastDamage);
      if (update.pendingScenario !== undefined) setPendingScenario(update.pendingScenario);
      if (update.isTransitioning !== undefined) setIsTransitioning(update.isTransitioning);
    });

    socket.on('scenario_change', ({ scenario, timestamp }) => {
      console.log('🎬 Scenario change:', scenario);
      setCurrentScenario(scenario);
      setServerTime(0);
    });

    socket.on('video_sync', ({ scenario, time }) => {
      setServerTime(time);

      // Sync active video
      if (videoRef.current && videoRef.current.style.opacity === '1') {
        if (Math.abs(videoRef.current.currentTime - time) > 2) {
          console.log(`⏰ Syncing video 1: ${videoRef.current.currentTime.toFixed(1)}s → ${time.toFixed(1)}s`);
          videoRef.current.currentTime = time;
        }
      }
      if (videoRef2.current && videoRef2.current.style.opacity === '1') {
        if (Math.abs(videoRef2.current.currentTime - time) > 2) {
          console.log(`⏰ Syncing video 2: ${videoRef2.current.currentTime.toFixed(1)}s → ${time.toFixed(1)}s`);
          videoRef2.current.currentTime = time;
        }
      }
    });

    socket.on('user_count', (count) => {
      setUserCount(count);
    });

    return () => {
      console.log('🔌 Disconnecting from server');
      socket.disconnect();
    };
  }, [syncMode, serverUrl]); // ✅ UKLONJEN activeVideo

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
      console.log(`🎬 Switching to pending: ${pendingScenario}`);
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

    if (currentScenario === "idle") {
      const currentRef = activeVideo === 1 ? videoRef : videoRef2;
      if (currentRef.current) {
        currentRef.current.play();
      }
    }
  }, [pendingScenario, currentScenario, activeVideo]);

  const handleScenarioChange = useCallback((newScenario) => {
    if (syncMode && socketRef.current && testingMode) {
      console.log(`🌐 Emitting test scenario to server: ${newScenario}`);
      socketRef.current.emit('test_scenario', newScenario);
      return;
    }

    if (isTransitioning || pendingScenario) {
      console.log("⚠️ Scenario change blocked - already transitioning");
      return;
    }

    if (newScenario === currentScenario) return;

    console.log(`🎬 Scenario change requested: ${currentScenario} → ${newScenario}`);
    setPendingScenario(newScenario);
    setIsTransitioning(true);

    const currentRef = activeVideo === 1 ? videoRef : videoRef2;
    if (currentRef.current) {
      currentRef.current.loop = false;
    }
  }, [currentScenario, isTransitioning, pendingScenario, syncMode, testingMode, activeVideo]);

  useEffect(() => {
    if (!cryptoConfig.enabled) return;

    const checkMarketData = async () => {
      try {
        const solChange = marketData.sol.change24h;
        const bnbChange = marketData.bnb.change24h;
        let newScenario = "idle";

        if (solChange > cryptoConfig.pumpThreshold && bnbChange > cryptoConfig.pumpThreshold) {
          newScenario = "bothPump";
        } else if (solChange < cryptoConfig.dumpThreshold && bnbChange < cryptoConfig.dumpThreshold) {
          newScenario = "bothDump";
        } else if (solChange > cryptoConfig.pumpThreshold) {
          newScenario = "solPump";
        } else if (bnbChange > cryptoConfig.pumpThreshold) {
          newScenario = "bnbPump";
        } else if (solChange < cryptoConfig.dumpThreshold) {
          newScenario = "solDump";
        } else if (bnbChange < cryptoConfig.dumpThreshold) {
          newScenario = "bnbDump";
        }

        if (newScenario !== currentScenario) {
          handleScenarioChange(newScenario);
        }
      } catch (error) {
        console.error("Error fetching market data:", error);
      }
    };

    checkMarketData();
    const interval = setInterval(checkMarketData, cryptoConfig.checkInterval);
    return () => clearInterval(interval);
  }, [cryptoConfig, marketData, currentScenario, handleScenarioChange]);

  // 🎬 DUAL VIDEO SWITCHING WITH CROSSFADE
  // 🎬 DUAL VIDEO SWITCHING WITH CROSSFADE
  useEffect(() => {
    if (currentScenario) {
      console.log(`📺 Loading new video: ${currentScenario}`);

      const videoSrc = videos[currentScenario];
      if (!videoSrc) {
        console.warn(`⚠️ Video not found for scenario: ${currentScenario}`);
        if (currentScenario.includes("Back")) {
          setCurrentScenario("idle");
          setIsTransitioning(false);
        }
        return;
      }

      // Determine which video to switch to
      setActiveVideo(prev => {
        const nextActive = prev === 1 ? 2 : 1;
        const currentRef = prev === 1 ? videoRef : videoRef2;
        const nextRef = prev === 1 ? videoRef2 : videoRef;

        if (nextRef.current) {
          nextRef.current.src = videoSrc;
          nextRef.current.loop = currentScenario === "idle";
          nextRef.current.load();

          nextRef.current.onloadeddata = () => {
            nextRef.current.play().then(() => {
              console.log(`▶️ Playing: ${currentScenario}`);

              // Crossfade
              if (currentRef.current) {
                currentRef.current.style.opacity = '0';
              }
              nextRef.current.style.opacity = '1';

              // Cleanup old video after fade
              setTimeout(() => {
                if (currentRef.current) {
                  currentRef.current.pause();
                  currentRef.current.currentTime = 0;
                }
                setLoaded(true);
              }, 300);
            }).catch(err => console.error("Video play error:", err));
          };
        }

        return nextActive;
      });
    }
  }, [currentScenario, videos]); // ✅ UKLONJEN activeVideo

  useEffect(() => {
    setHealth(prev => {
      const newHealth = { ...prev };

      if (marketData.sol.change24h > 2) {
        newHealth.sol = Math.min(100, prev.sol + 5);
      } else if (marketData.sol.change24h < -2) {
        const damage = Math.abs(marketData.sol.change24h) * 2;
        newHealth.sol = Math.max(0, prev.sol - damage);
        setLastDamage(ld => ({ ...ld, sol: Date.now() }));
      }

      if (marketData.bnb.change24h > 2) {
        newHealth.bnb = Math.min(100, prev.bnb + 5);
      } else if (marketData.bnb.change24h < -2) {
        const damage = Math.abs(marketData.bnb.change24h) * 2;
        newHealth.bnb = Math.max(0, prev.bnb - damage);
        setLastDamage(ld => ({ ...ld, bnb: Date.now() }));
      }

      return newHealth;
    });
  }, [marketData]);

  const isFlashing = (
      (Date.now() - lastDamage.sol < 300 && health.sol > 0) ||
      (Date.now() - lastDamage.bnb < 300 && health.bnb > 0)
  );

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
        'q': () => !syncMode && setMarketData(prev => ({ ...prev, sol: { ...prev.sol, change24h: 8.5 } })),
        'w': () => !syncMode && setMarketData(prev => ({ ...prev, bnb: { ...prev.bnb, change24h: 6.2 } })),
        'a': () => !syncMode && setMarketData(prev => ({ ...prev, sol: { ...prev.sol, change24h: -5.3 } })),
        's': () => !syncMode && setMarketData(prev => ({ ...prev, bnb: { ...prev.bnb, change24h: -4.1 } })),
        'r': () => !syncMode && setMarketData({ sol: { price: 0, change24h: 0 }, bnb: { price: 0, change24h: 0 } }),
        ' ': () => {
          if (syncMode && socketRef.current) {
            socketRef.current.emit('reset_health');
          } else {
            setHealth({ sol: 100, bnb: 100 });
          }
        },
        'h': () => {
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
  }, [testingMode, handleScenarioChange, setMarketData, syncMode]);

  const shouldShake = currentScenario.includes('Pump') || currentScenario.includes('Dump');
  const shakeIntensity = currentScenario.includes('both') ? 'intense' : 'normal';

  return (
      <section className={cls(
          "relative w-full h-screen grid place-items-center bg-[#0b0d10] overflow-hidden",
          shouldShake && (shakeIntensity === 'intense' ? 'animate-screen-shake-intense' : 'animate-screen-shake')
      )}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        * {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes energyPulse {
          0%, 100% { filter: brightness(1.4) saturate(1.5); }
          50% { filter: brightness(1.8) saturate(2); }
        }
        @keyframes drainPulse {
          0%, 100% { filter: brightness(0.7) saturate(0.5); }
          50% { filter: brightness(0.5) saturate(0.3); }
        }
        @keyframes energyShoot0 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(-80px) scale(1.5); opacity: 0; }
        }
        @keyframes energyShoot1 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateX(80px) scale(1.5); opacity: 0; }
        }
        @keyframes energyShoot2 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(80px) scale(1.5); opacity: 0; }
        }
        @keyframes energyShoot3 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateX(-80px) scale(1.5); opacity: 0; }
        }
        @keyframes sparkle0 {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(40px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(180deg) translateX(60px); opacity: 0; }
        }
        @keyframes sparkle1 {
          0% { transform: translate(-50%, -50%) rotate(60deg) translateX(40px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(240deg) translateX(60px); opacity: 0; }
        }
        @keyframes sparkle2 {
          0% { transform: translate(-50%, -50%) rotate(120deg) translateX(40px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(300deg) translateX(60px); opacity: 0; }
        }
        @keyframes sparkle3 {
          0% { transform: translate(-50%, -50%) rotate(180deg) translateX(40px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(60px); opacity: 0; }
        }
        @keyframes sparkle4 {
          0% { transform: translate(-50%, -50%) rotate(240deg) translateX(40px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(420deg) translateX(60px); opacity: 0; }
        }
        @keyframes sparkle5 {
          0% { transform: translate(-50%, -50%) rotate(300deg) translateX(40px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(480deg) translateX(60px); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
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
        @keyframes screenShakeIntense {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-10px, 5px) rotate(-1deg); }
          20% { transform: translate(8px, -6px) rotate(1deg); }
          30% { transform: translate(-7px, 8px) rotate(-0.8deg); }
          40% { transform: translate(10px, -5px) rotate(0.9deg); }
          50% { transform: translate(-8px, 6px) rotate(-0.7deg); }
          60% { transform: translate(7px, -8px) rotate(1deg); }
          70% { transform: translate(-10px, 5px) rotate(-0.9deg); }
          80% { transform: translate(8px, -6px) rotate(0.8deg); }
          90% { transform: translate(-5px, 4px) rotate(-0.5deg); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-shake { animation: shake 0.5s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        .animate-screen-shake { animation: screenShake 0.5s ease-in-out infinite; }
        .animate-screen-shake-intense { animation: screenShakeIntense 0.4s ease-in-out infinite; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        .pixel-border {
          box-shadow: 
            0 -4px 0 0 currentColor,
            4px 0 0 0 currentColor,
            0 4px 0 0 currentColor,
            -4px 0 0 0 currentColor;
        }
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
        .scanlines::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.03) 0%,
            transparent 50%,
            rgba(0, 0, 0, 0.03) 100%
          );
          pointer-events: none;
          z-index: 101;
        }
      `}</style>

        <div className="absolute inset-0" style={{ imageRendering: "pixelated" }}>
          {arenaImage && arenaLoaded ? (
              <>
                <img
                    src={arenaImage}
                    alt="arena background"
                    className="absolute inset-0 w-full h-full object-center select-none pointer-events-none blur-xl"
                    style={{ objectFit: arenaFit, opacity: arenaOpacity * 0.5 }}
                    onError={(e) => {
                      console.warn("Arena image failed to load:", arenaImage);
                      e.currentTarget.style.display = "none";
                      setArenaLoaded(false);
                    }}
                    onLoad={() => setArenaLoaded(true)}
                />
                <div className="absolute inset-0" style={{ boxShadow: "inset 0 -80px 150px rgba(0,0,0,0.5), inset 0 0 150px rgba(0,0,0,0.4)" }} />
              </>
          ) : (
              <>
                <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(0deg,#0f1318 0 12px,#0c0f13 12px 24px), repeating-linear-gradient(90deg,#0d1014 0 12px,#0a0d11 12px 24px)` }} />
                <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{ background: `repeating-linear-gradient(90deg,#1e2a33 0 6px,#162029 6px 12px)`, boxShadow: "0 -40px 120px #000 inset", borderTop: "2px solid #0b1116" }} />
              </>
          )}
        </div>

        {isFlashing && (
            <div
                className="absolute inset-0 bg-red-600 pointer-events-none z-40 animate-ping"
                style={{
                  animationDuration: '0.3s',
                  opacity: 0.4,
                  mixBlendMode: 'screen'
                }}
            />
        )}

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="relative pixel-font">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400" style={{
              clipPath: 'polygon(0 0, 4px 0, 4px 4px, calc(100% - 4px) 4px, calc(100% - 4px) 0, 100% 0, 100% 4px, 100% calc(100% - 4px), 100% 100%, calc(100% - 4px) 100%, calc(100% - 4px) calc(100% - 4px), 4px calc(100% - 4px), 4px 100%, 0 100%, 0 calc(100% - 4px), 0 4px)'
            }} />

            <div className="relative flex items-center gap-3 px-6 py-3 bg-black border-4 border-gray-800 scanlines">
              {syncMode && (
                  <>
                    <div className={cls(
                        "w-3 h-3",
                        isConnected ? "bg-green-500" : "bg-red-500"
                    )} style={{
                      animation: isConnected ? 'blink 2s infinite' : 'blink 0.3s infinite',
                      imageRendering: 'pixelated'
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

              {testingMode && (
                  <>
                    <div className="w-3 h-3 bg-yellow-500" style={{ animation: 'blink 0.5s infinite', imageRendering: 'pixelated' }} />
                    <span className="text-[10px] text-yellow-400 tracking-widest">
                  🧪 TEST
                </span>
                    <div className="w-1 h-4 bg-gray-600" />
                  </>
              )}

              <div className="w-3 h-3 bg-red-500" style={{ animation: 'blink 1s infinite', imageRendering: 'pixelated' }} />

              <span className="text-[10px] text-yellow-400 tracking-widest">
              CRYPTO ARENA
            </span>

              <div className="w-1 h-4 bg-gray-600" />

              <span className="text-[8px] text-gray-400">
              {aspect}
            </span>

              {cryptoConfig.enabled && (
                  <>
                    <div className="w-1 h-4 bg-gray-600" />
                    <div className="px-2 py-1 bg-green-900 border-2 border-green-500">
                  <span className="text-[8px] text-green-400 tracking-wider">
                    {currentScenario.toUpperCase()}
                  </span>
                    </div>
                  </>
              )}

              {pendingScenario && (
                  <>
                    <div className="w-1 h-4 bg-gray-600" />
                    <div className="px-2 py-1 bg-yellow-900 border-2 border-yellow-500" style={{ animation: 'blink 0.5s infinite' }}>
                  <span className="text-[8px] text-yellow-400 tracking-wider">
                    NEXT:{pendingScenario.toUpperCase()}
                  </span>
                    </div>
                  </>
              )}

              {currentScenario.includes("Back") && (
                  <>
                    <div className="w-1 h-4 bg-gray-600" />
                    <div className="px-2 py-1 bg-blue-900 border-2 border-blue-500">
                  <span className="text-[8px] text-blue-400 tracking-wider">
                    RETURN
                  </span>
                    </div>
                  </>
              )}
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

        <div className="relative z-10" style={{ aspectRatio: aspect, width: fullHeight ? "auto" : "min(92vw, 1100px)", height: fullHeight ? "calc(100vh - 180px)" : undefined, maxHeight: fullHeight ? "calc(100vh - 180px)" : undefined, maxWidth: "min(92vw, 1600px)" }}>
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-b from-gray-800 via-gray-900 to-black border-8 border-gray-700 scanlines"
                 style={{
                   boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.1), inset 0 -4px 0 rgba(0,0,0,0.5), 0 20px 50px rgba(0,0,0,0.8)',
                   imageRendering: 'pixelated'
                 }}
            />

            <div className="absolute -inset-2 bg-black border-4 border-gray-900" style={{ imageRendering: 'pixelated' }} />

            <div className={cls(
                "relative w-full h-full overflow-hidden transition-all duration-500 scanlines",
                "border-4 border-gray-800",
                loaded ? "opacity-100" : "opacity-0"
            )} style={{ imageRendering: 'pixelated' }}>

              {/* 🎬 VIDEO 1 - for crossfade */}
              <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full block pointer-events-none transition-opacity duration-300"
                  src={videos.idle}
                  poster={poster}
                  playsInline
                  autoPlay
                  muted
                  preload="auto"
                  onEnded={handleVideoEnded}
                  style={{
                    imageRendering: 'pixelated',
                    opacity: activeVideo === 1 ? 1 : 0,
                    zIndex: activeVideo === 1 ? 2 : 1
                  }}
              />

              {/* 🎬 VIDEO 2 - for crossfade */}
              <video
                  ref={videoRef2}
                  className="absolute inset-0 w-full h-full block pointer-events-none transition-opacity duration-300"
                  src={videos.idle}
                  poster={poster}
                  playsInline
                  autoPlay
                  muted
                  preload="auto"
                  onEnded={handleVideoEnded}
                  style={{
                    imageRendering: 'pixelated',
                    opacity: activeVideo === 2 ? 1 : 0,
                    zIndex: activeVideo === 2 ? 2 : 1
                  }}
              />

              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 2px, transparent 2px, transparent 4px)',
                zIndex: 10
              }} />
            </div>

            {pendingScenario && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 pixel-font">
                  <div className="relative">
                    <div className="px-6 py-3 bg-yellow-500 border-4 border-yellow-700 scanlines" style={{
                      boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
                      imageRendering: 'pixelated'
                    }}>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-black" style={{ animation: 'blink 0.5s infinite' }} />
                        <div>
                          <div className="text-[10px] font-black text-black tracking-wider">QUEUED</div>
                          <div className="text-[8px] font-bold text-black/70 mt-1">
                            {pendingScenario.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            )}

            {currentScenario.includes("Back") && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 pixel-font">
                  <div className="relative">
                    <div className="px-6 py-3 bg-blue-500 border-4 border-blue-700 scanlines" style={{
                      boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
                      imageRendering: 'pixelated'
                    }}>
                      <div className="flex items-center gap-3">
                        <div className="text-base">←</div>
                        <div>
                          <div className="text-[10px] font-black text-white tracking-wider">RETURN</div>
                          <div className="text-[8px] font-bold text-white/80 mt-1">
                            {currentScenario.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            )}
          </div>
        </div>

        {cryptoConfig.enabled && (
            <div className="absolute bottom-6 left-6 z-20 pixel-font">
              <div className="flex gap-4">
                <div className="relative">
                  <div className="px-4 py-3 bg-black border-4 border-gray-700 scanlines" style={{
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
                    minWidth: '140px',
                    imageRendering: 'pixelated'
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cls(
                          "w-2 h-2",
                          marketData.sol.change24h >= 0 ? "bg-green-500" : "bg-red-500"
                      )} style={{ imageRendering: 'pixelated' }} />
                      <span className="text-[8px] text-gray-400 tracking-wider">SOL</span>
                    </div>

                    <div className={cls(
                        "text-lg font-black tracking-tight",
                        marketData.sol.change24h >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {marketData.sol.change24h >= 0 ? "+" : ""}{marketData.sol.change24h.toFixed(1)}%
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[7px] text-gray-500">24H</div>
                      <div className={cls(
                          "text-[7px] font-bold",
                          health.sol < 30 ? "text-red-400" : "text-green-400"
                      )}>
                        HP:{Math.round(health.sol)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="px-4 py-3 bg-black border-4 border-gray-700 scanlines" style={{
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
                    minWidth: '140px',
                    imageRendering: 'pixelated'
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cls(
                          "w-2 h-2",
                          marketData.bnb.change24h >= 0 ? "bg-green-500" : "bg-red-500"
                      )} style={{ imageRendering: 'pixelated' }} />
                      <span className="text-[8px] text-gray-400 tracking-wider">BNB</span>
                    </div>

                    <div className={cls(
                        "text-lg font-black tracking-tight",
                        marketData.bnb.change24h >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {marketData.bnb.change24h >= 0 ? "+" : ""}{marketData.bnb.change24h.toFixed(1)}%
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[7px] text-gray-500">24H</div>
                      <div className={cls(
                          "text-[7px] font-bold",
                          health.bnb < 30 ? "text-red-400" : "text-green-400"
                      )}>
                        HP:{Math.round(health.bnb)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}

        {testingMode && (
            <div className="absolute bottom-6 right-6 z-30 pixel-font">
              <div className="relative">
                <div className="flex flex-col gap-0 bg-black border-4 border-gray-700 scanlines" style={{
                  minWidth: '200px',
                  boxShadow: '8px 8px 0 rgba(0,0,0,0.5)',
                  imageRendering: 'pixelated'
                }}>
                  <div className="px-4 py-2 bg-gray-800 border-b-4 border-gray-700 flex items-center justify-between">
                <span className="text-[8px] text-yellow-400 tracking-wider">
                  🧪 TEST MODE
                </span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500" style={{ animation: 'blink 1s infinite', imageRendering: 'pixelated' }} />
                      <span className="text-[7px] text-green-400">RDY</span>
                    </div>
                  </div>

                  <div className="p-3">
                    {isTransitioning && (
                        <div className="px-2 py-2 mb-2 bg-red-900 border-2 border-red-500" style={{ animation: 'blink 0.5s infinite' }}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500" style={{ imageRendering: 'pixelated' }} />
                            <span className="text-[8px] text-red-400 tracking-wider">LOCKED</span>
                          </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {[
                        { key: "idle", label: "IDLE", icon: "▣", shortcut: "1" },
                        { key: "solPump", label: "SOL+", icon: "↑", shortcut: "2" },
                        { key: "bnbPump", label: "BNB+", icon: "↑", shortcut: "3" },
                        { key: "bothPump", label: "BOTH+", icon: "↑↑", shortcut: "4" },
                        { key: "solDump", label: "SOL-", icon: "↓", shortcut: "5" },
                        { key: "bnbDump", label: "BNB-", icon: "↓", shortcut: "6" },
                        { key: "bothDump", label: "BOTH-", icon: "↓↓", shortcut: "7" },
                      ].map(({ key, label, icon, shortcut }) => {
                        const isDisabled = isTransitioning || pendingScenario !== null;
                        const isActive = currentScenario === key;
                        const isPending = pendingScenario === key;

                        return (
                            <button
                                key={key}
                                onClick={() => handleScenarioChange(key)}
                                disabled={isDisabled}
                                className={cls(
                                    "px-3 py-2 font-bold text-[8px] transition-all flex items-center justify-between gap-2",
                                    "border-2",
                                    isDisabled && !isActive && !isPending
                                        ? "bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed"
                                        : isActive
                                            ? "bg-yellow-500 text-black border-yellow-700"
                                            : isPending
                                                ? "bg-yellow-400 text-black border-yellow-600"
                                                : "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                                )}
                                style={{
                                  boxShadow: isActive ? '2px 2px 0 rgba(0,0,0,0.5)' : 'none',
                                  imageRendering: 'pixelated'
                                }}
                            >
                              <span className="tracking-wider">{label}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px]">{icon}</span>
                                <span className="text-[6px] text-gray-500">[{shortcut}]</span>
                              </div>
                            </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-2 border-t-2 border-gray-800">
                      <div className="flex items-center justify-between text-[7px]">
                        <span className="text-gray-500">VID</span>
                        <span className="text-gray-400">
                      {Object.keys(videos).filter(k => videos[k]).length}/{Object.keys(videos).length}
                    </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t-2 border-gray-800">
                      <div className="text-[7px] text-gray-500 mb-2">
                        MARKET {syncMode && '(SERVER)'}
                      </div>
                      {syncMode ? (
                          <div className="text-[6px] text-gray-600 leading-relaxed">
                            Market data controlled by server. Use scenario buttons to test.
                          </div>
                      ) : (
                          <div className="grid grid-cols-2 gap-1">
                            <button
                                onClick={() => setMarketData(prev => ({
                                  ...prev,
                                  sol: { ...prev.sol, change24h: 8.5 }
                                }))}
                                className="px-2 py-1 bg-green-900 hover:bg-green-800 border-2 border-green-600 text-[7px] text-green-400"
                                style={{ imageRendering: 'pixelated' }}
                            >
                              S+[Q]
                            </button>
                            <button
                                onClick={() => setMarketData(prev => ({
                                  ...prev,
                                  bnb: { ...prev.bnb, change24h: 6.2 }
                                }))}
                                className="px-2 py-1 bg-green-900 hover:bg-green-800 border-2 border-green-600 text-[7px] text-green-400"
                                style={{ imageRendering: 'pixelated' }}
                            >
                              B+[W]
                            </button>
                            <button
                                onClick={() => setMarketData(prev => ({
                                  ...prev,
                                  sol: { ...prev.sol, change24h: -5.3 }
                                }))}
                                className="px-2 py-1 bg-red-900 hover:bg-red-800 border-2 border-red-600 text-[7px] text-red-400"
                                style={{ imageRendering: 'pixelated' }}
                            >
                              S-[A]
                            </button>
                            <button
                                onClick={() => setMarketData(prev => ({
                                  ...prev,
                                  bnb: { ...prev.bnb, change24h: -4.1 }
                                }))}
                                className="px-2 py-1 bg-red-900 hover:bg-red-800 border-2 border-red-600 text-[7px] text-red-400"
                                style={{ imageRendering: 'pixelated' }}
                            >
                              B-[S]
                            </button>
                            <button
                                onClick={() => setMarketData({
                                  sol: { price: 0, change24h: 0 },
                                  bnb: { price: 0, change24h: 0 }
                                })}
                                className="col-span-2 px-2 py-1 bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 text-[7px] text-gray-400"
                                style={{ imageRendering: 'pixelated' }}
                            >
                              RST[R]
                            </button>
                          </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t-2 border-gray-800">
                      <div className="text-[6px] text-gray-500 leading-relaxed">
                        <div className="mb-1">⌨️ SHORTCUTS:</div>
                        <div>1-7: Scenarios</div>
                        <div>Q/W: SOL/BNB +</div>
                        <div>A/S: SOL/BNB -</div>
                        <div>R: Reset Market</div>
                        <div>H/SPACE: Reset HP</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t-2 border-gray-800">
                      <div className="text-[7px] text-gray-500 mb-2">HEALTH</div>
                      <div className="grid grid-cols-2 gap-1 mb-1">
                        <button
                            onClick={() => {
                              if (syncMode && socketRef.current) {
                                socketRef.current.emit('test_health', { sol: health.sol - 20 });
                              } else {
                                setHealth(prev => ({ ...prev, sol: Math.max(0, prev.sol - 20) }));
                              }
                            }}
                            className="px-2 py-1 bg-red-900 hover:bg-red-800 border-2 border-red-600 text-[7px] text-red-400"
                            style={{ imageRendering: 'pixelated' }}
                        >
                          S-20
                        </button>
                        <button
                            onClick={() => {
                              if (syncMode && socketRef.current) {
                                socketRef.current.emit('test_health', { bnb: health.bnb - 20 });
                              } else {
                                setHealth(prev => ({ ...prev, bnb: Math.max(0, prev.bnb - 20) }));
                              }
                            }}
                            className="px-2 py-1 bg-red-900 hover:bg-red-800 border-2 border-red-600 text-[7px] text-red-400"
                            style={{ imageRendering: 'pixelated' }}
                        >
                          B-20
                        </button>
                      </div>
                      <button
                          onClick={() => {
                            if (syncMode && socketRef.current) {
                              socketRef.current.emit('reset_health');
                            } else {
                              setHealth({ sol: 100, bnb: 100 });
                            }
                          }}
                          className="w-full px-2 py-1 bg-green-900 hover:bg-green-800 border-2 border-green-600 text-[7px] text-green-400"
                          style={{ imageRendering: 'pixelated' }}
                      >
                        RESET HP[H]
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </section>
  );
}
