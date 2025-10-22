import React from 'react';

function toRoman(num) {
    if (!num || num <= 0) return 'I';
    const map = [
        [1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],
        [100,'C'],[90,'XC'],[50,'L'],[40,'XL'],
        [10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']
    ];
    let out = '';
    for (const [v, s] of map) {
        while (num >= v) { out += s; num -= v; }
    }
    return out;
}

export function StatsPanel({ score, round }) {
    return (
        <div className="absolute bottom-6 right-6 z-20">
            <div className="stats-panel">
                <div className="text-sm font-bold gold-text mb-3 font-ancient">TABULA</div>
                <div className="flex flex-col gap-2 text-sm font-scroll">
                    <div className="flex justify-between text-gray-300">
                        <span>Round:</span>
                        <span className="text-white font-bold">{toRoman(round)}</span>
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