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
          <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold border-4 border-gray-600"
               style={{ boxShadow: '0 0 20px rgba(0,0,0,0.6)' }}>
            {label.slice(0, 3)}
          </div>
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

// 🎯 COMBO DISPLAY
function ComboDisplay({ combo, side = "left" }) {
  if (combo < 2) return null;

  return (
      <div className={cls(
          "absolute top-32 z-30 pixel-font animate-bounce",
          side === "left" ? "left-6" : "right-6"
      )}>
        <div className="bg-red-500 text-white px-4 py-2 border-4 border-red-700"
             style={{
               boxShadow: '4px 4px 0 rgba(0,0,0,0.8)',
               textShadow: '2px 2px 0 rgba(0,0,0,0.5)'
             }}>
          <div className="text-[20px] font-black">{combo}x COMBO!</div>
        </div>
      </div>
  );
}

// 💰 PRICE TICKER
function PriceTicker({ token, price, change }) {
  const isPositive = change >= 0;

  return (
      <div className="flex items-center gap-2 px-3 py-1 bg-black border-2 border-gray-700">
        <span className="text-[8px] text-gray-400 pixel-font">{token}</span>
        <span className="text-[10px] text-white pixel-font font-bold">${price.toFixed(6)}</span>
        <span className={cls(
            "text-[8px] pixel-font font-bold",
            isPositive ? "text-green-400" : "text-red-400"
        )}>
          {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </span>
      </div>
  );
}

// 📊 STATS PANEL
function StatsPanel({ score, round }) {
  return (
      <div className="absolute top-4 left-6 z-20 pixel-font">
        <div className="bg-black border-4 border-gray-800 p-3" style={{ minWidth: '200px' }}>
          <div className="text-[10px] text-yellow-400 mb-2">📊 STATS</div>
          <div className="flex flex-col gap-1 text-[8px]">
            <div className="flex justify-between text-gray-400">
              <span>ROUND:</span>
              <span className="text-white">{round}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>TOKEN A WINS:</span>
              <span className="text-green-400">{score.tokenA}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>TOKEN B WINS:</span>
              <span className="text-yellow-400">{score.tokenB}</span>
            </div>
          </div>
        </div>
      </div>
  );
}

// 💥 SCREEN FLASH
function ScreenFlash({ isActive, color = "red" }) {
  if (!isActive) return null;

  const colors = {
    red: 'rgba(255, 0, 0, 0.3)',
    green: 'rgba(0, 255, 0, 0.2)',
    yellow: 'rgba(255, 255, 0, 0.2)'
  };

  return (
      <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            background: colors[color] || colors.red,
            animation: 'flash 0.3s ease-out'
          }}
      />
  );
}

// 💀 DAMAGE POPUP
function DamagePopup({ damage, position = "left" }) {
  if (!damage) return null;

  return (
      <div className={cls(
          "absolute top-40 z-40 pixel-font text-[24px] font-black text-red-500 animate-bounce",
          position === "left" ? "left-24" : "right-24"
      )} style={{
        textShadow: '3px 3px 0 rgba(0,0,0,0.8)',
        animation: 'floatUp 1s ease-out forwards'
      }}>
        -{damage}
      </div>
  );
}

