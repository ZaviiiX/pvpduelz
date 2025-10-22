// HealthBar.jsx — CLEAN ROMAN GLADIUS EDITION
import React, { useMemo } from "react";

const cls = (...c) => c.filter(Boolean).join(" ");

function romanPercent(p) {
    if (p >= 95) return "C";
    if (p >= 90) return "XC";
    if (p >= 80) return "LXXX";
    if (p >= 70) return "LXX";
    if (p >= 60) return "LX";
    if (p >= 50) return "L";
    if (p >= 40) return "XL";
    if (p >= 30) return "XXX";
    if (p >= 20) return "XX";
    if (p >= 10) return "X";
    if (p > 0)   return "V";
    return "—";
}

export default function HealthBar({
                                      health,
                                      maxHealth = 100,
                                      side = "left",
                                      label = "LEGIO",
                                      lastDamage = 0,
                                      orientation = "horizontal" // 'horizontal' | 'vertical'
                                  }) {
    const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    const isLow = pct < 30;
    const isCrit = pct < 15;
    const tookRecentHit = Date.now() - lastDamage < 450;

    // 12 segmenta
    const segments = useMemo(() => {
        const count = 12;
        const per = 100 / count;
        return new Array(count).fill(0).map((_, i) => ({
            fill: pct >= (i + 1) * per
        }));
    }, [pct]);

    const isVertical = orientation === 'vertical';

    // Compute fill gradient classes based on side and health state
    const fillGradientClass = useMemo(() => {
        // critical state overrides everything (red)
        if (isCrit) {
            return isVertical
                ? "bg-gradient-to-t from-red-600 via-red-500 to-red-400 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                : "bg-gradient-to-r from-red-600 via-red-500 to-red-400 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]";
        }

        // low state uses warm/orange palette
        if (isLow) {
            return isVertical
                ? "bg-gradient-to-t from-orange-500 via-amber-500 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]";
        }

        // Normal state: left = purple, right = amber/yellow
        if (side === 'left') {
            return isVertical
                ? "bg-gradient-to-t from-indigo-600 via-purple-500 to-fuchsia-400 shadow-[0_0_15px_rgba(124,58,237,0.35)]"
                : "bg-gradient-to-r from-indigo-600 via-purple-500 to-fuchsia-400 shadow-[0_0_15px_rgba(124,58,237,0.35)]";
        }

        // default (right)
        return isVertical
            ? "bg-gradient-to-t from-amber-600 via-yellow-500 to-yellow-300 shadow-[0_0_15px_rgba(217,119,6,0.35)]"
            : "bg-gradient-to-r from-amber-600 via-yellow-500 to-yellow-300 shadow-[0_0_15px_rgba(217,119,6,0.35)]";
    }, [isCrit, isLow, side, isVertical]);

    return (
        <div
            className={cls(
                isVertical ? "relative h-80 w-12 sm:w-12" : "relative w-80",
                tookRecentHit && "animate-pulse"
            )}
            aria-label={Health ${Math.round(pct)}%}
        >
            {/* Label Header */}
            <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-sm font-bold tracking-wider text-amber-200/90">
                    {label}
                </span>
                <span className="text-xs font-ancient text-amber-300/70">
                    {romanPercent(pct)}
                </span>
            </div>

            {/* Main Health Container */}
            <div className={cls(
                "relative rounded-lg border-2 border-amber-900/50 bg-gradient-to-b from-stone-900/80 to-black/60 backdrop-blur-sm shadow-2xl overflow-hidden",
                isVertical ? "w-full h-full" : "h-8"
            )}>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="h-full w-full bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(139,105,20,0.1)_20px,rgba(139,105,20,0.1)_21px)]" />
                </div>

                {/* Shield Segments Background */}
                <div className={cls("absolute inset-0 px-1 py-1", isVertical ? "flex flex-col gap-[2px]" : "flex gap-[2px]") }>
                    {segments.map((s, i) => (
                        <div
                            key={i}
                            className={cls(
                                "relative flex-1 rounded-sm transition-all duration-300",
                                s.fill
                                    ? "bg-gradient-to-b from-amber-400/40 to-amber-600/40 border border-amber-500/30"
                                    : "bg-stone-800/30 border border-stone-700/20"
                            )}
                        >
                            {/* Rivet decorations */}
                            {s.fill && (
                                <>
                                    <div className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-300/60" style={{top:2}} />
                                    <div className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-300/60" style={{bottom:2}} />
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Glowing Fill Bar */}
                <div
                    className={cls(
                        "absolute transition-all duration-500 ease-out",
                        isVertical ? "left-0 bottom-0 right-0" : "inset-y-0 left-0",
                        fillGradientClass
                    )}
                    style={ isVertical ? { height: ${pct}% } : { width: ${pct}% } }
                />

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />

                {/* Blood drip effect when critical */}
                {isCrit && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-red-900/60 to-transparent animate-pulse" />
                )}

                {/* Numeric percentage */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cls(
                        "text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10",
                        isCrit ? "text-red-200" : isLow ? "text-amber-100" : "text-white/90"
                    )}>
                        {Math.round(pct)}%
                    </span>
                </div>
            </div>

            {/* Bottom / Side decoration */}
            {!isVertical && (
                <div className="mt-1 h-1 rounded-full bg-gradient-to-r from-transparent via-amber-900/30 to-transparent" />
            )}
        </div>
    );
}
