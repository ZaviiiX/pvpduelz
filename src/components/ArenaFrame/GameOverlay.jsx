import React from 'react';

export function GameOverlay({ winner, tokenConfig, score }) {
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
            </div>
        </div>
    );
}
