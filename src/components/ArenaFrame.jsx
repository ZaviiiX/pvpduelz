// components/ArenaFrame.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";

const cls = (...c) => c.filter(Boolean).join(" ");

function TokenShield({ label = "SOL", tone = "#14F195", isActive = false, isWinning = false, isLosing = false }) {
  return (
    <div className="relative">
      {/* Glow effect za aktivni token */}
      {isActive && (
        <div 
          className="absolute inset-0 blur-3xl opacity-60 animate-pulse"
          style={{ 
            background: `radial-gradient(circle, ${tone} 0%, transparent 70%)`,
            transform: 'scale(1.5)'
          }}
        />
      )}
      
      {/* Winning particles */}
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
      
      {/* Losing effect */}
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
      
      {/* Token image with floating animation */}
      <div className={`relative animate-float ${isActive ? 'scale-110' : ''} transition-transform duration-300`}>
        <img
          src={`/images/${label.toLowerCase()}_logo.png`}
          className="w-30 h-30 drop-shadow-[0_0_10px_rgba(0,0,0,0.6)]"
          style={{ 
            filter: `contrast(1.05) ${isActive ? 'brightness(1.2)' : ''}`,
            transform: isWinning ? 'scale(1.1)' : isLosing ? 'scale(0.95)' : 'scale(1)'
          }}
        />
        
        {/* Rotating ring for winning */}
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
      
      {/* Status indicator */}
      {(isWinning || isLosing) && (
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          isWinning ? 'bg-green-500 text-black animate-bounce' : 'bg-red-500 text-white animate-pulse'
        }`}>
          {isWinning ? '🚀 PUMP' : '📉 DUMP'}
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
  videos = {
    idle: "/videos/solana-vs-bnb.mp4",
    solPump: "/videos/sol-winning.mp4",
    bnbPump: "/videos/bnb-winning.mp4",
    solDump: "/videos/sol-losing.mp4",
    bnbDump: "/videos/bnb-losing.mp4",
    bothPump: "/videos/both-pumping.mp4",
    bothDump: "/videos/both-dumping.mp4",
    // Back videi - vraćanje na početak
    solBack: "/videos/back_sol.mp4",
    bnbBack: "/videos/back_bnb.mp4",
    bothBack: "/videos/back_both.mp4",
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
  const videoRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [arenaLoaded, setArenaLoaded] = useState(true);
  const [currentScenario, setCurrentScenario] = useState("idle");
  const [pendingScenario, setPendingScenario] = useState(null);
  const [marketData, setMarketData] = useState({
    sol: { price: 0, change24h: 0 },
    bnb: { price: 0, change24h: 0 },
  });

  const currentVideoSrc = videos[currentScenario] || videos.idle;

  // Odredi status tokena na temelju scenarija
  const getTokenStatus = (token) => {
    const isSol = token.label.toLowerCase().includes('sol');
    const scenario = currentScenario.toLowerCase();
    
    // Za back videe, održi status iz prethodnog scenarija
    const isRelevantToken = scenario.includes(isSol ? 'sol' : 'bnb') || scenario.includes('both');
    
    return {
      isActive: isRelevantToken,
      isWinning: scenario.includes('pump') && isRelevantToken,
      isLosing: scenario.includes('dump') && isRelevantToken
    };
  };

  const handleVideoEnded = useCallback(() => {
    console.log("✅ Video ended:", currentScenario);
    
    // PRIORITET 1: Ako je pending scenario, prebaci na njega
    if (pendingScenario) {
      console.log(`🎬 Switching to pending: ${pendingScenario}`);
      setCurrentScenario(pendingScenario);
      setPendingScenario(null);
      return;
    }
    
    // PRIORITET 2: Automatski prijelaz na "back" video nakon pump/dump
    if (currentScenario === "solPump" || currentScenario === "solDump") {
      console.log("🔙 Transitioning to solBack");
      setCurrentScenario("solBack");
      return;
    }
    
    if (currentScenario === "bnbPump" || currentScenario === "bnbDump") {
      console.log("🔙 Transitioning to bnbBack");
      setCurrentScenario("bnbBack");
      return;
    }
    
    if (currentScenario === "bothPump" || currentScenario === "bothDump") {
      console.log("🔙 Transitioning to bothBack");
      setCurrentScenario("bothBack");
      return;
    }
    
    // PRIORITET 3: Nakon "back" videa, vrati se na idle
    if (currentScenario === "solBack" || currentScenario === "bnbBack" || currentScenario === "bothBack") {
      console.log("🏠 Returning to idle from:", currentScenario);
      setCurrentScenario("idle");
      return;
    }
    
    // FALLBACK: Ako idle završi (ne bi trebao jer je loop), ostani na idle
    if (currentScenario === "idle") {
      console.log("🔄 IDLE ended (shouldn't happen), restarting...");
      if (videoRef.current) {
        videoRef.current.play();
      }
    }
  }, [pendingScenario, currentScenario]);

  const handleScenarioChange = useCallback((newScenario) => {
    if (newScenario === currentScenario) return;
    
    console.log(`🎬 Scenario change requested: ${currentScenario} → ${newScenario}`);
    setPendingScenario(newScenario);
    
    if (videoRef.current) {
      videoRef.current.loop = false;
      console.log("🔄 Loop disabled, waiting for video to end...");
    }
  }, [currentScenario]);

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

  useEffect(() => {
    if (videoRef.current && currentScenario) {
      console.log(`📺 Loading new video: ${currentScenario}`);
      console.log(`📂 Video path: ${currentVideoSrc}`);
      
      // Provjeri postoji li video
      const videoSrc = videos[currentScenario];
      if (!videoSrc) {
        console.warn(`⚠️ Video not found for scenario: ${currentScenario}`);
        console.log("Available videos:", Object.keys(videos));
        
        // Ako je back video, preskoči na idle
        if (currentScenario.includes("Back")) {
          console.warn("Back video missing, jumping to idle");
          setCurrentScenario("idle");
        }
        return;
      }
      
      videoRef.current.load();
      
      // Samo IDLE se loop-a, svi drugi videi se igraju jednom
      const shouldLoop = currentScenario === "idle";
      videoRef.current.loop = shouldLoop;
      console.log(`🔄 Loop: ${shouldLoop ? 'ON' : 'OFF'} for ${currentScenario}`);
      
      videoRef.current.play()
        .then(() => console.log(`▶️ Playing: ${currentScenario}`))
        .catch(err => console.error("Video play error:", err));
    }
  }, [currentScenario, videos, currentVideoSrc]);

  return (
    <section className="relative w-full h-screen grid place-items-center bg-[#0b0d10] overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
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
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-shake { animation: shake 0.5s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
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

      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1 bg-black/50 rounded-xl backdrop-blur-md border border-white/10 z-20">
        <span className="text-xs tracking-widest text-white/70">SOLANA vs BNB – PIXEL ARENA</span>
        <span className="w-1 h-1 rounded-full bg-white/40" />
        <span className="text-[10px] text-white/50">{aspect}</span>
        {cryptoConfig.enabled && (
          <>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="text-[10px] text-green-400 uppercase">{currentScenario}</span>
          </>
        )}
        {pendingScenario && (
          <>
            <span className="w-1 h-1 rounded-full bg-yellow-400" />
            <span className="text-[10px] text-yellow-400 uppercase animate-pulse">→ {pendingScenario}</span>
          </>
        )}
        {/* Indicator za back transition */}
        {currentScenario.includes("Back") && (
          <>
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <span className="text-[10px] text-blue-400 uppercase animate-pulse">🔙 RETURNING</span>
          </>
        )}
      </div>

      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
        <TokenShield {...leftToken} {...getTokenStatus(leftToken)} />
      </div>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
        <TokenShield {...rightToken} {...getTokenStatus(rightToken)} />
      </div>

      <div className="relative z-10" style={{ aspectRatio: aspect, width: fullHeight ? "auto" : "min(92vw, 1100px)", height: fullHeight ? "calc(100vh - 180px)" : undefined, maxHeight: fullHeight ? "calc(100vh - 180px)" : undefined, maxWidth: "min(92vw, 1600px)" }}>
        <div className={cls("relative w-full h-full transition-all duration-500", loaded ? "opacity-100" : "opacity-0")}>
          <video
            key={currentScenario}
            ref={videoRef}
            className="w-full h-full block pointer-events-none"
            src={currentVideoSrc}
            poster={poster}
            playsInline
            autoPlay
            muted
            onLoadedData={() => setLoaded(true)}
            onEnded={handleVideoEnded}
            onError={(e) => {
              console.error(`❌ Video error for ${currentScenario}:`, e);
              // Ako back video ne učita, preskoči na idle
              if (currentScenario.includes("Back")) {
                console.warn("Back video missing, skipping to idle");
                setCurrentScenario("idle");
              }
            }}
          />
          
          {pendingScenario && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-yellow-500 rounded-xl shadow-2xl animate-pulse z-50">
              <div className="text-sm font-black text-black">⏳ WAITING FOR VIDEO TO END...</div>
              <div className="text-xs font-bold text-black/80 mt-1">
                NEXT: {pendingScenario.toUpperCase()}
              </div>
            </div>
          )}
          
          {/* Back transition indicator */}
          {currentScenario.includes("Back") && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-blue-500 rounded-xl shadow-2xl z-50">
              <div className="text-sm font-black text-white">🔙 RETURNING TO IDLE...</div>
              <div className="text-xs font-bold text-white/80 mt-1">
                Transition: {currentScenario.toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      {cryptoConfig.enabled && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-4 z-20">
          <div className="px-3 py-2 bg-black/60 rounded-lg backdrop-blur-md border border-white/10">
            <div className="text-[10px] text-white/50 mb-1">SOLANA</div>
            <div className={cls("text-sm font-bold", marketData.sol.change24h >= 0 ? "text-green-400" : "text-red-400")}>
              {marketData.sol.change24h >= 0 ? "+" : ""}{marketData.sol.change24h.toFixed(2)}%
            </div>
          </div>
          <div className="px-3 py-2 bg-black/60 rounded-lg backdrop-blur-md border border-white/10">
            <div className="text-[10px] text-white/50 mb-1">BNB</div>
            <div className={cls("text-sm font-bold", marketData.bnb.change24h >= 0 ? "text-green-400" : "text-red-400")}>
              {marketData.bnb.change24h >= 0 ? "+" : ""}{marketData.bnb.change24h.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
        <div className="text-[10px] text-white/70 mb-1 text-center">TEST SCENARIOS</div>
        
        {/* Video availability status */}
        <div className="px-2 py-1 bg-black/80 rounded text-[8px] text-white/50 mb-1">
          <div>Videos loaded:</div>
          <div>✅ {Object.keys(videos).filter(k => videos[k]).length} / {Object.keys(videos).length}</div>
        </div>
        
        {["idle", "solPump", "bnbPump", "solDump", "bnbDump", "bothPump", "bothDump"].map(scenario => {
          const labels = {
            idle: "IDLE",
            solPump: "SOL 🚀",
            bnbPump: "BNB 🚀",
            solDump: "SOL 📉",
            bnbDump: "BNB 📉",
            bothPump: "BOTH 🚀🚀",
            bothDump: "BOTH 📉📉"
          };
          return (
            <button
              key={scenario}
              onClick={() => handleScenarioChange(scenario)}
              className={cls(
                "px-3 py-1.5 rounded text-xs font-bold transition-all",
                currentScenario === scenario ? "bg-white text-black" :
                pendingScenario === scenario ? "bg-yellow-500 text-black animate-pulse" :
                "bg-black/60 text-white/70 hover:bg-black/80"
              )}
            >
              {labels[scenario]}
            </button>
          );
        })}
      </div>
    </section>
  );
}