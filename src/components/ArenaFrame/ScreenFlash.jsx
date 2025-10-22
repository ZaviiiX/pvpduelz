import React from 'react';
import { getFlashColor } from './utils/index.js';

export function ScreenFlash({ isActive, color = "red" }) {
    if (!isActive) return null;

    return (
        <div
            className="absolute inset-0 pointer-events-none z-50"
            style={{
                background: getFlashColor(color),
                animation: 'flash 0.3s ease-out'
            }}
        />
    );
}
