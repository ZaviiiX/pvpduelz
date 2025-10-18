// ArenaFrame.jsx - SA PORTAL TRANSITION INTRO + HOVER ENDFRAME (FINAL FIXED)
import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import "./ArenaFrame.css";

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
                                     portalVideos = {
                                       intro: "/video/intro.mp4",
                                       portalEntrance: "/video/portal-entrance.mp4",
                                       endframe: "/images/endframe.png",
                                       endframeHover: "/images/endframe-hover.png"
                                     },
                                     portalConfig = {
                                       enabled: true,
                                       detectButton: true,
                                       knownButton: {
                                         cx_norm: 0.50,
                                         cy_norm: 0.88,
                                         r_norm: 0.12
                                       },
                                       hsvDetect: {
                                         HMIN: 170,
                                         HMAX: 205,
                                         SMIN: 0.25,
                                         VMIN: 0.55,
                                         STEP: 2,
                                         MIN_AREA: 1200,
                                         ASPECT_TOL: 0.40
                                       }
                                     }
                                   }) {

  // 🎬 PORTAL STATE
  const [portalPhase, setPortalPhase] = useState('intro');
  const [showCTA, setShowCTA] = useState(false);
  const [ctaPosition, setCtaPosition] = useState({ x: '50%', y: '90%', size: 180 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const portalIntroRef = useRef(null);
  const portalEntranceRef = useRef(null);
  const canvasRef = useRef(null);
  const ctaRef = useRef(null);

  // ARENA STATE
  const video1Ref = useRef(null);
  const video2Ref = useRef(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);

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

  // Debug portalPhase changes
  useEffect(() => {
    console.log('🎭 Portal phase changed to:', portalPhase);
  }, [portalPhase]);

  // 🎨 HELPER FUNCTIONS FOR BUTTON DETECTION
  const getRenderRect = useCallback((stageEl, videoEl) => {
    const sw = stageEl.clientWidth, sh = stageEl.clientHeight;
    const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
    if (!vw || !vh) return null;
    const s = Math.max(sw / vw, sh / vh);
    const rw = vw * s, rh = vh * s;
    const ox = (sw - rw) / 2, oy = (sh - rh) / 2;
    return { s, rw, rh, ox, oy, sw, sh, vw, vh };
  }, []);

  const mapToScreen = useCallback((rect, x, y) => {
    return { x: rect.ox + x * rect.s, y: rect.oy + y * rect.s };
  }, []);

  const rgb2hsv = useCallback((r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m;
    const v = M, s = M ? d / M : 0;
    let h = 0;
    if (d) {
      switch (M) {
        case r: h = (g - b) / d % 6; break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s, v };
  }, []);

  const findButtonBox = useCallback((imgData, config) => {
    const { HMIN, HMAX, SMIN, VMIN, STEP, MIN_AREA, ASPECT_TOL } = config;
    const W = imgData.width, H = imgData.height, data = imgData.data;
    const gw = Math.ceil(W / STEP), gh = Math.ceil(H / STEP);
    const mask = new Uint8Array(gw * gh), seen = new Uint8Array(gw * gh);

    for (let gy = 0, y = 0; gy < gh; gy++, y += STEP) {
      for (let gx = 0, x = 0; gx < gw; gx++, x += STEP) {
        const i = ((y * W) + x) * 4;
        const { h, s, v } = rgb2hsv(data[i], data[i + 1], data[i + 2]);
        mask[gy * gw + gx] = (h >= HMIN && h <= HMAX && s >= SMIN && v >= VMIN) ? 1 : 0;
      }
    }

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let best = null;

    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const sidx = gy * gw + gx;
        if (!mask[sidx] || seen[sidx]) continue;

        let stack = [sidx];
        seen[sidx] = 1;
        let minX = gx, maxX = gx, minY = gy, maxY = gy, area = 0;

        while (stack.length) {
          const cur = stack.pop();
          area++;
          const cx = cur % gw, cy = (cur - cx) / gw;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          for (const [dx, dy] of dirs) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
            const ni = ny * gw + nx;
            if (mask[ni] && !seen[ni]) {
              seen[ni] = 1;
              stack.push(ni);
            }
          }
        }

        const x = minX * STEP, y = minY * STEP;
        const w = (maxX - minX + 1) * STEP, h = (maxY - minY + 1) * STEP;
        const aspect = w / h, looksCircle = aspect > (1 - ASPECT_TOL) && aspect < (1 + ASPECT_TOL);
        const areaPix = area * (STEP * STEP);

        if (areaPix >= MIN_AREA && looksCircle) {
          if (!best || areaPix > best.areaPix) best = { x, y, w, h, areaPix };
        }
      }
    }
    return best;
  }, [rgb2hsv]);

  const getLastFrameBox = useCallback(async (videoEl, stageEl) => {
    return new Promise((resolve) => {
      try {
        videoEl.currentTime = Math.max(0, (videoEl.duration || 0) - 0.03);
      } catch (e) { }

      requestAnimationFrame(() => {
        const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
        if (!vw || !vh) return resolve(null);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = vw;
        canvas.height = vh;

        try {
          ctx.drawImage(videoEl, 0, 0, vw, vh);
          if (portalConfig.detectButton) {
            const imgData = ctx.getImageData(0, 0, vw, vh);
            const box = findButtonBox(imgData, portalConfig.hsvDetect);
            resolve(box);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
  }, [portalConfig, findButtonBox]);

  const calculateCTAPosition = useCallback(async (videoEl, stageEl) => {
    const rect = getRenderRect(stageEl, videoEl);
    if (!rect) return;

    let box = null;
    if (portalConfig.detectButton) {
      box = await getLastFrameBox(videoEl, stageEl);
    }

    if (box) {
      const icx = box.x + box.w / 2;
      const icy = box.y + box.h / 2;
      const pt = mapToScreen(rect, icx, icy);
      const size = Math.max(180, Math.max(box.w, box.h) * rect.s * 1.1);
      setCtaPosition({ x: `${pt.x}px`, y: `${pt.y}px`, size });
      console.log('🎯 CTA position (detected):', { x: pt.x, y: pt.y, size });
    } else if (portalConfig.knownButton) {
      const { cx_norm, cy_norm, r_norm } = portalConfig.knownButton;
      const icx = cx_norm * rect.vw;
      const icy = cy_norm * rect.vh;
      const pt = mapToScreen(rect, icx, icy);
      const diameterPx = (r_norm * 2) * rect.rw;
      const size = Math.max(180, diameterPx * 1.1);
      setCtaPosition({ x: `${pt.x}px`, y: `${pt.y}px`, size });
      console.log('🎯 CTA position (known):', { x: pt.x, y: pt.y, size });
    } else {
      setCtaPosition({ x: '50%', y: '90%', size: 180 });
      console.log('🎯 CTA position (fallback):', { x: '50%', y: '90%', size: 180 });
    }
  }, [getRenderRect, getLastFrameBox, mapToScreen, portalConfig]);

  // 🎬 PORTAL INTRO VIDEO - AUTO PLAY
  useEffect(() => {
    console.log('🎬 Portal config:', portalConfig);

    if (!portalConfig.enabled) {
      console.log('❌ Portal disabled, skipping to arena');
      setHasJoined(true);
      return;
    }

    const introVid = portalIntroRef.current;
    console.log('📹 Intro video ref:', introVid);

    if (!introVid) {
      console.log('❌ Intro video ref not found!');
      return;
    }

    console.log('📹 Video src:', portalVideos.intro);

    setPortalPhase('intro');

    introVid.muted = true;
    introVid.playsInline = true;
    introVid.load();

    introVid.addEventListener('loadeddata', () => {
      console.log('✅ Video loaded successfully');
      setPortalPhase('intro');
    });

    introVid.addEventListener('error', (e) => {
      console.error('❌ Video load error:', e);
      console.error('Video error code:', introVid.error?.code);
      console.error('Video error message:', introVid.error?.message);
    });

    const playPromise = introVid.play();
    if (playPromise) {
      playPromise
          .then(() => {
            console.log('✅ Video playing');
            setPortalPhase('intro');
          })
          .catch((error) => {
            console.log('❌ Autoplay blocked:', error);
            setPortalPhase('endframe');
            setShowCTA(true);
          });
    }
  }, [portalConfig.enabled, portalVideos.intro]);

  // 🎬 INTRO VIDEO ENDED -> SHOW CTA
  const handleIntroEnded = useCallback(async () => {
    const introVid = portalIntroRef.current;
    const stage = introVid?.parentElement;

    console.log('🎬 Intro video ended');

    if (introVid) {
      try { introVid.pause(); } catch (e) { }
    }

    setPortalPhase('endframe');

    await new Promise(resolve => setTimeout(resolve, 50));

    if (introVid && stage) {
      await calculateCTAPosition(introVid, stage);
    }

    setShowCTA(true);
    console.log('✅ CTA shown');
  }, [calculateCTAPosition]);

  // 🎬 CTA CLICK -> PORTAL TRANSITION
  const handleCTAClick = useCallback(async (e) => {
    e.preventDefault();
    if (isTransitioning) return;

    console.log('🎯 CTA clicked, starting transition...');

    setIsHovering(false);
    setIsTransitioning(true);
    setPortalPhase('transition');
    setShowCTA(false);

    const portalVid = portalEntranceRef.current;
    if (!portalVid) return;

    if (portalVid.readyState < 3) {
      console.log('⏳ Waiting for portal video to load...');
      await new Promise(resolve => {
        portalVid.addEventListener('canplay', resolve, { once: true });
      });
    }

    setTimeout(() => {
      portalVid.currentTime = 0;
      portalVid.play().catch(e => console.error('Portal video play error:', e));
      console.log('▶️ Portal video playing');
    }, 600);
  }, [isTransitioning]);

  // 🎬 PORTAL VIDEO ENDED -> ENTER ARENA
  const handlePortalEnded = useCallback(() => {
    console.log('🌀 Portal entrance complete, entering arena...');
    setPortalPhase('complete');
    setTimeout(() => {
      setHasJoined(true);
    }, 500);
  }, []);

  // Preload portal videos
  useEffect(() => {
    if (portalConfig.enabled && portalEntranceRef.current) {
      portalEntranceRef.current.load();
    }
  }, [portalConfig.enabled]);

  // 🎮 ARENA INITIAL VIDEO SETUP
  useEffect(() => {
    if (!hasJoined) return;

    console.log('🎮 Arena joined, setting up initial video');

    const timer = setTimeout(() => {
      if (video1Ref.current && videos.idle) {
        video1Ref.current.src = videos.idle;
        video1Ref.current.loop = true;
        video1Ref.current.preload = "auto";
        video1Ref.current.load();

        video1Ref.current.addEventListener('canplaythrough', () => {
          video1Ref.current.style.opacity = '1';
          video1Ref.current.style.zIndex = '2';
          video1Ref.current.play()
              .then(() => console.log('✅ Arena initial video started'))
              .catch(e => console.error("❌ Initial play error:", e));
        }, { once: true });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [hasJoined, videos.idle]);

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

  // 🎬 VIDEO SWITCHING (arena videos) - SA GUARDOM
  // 🎬 VIDEO SWITCHING (arena videos) - SA GUARDOM I REF-OM
  useEffect(() => {
    if (!hasJoined) return;

    const videoSrc = videos[currentScenario];
    if (!videoSrc) return;

    const currentVideo = activeVideoIndex === 0 ? video1Ref.current : video2Ref.current;
    const nextVideo = activeVideoIndex === 0 ? video2Ref.current : video1Ref.current;

    if (!nextVideo || !currentVideo) return;

    // ✅ SKIP ako je prvi render (idle scenario na početku bez src-a)
    if (currentScenario === "idle" && !currentVideo.src) {
      console.log('🎮 First render - skip video switching, use initial setup');
      return;
    }

    // ✅ SKIP ako je scenario isti kao trenutno prikazani video
    if (currentVideo.src && currentVideo.src.includes(videoSrc)) {
      console.log('🎮 Same video already playing, skip switching');
      return;
    }

    console.log('🎬 Switching to scenario:', currentScenario);

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
  }, [currentScenario, hasJoined, videos, activeVideoIndex]); // ✅ activeVideoIndex ostaje u dependencies

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

  // 🎬 PORTAL SCREEN
  if (portalConfig.enabled && !hasJoined) {
    return (
        <div style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <style>{`
          @keyframes ctaClick {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          }
        `}</style>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* INTRO VIDEO */}
            <video
                ref={portalIntroRef}
                playsInline
                muted
                preload="auto"
                onEnded={handleIntroEnded}
                onLoadedMetadata={() => console.log('Intro video loaded')}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: portalPhase === 'intro' ? 1 : 0,

                  zIndex: 2
                }}
            >
              <source src={portalVideos.intro} type="video/mp4" />
            </video>

            {/* ENDFRAME IMAGE */}
            {portalVideos.endframe && (
                <img
                    src={portalVideos.endframe}
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: portalPhase === 'endframe' ? 1 : 0,

                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                />
            )}

            {/* HOVER ENDFRAME */}
            {portalVideos.endframeHover && (
                <img
                    src={portalVideos.endframeHover}
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: isHovering ? 1 : 0,

                      pointerEvents: 'none',
                      zIndex: 3
                    }}
                />
            )}

            {/* PORTAL VIDEO */}
            <video
                ref={portalEntranceRef}
                playsInline
                muted
                preload="auto"
                onEnded={handlePortalEnded}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: portalPhase === 'transition' ? 1 : 0,

                  pointerEvents: 'none',
                  zIndex: 4
                }}
            >
              <source src={portalVideos.portalEntrance} type="video/mp4" />
            </video>

            {/* CTA BUTTON */}
            {showCTA && portalPhase === 'endframe' && (
              <a
                ref={ctaRef}
              href="#"
              onClick={handleCTAClick}
              onMouseEnter={() => {
              console.log('🎯 CTA hover started');
              setIsHovering(true);
            }}
              onMouseLeave={() => {
              console.log('🎯 CTA hover ended');
              setIsHovering(false);
            }}
              style={{
              position: 'absolute',
              left: ctaPosition.x,
              top: ctaPosition.y,
              transform: 'translate(-50%, -50%)',
              width: ctaPosition.size + 'px',
              height: ctaPosition.size + 'px',
              minWidth: ctaPosition.size + 'px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              opacity: 0,
              cursor: 'pointer',
              pointerEvents: 'auto',
              zIndex: 13,
              // 🐛 DEBUG - odkomentiraj da vidiš gde je button
              // background: 'rgba(255, 0, 0, 0.3)',
              // border: '2px solid red',
              // opacity: 1,
            }}
              />
              )}
          </div>
        </div>
    );
  }

  // MAIN ARENA
  return (
      <section className={cls(
          "relative w-full h-screen grid place-items-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden",
          shouldShake && 'animate-screen-shake'
      )}>
        <ScreenFlash isActive={flashEffect.active} color={flashEffect.color} />

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10" />

        <DamagePopup damage={damagePopup.tokenA} position="left" />
        <DamagePopup damage={damagePopup.tokenB} position="right" />

        <StatsPanel score={score} round={round} />

        <div className="absolute top-4 left-6 z-25">
          <PriceTicker token={tokenConfig.tokenA.symbol} price={marketData.tokenA.price} change={marketData.tokenA.change24h} />
        </div>
        <div className="absolute top-4 right-6 z-25">
          <PriceTicker token={tokenConfig.tokenB.symbol} price={marketData.tokenB.price} change={marketData.tokenB.change24h} />
        </div>

        <ComboDisplay combo={combo.tokenA} side="left" />
        <ComboDisplay combo={combo.tokenB} side="right" />

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

        <div className="absolute top-20 left-6 z-30">
          <HealthBar health={health.tokenA} side="left" label={tokenConfig.tokenA.symbol} lastDamage={lastDamage.tokenA} />
        </div>
        <div className="absolute top-20 right-6 z-30">
          <HealthBar health={health.tokenB} side="right" label={tokenConfig.tokenB.symbol} lastDamage={lastDamage.tokenB} />
        </div>

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
            <div style={{
              position: 'absolute',
              inset: '-2rem',
              background: 'linear-gradient(to bottom, rgb(31, 41, 55), rgb(17, 24, 39), rgb(0, 0, 0))',
              border: '8px solid rgb(55, 65, 81)',
              boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.8)',
              borderRadius: '24px'
            }} />

            <div style={{
              position: 'absolute',
              inset: '-0.5rem',
              background: 'black',
              border: '4px solid rgb(17, 24, 39)',
              borderRadius: '16px'
            }} />

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

        {syncMode && tokenConfig.tokenA?.isMock && (
            <div className="absolute bottom-6 left-6 z-40">
              <div className="mock-controls">
                <div className="text-sm font-bold text-purple-400 mb-3 font-display flex items-center gap-2">
                  🎲 MOCK CONTROLS
                </div>

                <div className="mb-3 p-2 glass-dark rounded-lg border border-purple-500/30">
                  <div className="text-xs text-yellow-400 font-semibold">
                    MODE: MANUAL
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Click buttons to trigger attacks
                  </div>
                </div>

                <div className="flex flex-col gap-3">
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