export default function ArenaFrame({
                                     aspect = "16/9",
                                     fullHeight = true,
                                     testingMode = false,
                                     syncMode = true,
                                     serverUrl = "http://localhost:3001",
                                     videos = {
                                       idle: "/videos/solana-vs-bnb.mp4",
                                       tokenAPump: "/videos/sol-winning.mp4",
                                       tokenBPump: "/videos/bnb-winning.mp4",
                                       tokenACombo: "/videos/sol-winning.mp4",
                                       tokenBCombo: "/videos/bnb-winning.mp4",
                                       tokenAVictory: "/videos/sol-winning.mp4",
                                       tokenBVictory: "/videos/bnb-winning.mp4",
                                     },
                                   }) {
  const video1Ref = useRef(null);
  const video2Ref = useRef(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [currentScenario, setCurrentScenario] = useState("idle");
  const currentScenarioRef = useRef("idle");

  // ✅ TOKEN CONFIG STATE
  const [tokenConfig, setTokenConfig] = useState({
    tokenA: { name: "Token A", symbol: "TKA", isMock: false },
    tokenB: { name: "Token B", symbol: "TKB", isMock: false },
    roundsToWin: 3
  });

  const [health, setHealth] = useState({ tokenA: 100, tokenB: 100 });
  const [lastDamage, setLastDamage] = useState({ tokenA: 0, tokenB: 0 });
  const [damagePopup, setDamagePopup] = useState({ tokenA: null, tokenB: null });

  const [marketData, setMarketData] = useState({
    tokenA: { price: 0.05, change24h: 0, marketCap: 5000000 },
    tokenB: { price: 0.08, change24h: 0, marketCap: 8000000 },
  });

  const [combo, setCombo] = useState({ tokenA: 0, tokenB: 0 });
  const [score, setScore] = useState({ tokenA: 0, tokenB: 0 });
  const [round, setRound] = useState(1);
  const [flashEffect, setFlashEffect] = useState({ active: false, color: 'red' });
  const [gameOver, setGameOver] = useState(null);

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    currentScenarioRef.current = currentScenario;
  }, [currentScenario]);

  const handleJoinArena = async () => {
    setIsLoading(true);
    setLoadingProgress(0);

    const videoUrls = Object.values(videos).filter(url => url);
    let loadedCount = 0;

    const promises = videoUrls.map(url => {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.src = url;
        video.preload = 'auto';

        video.addEventListener('canplaythrough', () => {
          loadedCount++;
          setLoadingProgress((loadedCount / videoUrls.length) * 100);
          resolve();
        });

        video.addEventListener('error', () => {
          loadedCount++;
          setLoadingProgress((loadedCount / videoUrls.length) * 100);
          resolve();
        });

        video.load();
      });
    });

    await Promise.all(promises);

    setTimeout(() => {
      setHasJoined(true);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    if (!hasJoined) return;

    if (video1Ref.current && videos.idle) {
      video1Ref.current.src = videos.idle;
      video1Ref.current.loop = true;
      video1Ref.current.style.opacity = '1';
      video1Ref.current.style.zIndex = '2';
      video1Ref.current.load();
      video1Ref.current.play().catch(e => console.error("Initial play:", e));
    }
  }, [videos.idle, hasJoined]);

  // 🌐 WEBSOCKET CONNECTION
  useEffect(() => {
    if (!syncMode || !hasJoined) return;

    const socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to Battle Server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from Battle Server');
      setIsConnected(false);
    });

    socket.on('initial_state', (state) => {
      console.log('📦 Initial state:', state);

      // ✅ Set token config
      if (state.config) {
        setTokenConfig({
          tokenA: state.config.tokenA,
          tokenB: state.config.tokenB,
          roundsToWin: state.config.roundsToWin
        });
      }

      setHealth(state.health);
      setCombo(state.combo);
      setRound(state.currentRound);
      setScore(state.score);
      setMarketData(state.marketData);
      setCurrentScenario(state.scenario);
      setLastDamage(state.lastDamage);
    });

    // ⚔️ BATTLE UPDATE
    // ⚔️ BATTLE UPDATE
    socket.on('battle_update', (update) => {
      console.log('⚔️ Battle update received:', update);
      console.log('   Scenario:', update.scenario);
      console.log('   Attacker:', update.attacker);
      console.log('   Defender:', update.defender);
      console.log('   Damage:', update.damage);

      setHealth(update.health);
      setMarketData(update.marketData);
      setCombo(update.combo);
      setScore(update.score);
      setLastDamage(update.lastDamage);
      setRound(update.currentRound);

      // Damage popup
      if (update.defender === 'tokenA') {
        setDamagePopup(prev => ({ ...prev, tokenA: update.damage }));
        setTimeout(() => setDamagePopup(prev => ({ ...prev, tokenA: null })), 1500);
      } else if (update.defender === 'tokenB') {
        setDamagePopup(prev => ({ ...prev, tokenB: update.damage }));
        setTimeout(() => setDamagePopup(prev => ({ ...prev, tokenB: null })), 1500);
      }

      // ✅ SCENARIO CHANGE - CRITICAL!
      if (update.scenario) {
        console.log('🎬 Setting scenario from battle_update:', update.scenario);
        setCurrentScenario(update.scenario);

        if (update.scenario.includes('Victory')) {
          setGameOver(update.attacker);
        }
      }

      // Screen flash
      setFlashEffect({ active: true, color: 'red' });
      setTimeout(() => setFlashEffect({ active: false, color: 'red' }), 300);
    });

    socket.on('game_reset', (data) => {
      console.log('🔄 Game reset');
      setHealth(data.health);
      setRound(data.currentRound);
      setScore(data.score);
      setGameOver(null);
      setCombo({ tokenA: 0, tokenB: 0 });
      setCurrentScenario('idle');
    });

    socket.on('scenario_change', ({ scenario }) => {
      if (scenario !== currentScenario) {
        setCurrentScenario(scenario);
      }
    });

    socket.on('user_count', (count) => {
      setUserCount(count);
    });

    return () => socket.disconnect();
  }, [syncMode, serverUrl, hasJoined]);

  // 🎬 VIDEO SWITCHING
  // 🎬 VIDEO SWITCHING
  useEffect(() => {
    if (!hasJoined) return;

    console.log('🎬 VIDEO SWITCH - Scenario changed to:', currentScenario);

    const videoSrc = videos[currentScenario];

    if (!videoSrc) {
      console.warn(`⚠️ No video found for scenario: ${currentScenario}`);
      console.log('Available videos:', Object.keys(videos));
      return;
    }

    console.log('✅ Video source found:', videoSrc);

    const currentVideo = activeVideoIndex === 0 ? video1Ref.current : video2Ref.current;
    const nextVideo = activeVideoIndex === 0 ? video2Ref.current : video1Ref.current;

    if (!nextVideo || !currentVideo) {
      console.error('❌ Video refs not available');
      return;
    }

    console.log(`📺 Switching from video${activeVideoIndex === 0 ? 1 : 2} to video${activeVideoIndex === 0 ? 2 : 1}`);

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

    const handleError = (e) => {
      console.error('❌ Video load error:', e);
      console.error('Failed video src:', videoSrc);
    };

    nextVideo.addEventListener('canplaythrough', handleCanPlay, { once: true });
    nextVideo.addEventListener('error', handleError, { once: true });

    return () => {
      nextVideo.removeEventListener('canplaythrough', handleCanPlay);
      nextVideo.removeEventListener('error', handleError);
    };

  }, [currentScenario, hasJoined, videos]);

  const handleVideoEnded = useCallback(() => {
    const currentVideo = activeVideoIndex === 0 ? video1Ref.current : video2Ref.current;

    console.log('🏁 Video ended:', currentScenario);
    console.log('📊 Video duration:', currentVideo?.duration);
    console.log('📊 Current time:', currentVideo?.currentTime);

    const attackScenarios = ['tokenAPump', 'tokenBPump', 'tokenACombo', 'tokenBCombo'];
    const backScenarios = ['tokenABack', 'tokenBBack'];

    // ✅ After attack → play "back to stance"
    if (attackScenarios.includes(currentScenario) && currentVideo?.duration > 1) {
      console.log('↩️ Playing back to stance animation');

      // Determine which token attacked
      const backScenario = currentScenario.includes('tokenA') ? 'tokenABack' : 'tokenBBack';
      setCurrentScenario(backScenario);
    }
    // ✅ After "back to stance" → return to idle
    else if (backScenarios.includes(currentScenario)) {
      console.log('⏪ Returning to idle');
      setCurrentScenario('idle');
    }
  }, [currentScenario, activeVideoIndex]);

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

  const getTokenStatus = (tokenName) => {
    const scenario = currentScenario.toLowerCase();
    const isRelevantToken = scenario.includes(tokenName.toLowerCase());
    return { isActive: isRelevantToken };
  };

  const shouldShake = currentScenario.includes('Pump') || currentScenario.includes('Combo');

  // JOIN SCREEN
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

          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c0f] via-[#0f1318] to-[#1a1f28]" />

          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `repeating-linear-gradient(0deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px)`,
            backgroundSize: '40px 40px'
          }} />

          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.7) 100%)'
          }} />

          <div className="relative z-10 flex flex-col items-center gap-12 animate-slide-in">

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

            <div className="flex items-center gap-16">
              <div className="animate-float">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-green-900"
                     style={{ boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)' }}>
                  A
                </div>
              </div>
              <div className="pixel-font text-[48px] text-red-500" style={{
                textShadow: '4px 4px 0 rgba(0,0,0,0.8)'
              }}>
                VS
              </div>
              <div className="animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-yellow-900"
                     style={{ boxShadow: '0 0 40px rgba(234, 179, 8, 0.5)' }}>
                  B
                </div>
              </div>
            </div>

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
                <div className="flex flex-col items-center gap-4">
                  <div className="pixel-font text-[16px] px-12 py-6 bg-gray-700 text-white border-4 border-gray-600"
                       style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.5)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-[#14F195]" style={{ animation: 'blink 0.8s infinite' }} />
                      LOADING...
                    </div>
                  </div>

                  <div className="w-64 h-6 bg-black border-4 border-gray-700 p-1">
                    <div
                        className="h-full bg-gradient-to-r from-[#14F195] to-[#0ea270] transition-all duration-300"
                        style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <div className="pixel-font text-[10px] text-gray-400">
                    {Math.round(loadingProgress)}%
                  </div>
                </div>
            )}

            <div className="pixel-font text-[8px] text-gray-500 text-center max-w-md">
              <div style={{ animation: 'blink 2s infinite' }}>▼ PRESS TO ENTER ▼</div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pixel-font text-[8px] text-gray-600">
            POWERED BY REAL-TIME BLOCKCHAIN DATA
          </div>
        </section>
    );
  }

  // MAIN ARENA
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
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-50px); opacity: 0; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-screen-shake { animation: screenShake 0.5s ease-in-out infinite; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }
      `}</style>

        <ScreenFlash isActive={flashEffect.active} color={flashEffect.color} />

        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c0f] via-[#0f1318] to-[#1a1f28]" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(0deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.5) 100%)'
        }} />

        <DamagePopup damage={damagePopup.tokenA} position="left" />
        <DamagePopup damage={damagePopup.tokenB} position="right" />

        <StatsPanel score={score} round={round} />

        <div className="absolute top-16 left-6 z-20 flex flex-col gap-2">
          <PriceTicker token={tokenConfig.tokenA.symbol} price={marketData.tokenA.price} change={marketData.tokenA.change24h} />
        </div>
        <div className="absolute top-16 right-6 z-20 flex flex-col gap-2">
          <PriceTicker token={tokenConfig.tokenB.symbol} price={marketData.tokenB.price} change={marketData.tokenB.change24h} />
        </div>

        <ComboDisplay combo={combo.tokenA} side="left" />
        <ComboDisplay combo={combo.tokenB} side="right" />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pixel-font">
          <div className="relative flex items-center gap-3 px-6 py-3 bg-black border-4 border-gray-800">
            {syncMode && (
                <>
                  <div className={cls("w-3 h-3", isConnected ? "bg-green-500" : "bg-red-500")}
                       style={{ animation: 'blink 2s infinite' }} />
                  <span className={cls("text-[10px]", isConnected ? "text-green-400" : "text-red-400")}>
                    {isConnected ? '🌐 LIVE' : '⚠️ OFFLINE'}
                  </span>
                  {isConnected && userCount > 0 && <span className="text-[8px] text-gray-500">[{userCount} 👥]</span>}
                  <div className="w-1 h-4 bg-gray-600" />
                </>
            )}
            <div className="w-3 h-3 bg-red-500" style={{ animation: 'blink 1s infinite' }} />
            <span className="text-[10px] text-yellow-400">CRYPTO ARENA</span>
          </div>
        </div>

        <div className="absolute top-28 left-6 z-20">
          <HealthBar health={health.tokenA} side="left" label={tokenConfig.tokenA.symbol} lastDamage={lastDamage.tokenA} />
        </div>

        <div className="absolute top-28 right-6 z-20">
          <HealthBar health={health.tokenB} side="right" label={tokenConfig.tokenB.symbol} lastDamage={lastDamage.tokenB} />
        </div>

        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
          <TokenShield label={tokenConfig.tokenA.symbol} tone="#14F195" {...getTokenStatus('tokenA')} marketChange={marketData.tokenA.change24h} />
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
          <TokenShield label={tokenConfig.tokenB.symbol} tone="#F0B90B" {...getTokenStatus('tokenB')} marketChange={marketData.tokenB.change24h} />
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

        {/* 🎮 MOCK CONTROL PANEL */}
        {syncMode && tokenConfig.tokenA?.isMock && (
            <div className="absolute bottom-6 left-6 z-30 pixel-font">
              <div className="bg-black border-4 border-purple-700 p-3" style={{ minWidth: '250px' }}>
                <div className="text-[10px] text-purple-400 mb-3 flex items-center gap-2">
                  🎲 MOCK CONTROLS
                </div>

                {/* ✅ MODE INDICATOR */}
                <div className="mb-3 p-2 bg-gray-900 border border-gray-700">
                  <div className="text-[7px] text-yellow-400">
                    MODE: MANUAL
                  </div>
                  <div className="text-[6px] text-gray-400 mt-1">
                    Click buttons to trigger attacks
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Token A Controls */}
                  <div>
                    <div className="text-[8px] text-green-400 mb-1">{tokenConfig.tokenA.symbol}</div>
                    <div className="flex gap-1">
                      <button
                          onClick={() => {
                            console.log('🎮 Manual PUMP tokenA');
                            socketRef.current?.emit('mock_pump', { token: 'tokenA', intensity: 1 });
                          }}
                          className="px-2 py-1 text-[7px] bg-green-600 text-white border-2 border-green-800 hover:bg-green-700"
                      >
                        📈 PUMP
                      </button>
                      <button
                          onClick={() => {
                            console.log('🎮 Manual DUMP tokenA');
                            socketRef.current?.emit('mock_dump', { token: 'tokenA', intensity: 1 });
                          }}
                          className="px-2 py-1 text-[7px] bg-red-600 text-white border-2 border-red-800 hover:bg-red-700"
                      >
                        📉 DUMP
                      </button>
                    </div>
                  </div>

                  {/* Token B Controls */}
                  <div>
                    <div className="text-[8px] text-yellow-400 mb-1">{tokenConfig.tokenB.symbol}</div>
                    <div className="flex gap-1">
                      <button
                          onClick={() => {
                            console.log('🎮 Manual PUMP tokenB');
                            socketRef.current?.emit('mock_pump', { token: 'tokenB', intensity: 1 });
                          }}
                          className="px-2 py-1 text-[7px] bg-green-600 text-white border-2 border-green-800 hover:bg-green-700"
                      >
                        📈 PUMP
                      </button>
                      <button
                          onClick={() => {
                            console.log('🎮 Manual DUMP tokenB');
                            socketRef.current?.emit('mock_dump', { token: 'tokenB', intensity: 1 });
                          }}
                          className="px-2 py-1 text-[7px] bg-red-600 text-white border-2 border-red-800 hover:bg-red-700"
                      >
                        📉 DUMP
                      </button>
                    </div>
                  </div>

                  {/* Manual Battle Trigger */}
                  <div className="border-t border-gray-700 pt-2">
                    <button
                        onClick={() => {
                          console.log('⚔️ Manual battle trigger');
                          socketRef.current?.emit('manual_battle');
                        }}
                        className="w-full px-3 py-2 text-[8px] bg-red-600 text-white border-2 border-red-800 hover:bg-red-700 font-bold"
                    >
                      ⚔️ TRIGGER BATTLE NOW
                    </button>
                  </div>

                  {/* Quick Scenarios */}
                  <div className="border-t border-gray-700 pt-2">
                    <div className="text-[7px] text-gray-400 mb-2">QUICK SCENARIOS</div>
                    <div className="flex flex-col gap-1">
                      <button
                          onClick={() => {
                            socketRef.current?.emit('mock_pump', { token: 'tokenA', intensity: 3 });
                            setTimeout(() => socketRef.current?.emit('manual_battle'), 500);
                          }}
                          className="px-2 py-1 text-[7px] bg-green-700 text-white border border-green-900"
                      >
                        {tokenConfig.tokenA.symbol} MASSIVE PUMP
                      </button>
                      <button
                          onClick={() => {
                            socketRef.current?.emit('mock_dump', { token: 'tokenB', intensity: 3 });
                            setTimeout(() => socketRef.current?.emit('manual_battle'), 500);
                          }}
                          className="px-2 py-1 text-[7px] bg-red-700 text-white border border-red-900"
                      >
                        {tokenConfig.tokenB.symbol} MASSIVE DUMP
                      </button>
                    </div>
                  </div>

                  {/* Reset */}
                  <div className="border-t border-gray-700 pt-2">
                    <button
                        onClick={() => socketRef.current?.emit('reset_game')}
                        className="w-full px-2 py-1 text-[7px] bg-gray-700 text-white border border-gray-900"
                    >
                      🔄 RESET GAME
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
              <div className="text-center pixel-font">
                <div className="text-[48px] text-yellow-400 mb-8" style={{
                  textShadow: '4px 4px 0 rgba(0,0,0,0.8)'
                }}>
                  {gameOver === 'tokenA'
                      ? `🏆 ${tokenConfig.tokenA.symbol} WINS!`
                      : `🏆 ${tokenConfig.tokenB.symbol} WINS!`}
                </div>
                <div className="text-[16px] text-white">
                  GAME OVER - BEST OF {tokenConfig.roundsToWin * 2 - 1}
                </div>
                <div className="text-[12px] text-gray-400 mt-4">
                  Final Score: {score.tokenA} - {score.tokenB}
                </div>
              </div>
            </div>
        )}
      </section>
  );
}
