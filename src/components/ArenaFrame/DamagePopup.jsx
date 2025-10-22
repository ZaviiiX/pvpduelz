import React from 'react';
import { cls } from './utils/index.js';

export function DamagePopup({ damage, position = "left" }) {
    if (!damage) return null;

    return (
        <div className={cls(
            "damage-popup absolute top-40 z-40",
            position === "left" ? "left-24" : "right-24"
        )}>
            -{damage}
        </div>
    );
}
