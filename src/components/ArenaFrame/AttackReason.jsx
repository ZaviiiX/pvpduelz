// src/components/ArenaFrame/AttackReason.jsx
import React, { useEffect, useState } from 'react';

function AttackReason({
                          attacker,
                          attackerChange,
                          defenderChange,
                          tokenConfig
                      }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (attacker && attackerChange !== null && defenderChange !== null) {
            setIsVisible(true);
            const timer = setTimeout(() => setIsVisible(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [attacker, attackerChange, defenderChange]);

    if (!isVisible || !attacker) return null;

    const attackerToken = tokenConfig[attacker];
    const defenderToken = tokenConfig[attacker === 'tokenA' ? 'tokenB' : 'tokenA'];
    const difference = Math.abs(attackerChange - defenderChange);

    return (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[55] pointer-events-none">
            <div className="animate-march-in">
                <div className="glass-dark border-4 border-amber-600/50 rounded-lg p-6 min-w-[400px] shadow-2xl">
                    <div className="text-center mb-4">
                        <h3 className="font-ancient text-xl gold-text tracking-wider mb-2">
                            ⚔️ ATTACK REASON ⚔️
                        </h3>
                        <div className="h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
                    </div>

                    <div className="space-y-3 mb-4">
                        {/* Attacker */}
                        <div className="flex items-center justify-between bg-green-900/20 border border-green-600/30 rounded p-3">
                            <span className="font-ancient text-sm text-amber-200">
                                {attackerToken.symbol}
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-bold text-green-400">
                                    +{attackerChange.toFixed(3)}%
                                </div>
                                <div className="text-green-400 text-xl">⬆️</div>
                            </div>
                        </div>

                        {/* VS Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-amber-900/50" />
                            <span className="text-sm font-ancient text-amber-500">VS</span>
                            <div className="flex-1 h-px bg-amber-900/50" />
                        </div>

                        {/* Defender */}
                        <div className="flex items-center justify-between bg-red-900/20 border border-red-600/30 rounded p-3">
                            <span className="font-ancient text-sm text-amber-200">
                                {defenderToken.symbol}
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-bold text-red-400">
                                    {defenderChange >= 0 ? '+' : ''}{defenderChange.toFixed(3)}%
                                </div>
                                <div className="text-red-400 text-xl">⬇️</div>
                            </div>
                        </div>
                    </div>

                    {/* Difference Badge */}
                    <div className="bg-gradient-to-r from-red-900/40 via-orange-900/40 to-red-900/40 border-2 border-orange-500/50 rounded-lg p-3 text-center">
                        <div className="text-xs font-ancient text-amber-300 mb-1">
                            MC DIFFERENCE
                        </div>
                        <div className="text-3xl font-bold gold-text animate-pulse">
                            {difference.toFixed(3)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AttackReason;
