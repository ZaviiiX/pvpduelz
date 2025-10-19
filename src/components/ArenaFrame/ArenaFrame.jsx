import React, { useEffect } from 'react';
import { usePortal, useWebSocket, useVideoPlayer } from './hooks';
import { PortalScreen } from './PortalScreen';
import { MockControls } from './MockControls';
import { GameOverlay } from './GameOverlay';
import { StatusIndicator } from './StatusIndicator';
import { VideoPlayer } from './VideoPlayer';
import { HealthBar } from './HealthBar';
import { TokenShield } from './TokenShield';
import { ComboDisplay } from './ComboDisplay';
import { PriceTicker } from './PriceTicker';
import { StatsPanel } from './StatsPanel';
import { ScreenFlash } from './ScreenFlash';
import { DamagePopup } from './DamagePopup';
import { cls, getTokenStatus, shouldShakeScreen } from './utils';
import { DEFAULT_CONFIG } from './constants';
import './ArenaFrame.css';

export default function ArenaFrame(props) {
  const {
    aspect = DEFAULT_CONFIG.aspect,
    fullHeight = DEFAULT_CONFIG.fullHeight,
    devMode = DEFAULT_CONFIG.devMode,
    syncMode = DEFAULT_CONFIG.syncMode,
    serverUrl = DEFAULT_CONFIG.serverUrl,
    videos = DEFAULT_CONFIG.videos,
    portalVideos = DEFAULT_CONFIG.portalVideos,
    portalConfig = DEFAULT_CONFIG.portalConfig,
  } = props;

  // 🎬 Portal Logic
  const portal = usePortal(portalConfig, portalVideos);

  // 🎬 Video Player Logic (initialize FIRST to get setCurrentScenario)
  const videoPlayer = useVideoPlayer(portal.hasJoined, videos);

  // 🌐 WebSocket Logic (pass setCurrentScenario from video player)
  const ws = useWebSocket(syncMode, serverUrl, portal.hasJoined, videoPlayer.setCurrentScenario);

  // ✅ REMOVED: No forced sync! Video player manages its own flow
  // WebSocket updates go through setCurrentScenario with 'websocket' source
  // which respects video sequences (gets blocked during attack→back→idle)

  const shouldShake = shouldShakeScreen(ws.currentScenario);

  // 🎬 PORTAL SCREEN
  if (portalConfig.enabled && !portal.hasJoined) {
    return <PortalScreen {...portal} portalVideos={portalVideos} />;
  }

  // MAIN ARENA
  return (
      <section className={cls(
          "relative w-full h-screen grid place-items-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden",
          shouldShake && 'animate-screen-shake'
      )}>
        <ScreenFlash isActive={ws.flashEffect.active} color={ws.flashEffect.color} />

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10" />

        <DamagePopup damage={ws.damagePopup.tokenA} position="left" />
        <DamagePopup damage={ws.damagePopup.tokenB} position="right" />

        <StatsPanel score={ws.score} round={ws.round} />

        <div className="absolute top-4 left-6 z-25">
          <PriceTicker
              token={ws.tokenConfig.tokenA.symbol}
              price={ws.marketData.tokenA.price}
              change={ws.marketData.tokenA.change24h}
          />
        </div>
        <div className="absolute top-4 right-6 z-25">
          <PriceTicker
              token={ws.tokenConfig.tokenB.symbol}
              price={ws.marketData.tokenB.price}
              change={ws.marketData.tokenB.change24h}
          />
        </div>

        <ComboDisplay combo={ws.combo.tokenA} side="left" />
        <ComboDisplay combo={ws.combo.tokenB} side="right" />

        <StatusIndicator
            syncMode={syncMode}
            devMode={devMode}
            isConnected={ws.isConnected}
            userCount={ws.userCount}
        />

        <div className="absolute top-20 left-6 z-30">
          <HealthBar
              health={ws.health.tokenA}
              side="left"
              label={ws.tokenConfig.tokenA.symbol}
              lastDamage={ws.lastDamage.tokenA}
          />
        </div>
        <div className="absolute top-20 right-6 z-30">
          <HealthBar
              health={ws.health.tokenB}
              side="right"
              label={ws.tokenConfig.tokenB.symbol}
              lastDamage={ws.lastDamage.tokenB}
          />
        </div>

        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
          <TokenShield
              label={ws.tokenConfig.tokenA.symbol}
              tone="#6366f1"
              icon={ws.tokenConfig.tokenA.icon}
              {...getTokenStatus(ws.currentScenario, 'tokenA')}
              marketChange={ws.marketData.tokenA.change24h}
          />
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:block z-20">
          <TokenShield
              label={ws.tokenConfig.tokenB.symbol}
              tone="#a855f7"
              icon={ws.tokenConfig.tokenB.icon}
              {...getTokenStatus(ws.currentScenario, 'tokenB')}
              marketChange={ws.marketData.tokenB.change24h}
          />
        </div>

        <VideoPlayer
            video1Ref={videoPlayer.video1Ref}
            video2Ref={videoPlayer.video2Ref}
            aspect={aspect}
            fullHeight={fullHeight}
        />

        {devMode && syncMode && (
            <MockControls
                socketRef={ws.socketRef}
                tokenConfig={ws.tokenConfig}
                setCurrentScenario={videoPlayer.setCurrentScenario}
            />
        )}

        {ws.gameOver && (
            <GameOverlay
                winner={ws.gameOver}
                tokenConfig={ws.tokenConfig}
                score={ws.score}
            />
        )}
      </section>
  );
}
