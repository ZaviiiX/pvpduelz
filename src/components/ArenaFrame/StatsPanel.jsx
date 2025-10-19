import React from 'react';

export function StatsPanel({ score, round }) {
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
