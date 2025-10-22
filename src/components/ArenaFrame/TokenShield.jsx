import React from 'react';
import { cls } from './utils/index.js';

export function TokenShield({
                                label = "SOL",
                                tone = "#14F195",
                                isActive = false,
                                marketChange = 0,
                                icon = null
                            }) {
    const isMoving = Math.abs(marketChange) > 0.5;

    return (
        <div className="relative">
            {isActive && (
                <div
                    className="absolute inset-0 blur-3xl opacity-60 animate-pulse"
                    style={{
                        background: `radial-gradient(circle, ${tone} 0%, transparent 70%)`,
                        transform: 'scale(1.5)'
                    }}
                />
            )}

            <div
                className={cls(
                    "token-shield animate-float-slow",
                    isActive && "token-shield-active"
                )}
                style={isActive ? { borderColor: tone, boxShadow: `0 0 30px ${tone}` } : {}}
            >
                {icon ? (
                    // ✅ NEW: Check if it's URL or emoji
                    icon.startsWith('/') || icon.startsWith('http') ? (
                        <img src={icon} alt={label} className="w-16 h-16 object-contain" />
                    ) : (
                        <span className="text-6xl" role="img" aria-label={label}>{icon}</span>
                    )
                ) : (
                    <span className="text-white text-xl font-bold">{label.slice(0, 3)}</span>
                )}
            </div>


        </div>
    );
}
