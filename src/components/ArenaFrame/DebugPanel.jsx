// DebugPanel.jsx - COMPREHENSIVE DIAGNOSTICS
import React, { useState, useEffect } from 'react';

export function DebugPanel({
                               isConnected,
                               health,
                               combo,
                               score,
                               round,
                               marketData,
                               currentScenario,
                               videoState,
                               serverUrl,
                               hasJoined,
                               portalPhase,
                               damagePopup,
                               attackReason,
                               gameOver
                           }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [logs, setLogs] = useState([]);

    // Log scenario changes
    useEffect(() => {
        if (currentScenario) {
            addLog(`🎬 Scenario: ${currentScenario}`);
        }
    }, [currentScenario]);

    // Log video state changes
    useEffect(() => {
        if (videoState) {
            addLog(`📹 Video: ${videoState.currentVideo} (${videoState.isPlaying ? 'playing' : 'paused'})`);
        }
    }, [videoState?.currentVideo, videoState?.isPlaying]);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    };

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="fixed top-4 right-4 z-50 bg-black/80 text-white px-4 py-2 rounded text-xs"
            >
                📊 Show Debug
            </button>
        );
    }

    return (
        <div className="fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto text-xs font-mono">
            <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                <h3 className="font-bold text-sm">🐛 DEBUG PANEL</h3>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-400 hover:text-white"
                >
                    ✕
                </button>
            </div>

            {/* CONNECTION STATUS */}
            <div className="mb-3 p-2 bg-gray-800 rounded">
                <div className="font-bold mb-1">🔌 CONNECTION</div>
                <div className={isConnected ? "text-green-400" : "text-red-400"}>
                    Status: {isConnected ? "✅ Connected" : "❌ Disconnected"}
                </div>
                <div className="text-gray-400">Server: {serverUrl}</div>
            </div>

            {/* PORTAL STATUS */}
            <div className="mb-3 p-2 bg-gray-800 rounded">
                <div className="font-bold mb-1">🌀 PORTAL</div>
                <div>Phase: {portalPhase || 'N/A'}</div>
                <div className={hasJoined ? "text-green-400" : "text-yellow-400"}>
                    Has Joined: {hasJoined ? "✅ Yes" : "⏳ Waiting"}
                </div>
            </div>

            {/* VIDEO STATE */}
            <div className="mb-3 p-2 bg-gray-800 rounded">
                <div className="font-bold mb-1">📹 VIDEO</div>
                <div>Current: {videoState?.currentVideo || 'none'}</div>
                <div className={videoState?.isPlaying ? "text-green-400" : "text-red-400"}>
                    Playing: {videoState?.isPlaying ? "▶️ Yes" : "⏸️ No"}
                </div>
                <div>Scenario: {currentScenario || 'none'}</div>
                <div className="text-gray-400 text-[10px]">
                    Loaded: {videoState?.isLoaded ? '✅' : '❌'}
                </div>
            </div>

            {/* GAME STATE */}
            <div className="mb-3 p-2 bg-gray-800 rounded">
                <div className="font-bold mb-1">🎮 GAME</div>
                <div>Round: {round}</div>
                <div>Score: {score?.tokenA || 0} - {score?.tokenB || 0}</div>
                {gameOver && (
                    <div className="text-yellow-400 font-bold">
                        🏆 Winner: {gameOver}
                    </div>
                )}
            </div>

            {/* HEALTH */}
            <div className="mb-3 p-2 bg-gray-800 rounded">
                <div className="font-bold mb-1">❤️ HEALTH</div>
                <div className="flex justify-between">
                    <span>A: {health?.tokenA?.toFixed(1) || 0} HP</span>
                    <span>B: {health?.tokenB?.toFixed(1) || 0} HP</span>
                </div>
                {(damagePopup?.tokenA || damagePopup?.tokenB) && (
                    <div className="text-red-400 mt-1">
                        💥 Damage: A: {damagePopup.tokenA || '-'} | B: {damagePopup.tokenB || '-'}
                    </div>
                )}
            </div>

            {/* COMBO */}
            <div className="mb-3 p-2 bg-gray-800 rounded">
                <div className="font-bold mb-1">🔥 COMBO</div>
                <div className="flex justify-between">
                    <span>A: {combo?.tokenA || 0}x</span>
                    <span>B: {combo?.tokenB || 0}x</span>
                </div>
            </div>

            {/* MARKET DATA */}
            <div className="mb-3 p-2 bg-gray-800 rounded">
                <div className="font-bold mb-1">📊 MARKET CAP</div>
                <div className="text-[10px] space-y-1">
                    <div>
                        A: ${(marketData?.tokenA?.marketCap / 1e3).toFixed(2)}K
                        <span className={marketData?.tokenA?.priceChange24h >= 0 ? "text-green-400" : "text-red-400"}>
                            {' '}({marketData?.tokenA?.priceChange24h?.toFixed(2)}%)
                        </span>
                    </div>
                    <div>
                        B: ${(marketData?.tokenB?.marketCap / 1e3).toFixed(2)}K
                        <span className={marketData?.tokenB?.priceChange24h >= 0 ? "text-green-400" : "text-red-400"}>
                            {' '}({marketData?.tokenB?.priceChange24h?.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* ATTACK REASON */}
            {attackReason?.attacker && (
                <div className="mb-3 p-2 bg-red-900/50 rounded">
                    <div className="font-bold mb-1">⚔️ LAST ATTACK</div>
                    <div className="text-[10px]">
                        <div>Attacker: {attackReason.attacker}</div>
                        <div>ATK Change: {attackReason.attackerChange?.toFixed(2)}%</div>
                        <div>DEF Change: {attackReason.defenderChange?.toFixed(2)}%</div>
                        <div>MC Diff: {attackReason.mcDifference?.toFixed(2)}%</div>
                    </div>
                </div>
            )}

            {/* LIVE LOGS */}
            <div className="mb-3 p-2 bg-gray-800 rounded">
                <div className="font-bold mb-1">📝 LIVE LOGS</div>
                <div className="space-y-0.5 text-[9px] max-h-32 overflow-y-auto">
                    {logs.length === 0 ? (
                        <div className="text-gray-500">No logs yet...</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="text-gray-300">{log}</div>
                        ))
                    )}
                </div>
            </div>

            {/* MANUAL REFRESH */}
            <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-2"
            >
                🔄 Force Refresh
            </button>
        </div>
    );
}