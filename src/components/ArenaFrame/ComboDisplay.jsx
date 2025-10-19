import React from 'react';
import { cls } from './utils/index.js';

export function ComboDisplay({ combo, side = "left" }) {
    if (combo < 2) return null;

    return (
        <div className={cls(
            "combo-display absolute top-32 z-30 font-display",
            side === "left" ? "left-6" : "right-6"
        )}>
            <div className="text-2xl font-black text-white">{combo}x COMBO!</div>
        </div>
    );
}
