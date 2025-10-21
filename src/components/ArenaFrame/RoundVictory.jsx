// RoundVictory.jsx - COMPLETE FIX
import React, { useEffect, useState } from 'react';

export function RoundVictory({ winner, tokenConfig, score, currentRound }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 4000);

        return () => clearTimeout(timer);
    }, [winner]);

    if (!isVisible || !winner) return null;

    const winnerToken = tokenConfig[winner];

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
            {/*                          ^^^^^^ CHANGED: z-[45] → z-[60] */}
            <div className="animate-march-in">
                <div className="glass-dark border-4 border-amber-600/60 rounded-lg p-8 min-w-[500px] shadow-2xl">

                    <div className="text-center mb-4">
                        <p className="text-sm font-ancient text-amber-500/70 tracking-widest">
                            ROUND {currentRound}
                        </p>
                    </div>

                    <div className="text-center mb-6">
                        <h2 className="text-6xl font-ancient gold-text mb-2 animate-pulse">
                            {winnerToken.symbol}
                        </h2>
                        <p className="text-2xl text-amber-200/90 font-ancient tracking-wider">
                            VICTORIOUS!
                        </p>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent mb-6" />

                    <div className="text-center">
                        <p className="text-sm font-ancient text-amber-500/70 mb-2">
                            CURRENT SCORE
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-center">
                                <p className="text-xs text-amber-300/60 mb-1">{tokenConfig.tokenA.symbol}</p>
                                <p className="text-3xl gold-text font-bold">{score.tokenA}</p>
                            </div>
                            <span className="text-2xl text-amber-500/50">-</span>
                            <div className="text-center">
                                <p className="text-xs text-amber-300/60 mb-1">{tokenConfig.tokenB.symbol}</p>
                                <p className="text-3xl gold-text font-bold">{score.tokenB}</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-xs font-ancient text-amber-500/50 tracking-widest animate-pulse">
                            NEXT ROUND BEGINS SOON...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoundVictory;
