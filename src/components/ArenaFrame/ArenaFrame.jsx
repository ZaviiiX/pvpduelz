// ArenaFrame.jsx - COMPLETE RESPONSIVE VERSION
import React, { useEffect } from 'react';
import { usePortal, useWebSocket, useVideoPlayer } from './hooks';
import { PortalScreen } from './PortalScreen';
import { MockControls } from './MockControls';
import { GameOverlay } from './GameOverlay';
import RoundVictory from './RoundVictory';
import { StatusIndicator } from './StatusIndicator';
import { VideoPlayer } from './VideoPlayer';
import  HealthBar  from './HealthBar';
import { TokenShield } from './TokenShield';
import { ComboDisplay } from './ComboDisplay';
import { PriceTicker } from './PriceTicker';
import { StatsPanel } from './StatsPanel';
import { ScreenFlash } from './ScreenFlash';
import { DamagePopup } from './DamagePopup';
import AttackReason from './AttackReason';
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

    const portal = usePortal(portalConfig, portalVideos);
    const videoPlayer = useVideoPlayer(portal.hasJoined, videos);
    const ws = useWebSocket(syncMode, serverUrl, portal.hasJoined, videoPlayer.setCurrentScenario);

    const shouldShake = shouldShakeScreen(ws.currentScenario);

    if (portalConfig.enabled && !portal.hasJoined) {
        return <PortalScreen {...portal} portalVideos={portalVideos} />;
    }

    return (
        <section
            className={cls(
                "relative w-full h-screen grid place-items-center stone-bg overflow-hidden",
                shouldShake && "animate-battle-shake"
            )}
        >
            <ScreenFlash isActive={ws.flashEffect.active} color={ws.flashEffect.color} />
            <div className="colosseum-arches" />

            <div className="torch torch-left" />
            <div className="torch torch-right" />
            <div className="pillar pillar-left" />
            <div className="pillar pillar-right" />
            <div className="scanlines" />

            <DamagePopup damage={ws.damagePopup.tokenA} position="left" />
            <DamagePopup damage={ws.damagePopup.tokenB} position="right" />

            {/* 🆕 ROUND VICTORY SCREEN */}
            {ws.roundVictory.winner && (
                <RoundVictory
                    winner={ws.roundVictory.winner}
                    tokenConfig={ws.tokenConfig}
                    score={ws.score}
                    currentRound={ws.roundVictory.currentRound}
                />
            )}

            {/* ATTACK REASON POPUP */}
            <AttackReason
                attacker={ws.attackReason?.attacker}
                attackerChange={ws.attackReason?.attackerChange}
                defenderChange={ws.attackReason?.defenderChange}
                tokenConfig={ws.tokenConfig}
            />

            {/* 📱 RESPONSIVE HUD LAYOUT */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="h-full w-full max-w-[1800px] mx-auto relative px-2 sm:px-4">

                    {/* TOP BAR - Price Tickers */}
                    <div className="absolute top-2 sm:top-4 md:top-6 left-2 sm:left-4 md:left-6 right-2 sm:right-4 md:right-6 z-[40] pointer-events-auto">
                        <div className="flex justify-between items-start gap-2 sm:gap-3 md:gap-4">
                            <PriceTicker
                                token={ws.tokenConfig.tokenA.symbol}
                                price={ws.marketData.tokenA.price}
                                change={ws.marketData.tokenA.change24h}
                                marketCap={ws.marketData.tokenA.marketCap}
                                volume24h={ws.marketData.tokenA.volume24h}
                            />
                            <PriceTicker
                                token={ws.tokenConfig.tokenB.symbol}
                                price={ws.marketData.tokenB.price}
                                change={ws.marketData.tokenB.change24h}
                                marketCap={ws.marketData.tokenB.marketCap}
                                volume24h={ws.marketData.tokenB.volume24h}
                            />
                        </div>
                    </div>

                    {/* HEALTH BARS - Horizontal Below Price */}
                    <div className="absolute top-[110px] sm:top-[130px] md:top-[150px] left-2 sm:left-4 md:left-6 right-2 sm:right-4 md:right-6 z-[35] pointer-events-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-stretch gap-2 sm:gap-3 md:gap-4">
                            <div className="flex-1 min-w-0">
                                <HealthBar
                                    health={ws.health.tokenA}
                                    side="left"
                                    label={ws.tokenConfig.tokenA.symbol}
                                    lastDamage={ws.lastDamage.tokenA}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <HealthBar
                                    health={ws.health.tokenB}
                                    side="right"
                                    label={ws.tokenConfig.tokenB.symbol}
                                    lastDamage={ws.lastDamage.tokenB}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SIDE SHIELDS - Desktop Only */}
                    <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 hidden lg:block z-20 pointer-events-none">
                        <TokenShield
                            label={ws.tokenConfig.tokenA.symbol}
                            tone="#6366f1"
                            icon={ws.tokenConfig.tokenA.icon}
                            {...getTokenStatus(ws.currentScenario, "tokenA")}
                            marketChange={ws.marketData.tokenA.change24h}
                        />
                    </div>

                    <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 hidden lg:block z-20 pointer-events-none">
                        <TokenShield
                            label={ws.tokenConfig.tokenB.symbol}
                            tone="#a855f7"
                            icon={ws.tokenConfig.tokenB.icon}
                            {...getTokenStatus(ws.currentScenario, "tokenB")}
                            marketChange={ws.marketData.tokenB.change24h}
                        />
                    </div>

                    {/* COMBO DISPLAYS */}
                    <ComboDisplay combo={ws.combo.tokenA} side="left" />
                    <ComboDisplay combo={ws.combo.tokenB} side="right" />

                    {/* BOTTOM BAR - Stats */}
                    <div className="absolute bottom-2 sm:bottom-4 md:bottom-6 left-2 sm:left-4 md:left-6 right-2 sm:right-4 md:right-6 z-20 pointer-events-auto">
                        <div className="flex justify-center sm:justify-end">
                            <StatsPanel score={ws.score} round={ws.round} />
                        </div>
                    </div>
                </div>
            </div>

            {/* TOP CENTER - Status */}
            <StatusIndicator
                syncMode={syncMode}
                devMode={devMode}
                isConnected={ws.isConnected}
                userCount={ws.userCount}
            />

            {/* DECORATIVE ELEMENTS - Desktop Only */}
            <div className="laurel laurel-tl hidden xl:block" />
            <div className="laurel laurel-tr hidden xl:block" />
            <div className="laurel laurel-bl hidden xl:block" />
            <div className="laurel laurel-br hidden xl:block" />

            {/* MAIN VIDEO PLAYER */}
            <VideoPlayer
                video1Ref={videoPlayer.video1Ref}
                video2Ref={videoPlayer.video2Ref}
                aspect={aspect}
                fullHeight={fullHeight}
            />

            {/* DEV & OVERLAYS */}
            {devMode && syncMode && (
                <MockControls
                    socketRef={ws.socketRef}
                    tokenConfig={ws.tokenConfig}
                    setCurrentScenario={videoPlayer.setCurrentScenario}
                />
            )}

            {/* Game Over Overlay */}
            {ws.gameOver && (
                <GameOverlay winner={ws.gameOver} tokenConfig={ws.tokenConfig} score={ws.score} />
            )}
        </section>
    );
}