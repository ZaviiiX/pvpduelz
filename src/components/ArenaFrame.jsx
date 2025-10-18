// ArenaFrame.jsx - MODERN DESIGN (bez inline stilova)
import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import "./ArenaFrame.css"; // ✅ Import CSS

const cls = (...c) => c.filter(Boolean).join(" ");

// 💚 HEALTH BAR COMPONENT
function HealthBar({ health, maxHealth = 100, side = "left", label = "PLAYER", lastDamage = 0 }) {
  const healthPercent = (health / maxHealth) * 100;
  const isLowHealth = healthPercent < 30;
  const isCritical = healthPercent < 15;
  const isRecentDamage = Date.now() - lastDamage < 300;

  const getHealthColor = () => {
    if (healthPercent > 60) return 'health-bar-high';
    if (healthPercent > 30) return 'health-bar-medium';
    return 'health-bar-low';
  };

  return (
      <div className="font-body">
        <div className={cls(
            "text-xs text-white mb-1 font-semibold tracking-wide",
            side === "left" ? "text-left" : "text-right"
        )}>
          {label}
        </div>

        <div className={cls("health-bar-container", isRecentDamage && "animate-pulse")}>
          {isRecentDamage && (
              <div className="absolute inset-0 bg-red-500 opacity-60 animate-pulse" />
          )}

          <div
              className={cls(
                  "health-bar-fill",
                  getHealthColor(),
                  isCritical && "animate-pulse",
                  isLowHealth && "health-bar-glow"
              )}
              style={{ width: `${healthPercent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/20" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-black">
            {Math.round(health)}
          </div>

          {isCritical && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-red-500 font-black animate-bounce">
                ⚠️ DANGER
              </div>
          )}
        </div>
      </div>
  );
}

// 🛡️ TOKEN SHIELD COMPONENT
function TokenShield({ label = "SOL", tone = "#14F195", isActive = false, marketChange = 0, icon = null }) {
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
            "token-shield animate-float-slow",
            isActive && "token-shield-active"
        )}
             style={isActive ? { borderColor: tone, boxShadow: `0 0 30px ${tone}` } : {}}>
          {icon ? (
              <img src={icon} alt={label} className="w-16 h-16 object-contain" />
          ) : (
              <span className="text-white text-xl font-bold">{label.slice(0, 3)}</span>
          )}
        </div>

        {isMoving && (
            <div className={cls(
                "absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-bold",
                marketChange > 0
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
            )}>
              {marketChange > 0 ? '▲' : '▼'} {Math.abs(marketChange).toFixed(1)}%
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
          "combo-display absolute top-32 z-30 font-display",
          side === "left" ? "left-6" : "right-6"
      )}>
        <div className="text-2xl font-black text-white">{combo}x COMBO!</div>
      </div>
  );
}

// 💰 PRICE TICKER
function PriceTicker({ token, price, change }) {
  const isPositive = change >= 0;

  return (
      <div className="price-ticker">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-semibold">{token}</span>
          <span className="text-sm text-white font-bold">${price.toFixed(6)}</span>
          <span className={cls(
              "text-xs font-bold",
              isPositive ? "text-green-400" : "text-red-400"
          )}>
          {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </span>
        </div>
      </div>
  );
}

// 📊 STATS PANEL
function StatsPanel({ score, round }) {
  return (
      <div className="absolute bottom-6 right-6 z-20">
        <div className="stats-panel">
          <div className="text-sm font-bold text-indigo-400 mb-3 font-display">STATS</div>
          <div className="flex flex-col gap-2 text-sm font-body">
            <div className="flex justify-between text-gray-300">
              <span>Round:</span>
              <span className="text-white font-bold">{round}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Token A:</span>
              <span className="text-green-400 font-bold">{score.tokenA}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Token B:</span>
              <span className="text-yellow-400 font-bold">{score.tokenB}</span>
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
          "damage-popup absolute top-40 z-40",
          position === "left" ? "left-24" : "right-24"
      )}>
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
                                     tokenIcons = {
                                       tokenA: null,
                                       tokenB: null
                                     },
                                     videos = {
                                       idle: "/videos/solana-vs-bnb.mp4",
                                       tokenAPump: "/videos/sol-winning.mp4",
                                       tokenBPump: "/videos/bnb-winning.mp4",
                                       tokenACombo: "/videos/sol-winning.mp4",
                                       tokenBCombo: "/videos/bnb-winning.mp4",
                                       tokenAVictory: "/videos/sol-winning.mp4",
                                       tokenBVictory: "/videos/bnb-winning.mp4",
                                       tokenABack: "/videos/sol-winning-backto-stance.mp4",
                                       tokenBBack: "/videos/bnb-winning-backto-stance.mp4",
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

  const [tokenConfig, setTokenConfig] = useState({
    tokenA: { name: "Token A", symbol: "TKA", isMock: false, icon: null },
    tokenB: { name: "Token B", symbol: "TKB", isMock: false, icon: null },
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

    socket.on('battle_update', (update) => {
      setHealth(update.health);
      setMarketData(update.marketData);
      setCombo(update.combo);
      setScore(update.score);
      setLastDamage(update.lastDamage);
      setRound(update.currentRound);

      if (update.defender === 'tokenA') {
        setDamagePopup(prev => ({ ...prev, tokenA: update.damage }));
        setTimeout(() => setDamagePopup(prev => ({ ...prev, tokenA: null })), 1500);
      } else if (update.defender === 'tokenB') {
        setDamagePopup(prev => ({ ...prev, tokenB: update.damage }));
        setTimeout(() => setDamagePopup(prev => ({ ...prev, tokenB: null })), 1500);
      }

      if (update.scenario) {
        setCurrentScenario(update.scenario);
        if (update.scenario.includes('Victory')) {
          setGameOver(update.attacker);
        }
      }

      setFlashEffect({ active: true, color: 'red' });
      setTimeout(() => setFlashEffect({ active: false, color: 'red' }), 300);
    });

    socket.on('game_reset', (data) => {
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
  useEffect(() => {
    if (!hasJoined) return;

    const videoSrc = videos[currentScenario];
    if (!videoSrc) return;

    const currentVideo = activeVideoIndex === 0 ? video1Ref.current : video2Ref.current;
    const nextVideo = activeVideoIndex === 0 ? video2Ref.current : video1Ref.current;

    if (!nextVideo || !currentVideo) return;

    nextVideo.src = videoSrc;
    nextVideo.loop = currentScenario === "idle";
    nextVideo.preload = "auto";
    nextVideo.load();

    const handleCanPlay = () => {
      nextVideo.currentTime = 0;
      nextVideo.play().then(() => {
        currentVideo.style.opacity = '0';
        currentVideo.style.zIndex = '1';
        nextVideo.style.opacity = '1';
        nextVideo.style.zIndex = '2';
        setActiveVideoIndex(prev => prev === 0 ? 1 : 0);
        setTimeout(() => {
          currentVideo.pause();
          currentVideo.currentTime = 0;
        }, 100);
      }).catch(e => console.error("Play error:", e));
    };

    nextVideo.addEventListener('canplaythrough', handleCanPlay, { once: true });
    return () => nextVideo.removeEventListener('canplaythrough', handleCanPlay);
  }, [currentScenario, hasJoined, videos]);

  const handleVideoEnded = useCallback(() => {
    const attackScenarios = ['tokenAPump', 'tokenBPump', 'tokenACombo', 'tokenBCombo'];
    const backScenarios = ['tokenABack', 'tokenBBack'];

    if (attackScenarios.includes(currentScenario)) {
      const backScenario = currentScenario.includes('tokenA') ? 'tokenABack' : 'tokenBBack';
      setCurrentScenario(backScenario);
    } else if (backScenarios.includes(currentScenario)) {
      setCurrentScenario('idle');
    }
  }, [currentScenario]);

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
        <section className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-amber-950 via-stone-900 to-zinc-950 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />

          <div className="relative z-10 flex flex-col items-center gap-16 animate-slide-in max-w-4xl px-6">
            {/* Title */}
            <div className="text-center">
              <h1 className="font-display text-6xl font-black mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                CRYPTO ARENA
              </h1>
              <p className="font-body text-xl text-indigo-300">Live Battle Royale</p>
            </div>

            {/* VS Section */}
            <div className="flex items-center gap-24">
              <div className="animate-float">
                <div className="w-32 h-32 rounded-full glass-card flex items-center justify-center border-4 border-indigo-400/50 shadow-[0_0_50px_rgba(99,102,241,0.5)]">
                  {tokenIcons.tokenA ? (
                      <img src={tokenIcons.tokenA} alt="Token A" className="w-20 h-20 object-contain" />
                  ) : (
                      <span className="text-4xl font-bold text-white">A</span>
                  )}
                </div>
              </div>

              <div className="font-display text-6xl font-black text-red-500">VS</div>

              <div className="animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="w-32 h-32 rounded-full glass-card flex items-center justify-center border-4 border-purple-400/50 shadow-[0_0_50px_rgba(168,85,247,0.5)]">
                  {tokenIcons.tokenB ? (
                      <img src={tokenIcons.tokenB} alt="Token B" className="w-20 h-20 object-contain" />
                  ) : (
                      <span className="text-4xl font-bold text-white">B</span>
                  )}
                </div>
              </div>
            </div>

            {/* Button */}
            {!isLoading ? (
                <button
                    onClick={handleJoinArena}
                    className="btn-primary animate-glow"
                >
                  JOIN ARENA
                </button>
            ) : (
                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                  <div className="glass-dark px-8 py-6 rounded-2xl w-full">
                    <div className="flex items-center justify-center gap-3 text-white">
                      <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse" />
                      <span className="font-body text-lg font-semibold">Loading...</span>
                    </div>
                  </div>

                  <div className="loading-bar w-full">
                    <div className="loading-bar-fill" style={{ width: `${loadingProgress}%` }} />
                  </div>
                  <div className="font-body text-sm text-gray-400">
                    {Math.round(loadingProgress)}%
                  </div>
                </div>
            )}

            <p className="font-body text-sm text-gray-500 text-center max-w-md">
              Powered by real-time blockchain data
            </p>
          </div>
        </section>
    );
  }

  // MAIN ARENA
  return (
      <section className={cls(
          "relative w-full h-screen grid place-items-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden",
          shouldShake && 'animate-screen-shake'
      )}>
        <ScreenFlash isActive={flashEffect.active} color={flashEffect.color} />

        {/* Background effects */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10" />

        <DamagePopup damage={damagePopup.tokenA} position="left" />
        <DamagePopup damage={damagePopup.tokenB} position="right" />

        <StatsPanel score={score} round={round} />

        {/* Price Tickers */}
        <div className="absolute top-4 left-6 z-25">
          <PriceTicker token={tokenConfig.tokenA.symbol} price={marketData.tokenA.price} change={marketData.tokenA.change24h} />
        </div>
        <div className="absolute top-4 right-6 z-25">
          <PriceTicker token={tokenConfig.tokenB.symbol} price={marketData.tokenB.price} change={marketData.tokenB.change24h} />
        </div>

        <ComboDisplay combo={combo.tokenA} side="left" />
        <ComboDisplay combo={combo.tokenB} side="right" />

        {/* Status Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="status-indicator">
            <div className="flex items-center gap-4">
              {syncMode && (
                  <>
                    <div className={cls("status-dot", isConnected ? "bg-green-500" : "bg-red-500")} />
                    <span className={cls("text-sm font-semibold", isConnected ? "text-green-400" : "text-red-400")}>
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
                    {isConnected && userCount > 0 && (
                        <span className="text-sm text-gray-400">{userCount} viewers</span>
                    )}
                    <div className="w-px h-6 bg-gray-600" />
                  </>
              )}
              <span className="text-sm font-bold text-indigo-400 font-display">CRYPTO ARENA</span>
            </div>
          </div>
        </div>

        {/* Health Bars */}
        <div className="absolute top-20 left-6 z-30">
          <HealthBar health={health.tokenA} side="left" label={tokenConfig.tokenA.symbol} lastDamage={lastDamage.tokenA} />
        </div>
        <div className="absolute top-20 right-6 z-30">
          <HealthBar health={health.tokenB} side="right" label={tokenConfig.tokenB.symbol} lastDamage={lastDamage.tokenB} />
        </div>

        {/* Token Shields */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
          <TokenShield
              label={tokenConfig.tokenA.symbol}
              tone="#6366f1"
              icon={tokenConfig.tokenA.icon}
              {...getTokenStatus('tokenA')}
              marketChange={marketData.tokenA.change24h}
          />
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
          <TokenShield
              label={tokenConfig.tokenB.symbol}
              tone="#a855f7"
              icon={tokenConfig.tokenB.icon}
              {...getTokenStatus('tokenB')}
              marketChange={marketData.tokenB.change24h}
          />
        </div>

        {/* Video Frame - OLD WORKING VERSION */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          aspectRatio: aspect,
          width: fullHeight ? "auto" : "min(92vw, 1100px)",
          height: fullHeight ? "calc(100vh - 180px)" : undefined,
          maxWidth: "min(92vw, 1600px)",
          maxHeight: fullHeight ? "calc(100vh - 180px)" : undefined
        }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Outer frame */}
            <div style={{
              position: 'absolute',
              inset: '-2rem',
              background: 'linear-gradient(to bottom, rgb(31, 41, 55), rgb(17, 24, 39), rgb(0, 0, 0))',
              border: '8px solid rgb(55, 65, 81)',
              boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.8)',
              borderRadius: '24px'
            }} />

            {/* Inner frame */}
            <div style={{
              position: 'absolute',
              inset: '-0.5rem',
              background: 'black',
              border: '4px solid rgb(17, 24, 39)',
              borderRadius: '16px'
            }} />

            {/* Video container */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              border: '4px solid rgb(31, 41, 55)',
              borderRadius: '12px'
            }}>
              <video
                  ref={video1Ref}
                  playsInline
                  muted
                  preload="auto"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0,
                    zIndex: 1
                  }}
              />

              <video
                  ref={video2Ref}
                  playsInline
                  muted
                  preload="auto"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0,
                    zIndex: 1
                  }}
              />

              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 2px, transparent 2px, transparent 4px)',
                pointerEvents: 'none',
                zIndex: 10
              }} />
            </div>
          </div>
        </div>

        {/* 🎮 MOCK CONTROL PANEL - BOTTOM LEFT */}
        {syncMode && tokenConfig.tokenA?.isMock && (
            <div className="absolute bottom-6 left-6 z-40">
              <div className="mock-controls">
                <div className="text-sm font-bold text-purple-400 mb-3 font-display flex items-center gap-2">
                  🎲 MOCK CONTROLS
                </div>

                {/* MODE INDICATOR */}
                <div className="mb-3 p-2 glass-dark rounded-lg border border-purple-500/30">
                  <div className="text-xs text-yellow-400 font-semibold">
                    MODE: MANUAL
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Click buttons to trigger attacks
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Token A Controls */}
                  <div>
                    <div className="text-xs text-green-400 mb-1 font-semibold">{tokenConfig.tokenA.symbol}</div>
                    <div className="flex gap-2">
                      <button
                          onClick={() => {
                            console.log('🎮 Manual PUMP tokenA');
                            socketRef.current?.emit('mock_pump', { token: 'tokenA', intensity: 1 });
                          }}
                          className="px-3 py-2 text-xs bg-green-600 text-white rounded-lg border-2 border-green-800 hover:bg-green-700 transition-all font-semibold"
                      >
                        📈 PUMP
                      </button>
                      <button
                          onClick={() => {
                            console.log('🎮 Manual DUMP tokenA');
                            socketRef.current?.emit('mock_dump', { token: 'tokenA', intensity: 1 });
                          }}
                          className="px-3 py-2 text-xs bg-red-600 text-white rounded-lg border-2 border-red-800 hover:bg-red-700 transition-all font-semibold"
                      >
                        📉 DUMP
                      </button>
                    </div>
                  </div>

                  {/* Token B Controls */}
                  <div>
                    <div className="text-xs text-yellow-400 mb-1 font-semibold">{tokenConfig.tokenB.symbol}</div>
                    <div className="flex gap-2">
                      <button
                          onClick={() => {
                            console.log('🎮 Manual PUMP tokenB');
                            socketRef.current?.emit('mock_pump', { token: 'tokenB', intensity: 1 });
                          }}
                          className="px-3 py-2 text-xs bg-green-600 text-white rounded-lg border-2 border-green-800 hover:bg-green-700 transition-all font-semibold"
                      >
                        📈 PUMP
                      </button>
                      <button
                          onClick={() => {
                            console.log('🎮 Manual DUMP tokenB');
                            socketRef.current?.emit('mock_dump', { token: 'tokenB', intensity: 1 });
                          }}
                          className="px-3 py-2 text-xs bg-red-600 text-white rounded-lg border-2 border-red-800 hover:bg-red-700 transition-all font-semibold"
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
                        className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded-lg border-2 border-red-800 hover:bg-red-700 font-bold transition-all"
                    >
                      ⚔️ TRIGGER BATTLE NOW
                    </button>
                  </div>

                  {/* Quick Scenarios */}
                  <div className="border-t border-gray-700 pt-2">
                    <div className="text-[10px] text-gray-400 mb-2">QUICK SCENARIOS</div>
                    <div className="flex flex-col gap-1">
                      <button
                          onClick={() => {
                            socketRef.current?.emit('mock_pump', { token: 'tokenA', intensity: 3 });
                            setTimeout(() => socketRef.current?.emit('manual_battle'), 500);
                          }}
                          className="px-2 py-1 text-[10px] bg-green-700 text-white rounded-lg border border-green-900 hover:bg-green-600 transition-all"
                      >
                        {tokenConfig.tokenA.symbol} MASSIVE PUMP
                      </button>
                      <button
                          onClick={() => {
                            socketRef.current?.emit('mock_dump', { token: 'tokenB', intensity: 3 });
                            setTimeout(() => socketRef.current?.emit('manual_battle'), 500);
                          }}
                          className="px-2 py-1 text-[10px] bg-red-700 text-white rounded-lg border border-red-900 hover:bg-red-600 transition-all"
                      >
                        {tokenConfig.tokenB.symbol} MASSIVE DUMP
                      </button>
                    </div>
                  </div>

                  {/* Reset */}
                  <div className="border-t border-gray-700 pt-2">
                    <button
                        onClick={() => socketRef.current?.emit('reset_game')}
                        className="w-full px-2 py-1 text-[10px] bg-gray-700 text-white rounded-lg border border-gray-900 hover:bg-gray-600 transition-all"
                    >
                      🔄 RESET GAME
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Game Over */}
        {gameOver && (
            <div className="game-over-overlay absolute inset-0 z-50 flex items-center justify-center">
              <div className="text-center animate-scale-in">
                <h2 className="game-over-title mb-8">
                  {gameOver === 'tokenA' ? `${tokenConfig.tokenA.symbol} WINS!` : `${tokenConfig.tokenB.symbol} WINS!`}
                </h2>
                <p className="font-display text-2xl text-white mb-4">GAME OVER</p>
                <p className="font-body text-lg text-gray-400">
                  Final Score: {score.tokenA} - {score.tokenB}
                </p>
              </div>
            </div>
        )}
      </section>
  );
}
