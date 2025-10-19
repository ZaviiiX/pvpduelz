import React from 'react';
import { cls, getHealthColor, isRecentDamage } from './utils/index.js';

export function HealthBar({
                              health,
                              maxHealth = 100,
                              side = "left",
                              label = "PLAYER",
                              lastDamage = 0
                          }) {
    const healthPercent = (health / maxHealth) * 100;
    const isLowHealth = healthPercent < 30;
    const isCritical = healthPercent < 15;
    const isRecent = isRecentDamage(lastDamage);

    return (
        <div className="font-body">
            <div className={cls(
                "text-xs text-white mb-1 font-semibold tracking-wide",
                side === "left" ? "text-left" : "text-right"
            )}>
                {label}
            </div>

            <div className={cls("health-bar-container", isRecent && "animate-pulse")}>
                {isRecent && (
                    <div className="absolute inset-0 bg-red-500 opacity-60 animate-pulse" />
                )}

                <div
                    className={cls(
                        "health-bar-fill",
                        getHealthColor(healthPercent),
                        isCritical && "animate-pulse",
                        isLowHealth && "health-bar-glow"
                    )}
                    style={{ width: `${healthPercent}%` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/20" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-black">
                    {Math.round(health)}
                </div>

                {isCritical && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-red-500 font-black animate-bounce">
                        ⚠️ DANGER
                    </div>
                )}
            </div>
        </div>
    );
}
