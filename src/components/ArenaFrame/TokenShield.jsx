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
                    <img src={icon} alt={label} className="w-16 h-16 object-contain" />
                ) : (
                    <span className="text-white text-xl font-bold">{label.slice(0, 3)}</span>
                )}
            </div>

            {isMoving && (
                <div className={cls(
                    "absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-bold",
                    marketChange > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"
                )}>
                    {marketChange > 0 ? '▲' : '▼'} {Math.abs(marketChange).toFixed(1)}%
                </div>
            )}
        </div>
    );
}
