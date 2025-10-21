// GameOverlay.jsx - WITH AUTO-HIDE
import React, { useEffect, useState } from 'react';

export function GameOverlay({ winner, tokenConfig, score }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Auto-hide nakon 8 sekundi
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 8000);

        return () => clearTimeout(timer);
    }, [winner]);

    if (!isVisible) return null;

    return (
        <div className="game-over-overlay absolute inset-0 z-50 flex items-center justify-center">
            <div className="text-center animate-scale-in">
                <h2 className="game-over-title mb-8">
                    {winner === 'tokenA'
                        ? `${tokenConfig.tokenA.symbol} WINS!`
                        : `${tokenConfig.tokenB.symbol} WINS!`}
                </h2>
                <p className="font-display text-2xl text-white mb-4">GAME OVER</p>
                <p className="font-body text-lg text-gray-400">
                    Final Score: {score.tokenA} - {score.tokenB}
                </p>
                <p className="font-body text-sm text-amber-500/60 mt-4 animate-pulse">
                    Restarting game in 2 seconds...
                </p>
            </div>
        </div>
    );
}
