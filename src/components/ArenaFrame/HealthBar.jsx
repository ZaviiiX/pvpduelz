// HealthBar.jsx — VERTICAL ROMAN COLUMN VERSION 🏛️
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
                                      lastDamage = 0
                                  }) {
    const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    const isLow = pct < 30;
    const isCrit = pct < 15;
    const tookRecentHit = Date.now() - lastDamage < 450;

    // 16 vertical segments (stacks bottom to top)
    const segments = useMemo(() => {
        const count = 16;
        const per = 100 / count;
        return new Array(count).fill(0).map((_, i) => ({
            fill: pct >= (count - i) * per, // Fill from bottom up
            isTop: i === 0,
            isBottom: i === count - 1
        }));
    }, [pct]);

    return (
        <div
            className={cls(
                "relative flex flex-col items-center gap-2",
                tookRecentHit && "animate-pulse"
            )}
            aria-label={`Health ${Math.round(pct)}%`}
        >
            {/* Token Label at Top */}
            <div className="relative">
                <div className="text-sm sm:text-base font-ancient tracking-wider text-amber-200/90 text-center mb-1">
                    {label}
                </div>
                <div className="text-xs text-amber-300/70 text-center">
                    {romanPercent(pct)}
                </div>
            </div>

            {/* Main Vertical Column */}
            <div className="relative w-12 sm:w-14 md:w-16 h-64 sm:h-72 md:h-80 rounded-lg border-4 border-amber-900/60 bg-gradient-to-b from-stone-900/90 to-black/70 backdrop-blur-sm shadow-2xl overflow-hidden">

                {/* Column Capital (Top decoration) */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[120%] h-3 bg-gradient-to-b from-amber-600 to-amber-800 border-2 border-amber-700 z-10" />

                {/* Column Base (Bottom decoration) */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[120%] h-3 bg-gradient-to-t from-amber-600 to-amber-800 border-2 border-amber-700 z-10" />

                {/* Background stone texture */}
                <div className="absolute inset-0 opacity-20">
                    <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_12px,rgba(139,105,20,0.15)_12px,rgba(139,105,20,0.15)_13px)]" />
                </div>

                {/* Shield Segments - Stack from bottom */}
                <div className="absolute inset-0 flex flex-col-reverse gap-[2px] p-1">
                    {segments.map((s, i) => (
                        <div
                            key={i}
                            className={cls(
                                "relative flex-1 rounded-sm transition-all duration-300",
                                s.fill
                                    ? "bg-gradient-to-r from-amber-500/50 via-amber-400/60 to-amber-500/50 border-x-2 border-amber-500/40"
                                    : "bg-stone-800/40 border-x border-stone-700/30"
                            )}
                        >
                            {/* Rivet decorations on filled segments */}
                            {s.fill && (
                                <>
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-amber-300/70" />
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-amber-300/70" />
                                </>
                            )}

                            {/* Top segment glow */}
                            {s.isTop && s.fill && (
                                <div className="absolute -top-1 left-0 right-0 h-2 bg-gradient-to-t from-amber-400/60 to-transparent blur-sm" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Glowing Fill from bottom */}
                <div
                    className={cls(
                        "absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out pointer-events-none",
                        isCrit
                            ? "bg-gradient-to-t from-red-600 via-red-500/80 to-transparent shadow-[0_-10px_30px_rgba(220,38,38,0.7)]"
                            : isLow
                                ? "bg-gradient-to-t from-orange-500 via-amber-500/80 to-transparent shadow-[0_-10px_25px_rgba(245,158,11,0.6)]"
                                : "bg-gradient-to-t from-emerald-500 via-green-500/80 to-transparent shadow-[0_-10px_25px_rgba(34,197,94,0.5)]"
                    )}
                    style={{ height: `${pct}%` }}
                />

                {/* Inner shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                {/* Cracks when critical */}
                {isCrit && (
                    <>
                        <div className="absolute top-1/4 left-0 w-full h-[2px] bg-red-900/60 transform -rotate-12" />
                        <div className="absolute top-1/2 right-0 w-3/4 h-[2px] bg-red-900/60 transform rotate-6" />
                        <div className="absolute bottom-1/3 left-0 w-2/3 h-[2px] bg-red-900/60 transform -rotate-3" />
                    </>
                )}

                {/* Blood drip effect when critical */}
                {isCrit && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-red-900/60 to-red-900/80 animate-pulse" />
                )}

                {/* Percentage display */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={cls(
                        "text-xs sm:text-sm font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] z-20 px-2 py-1 rounded",
                        "bg-black/40 backdrop-blur-sm border border-amber-900/30",
                        isCrit ? "text-red-200" : isLow ? "text-amber-100" : "text-white/90"
                    )}>
                        {Math.round(pct)}%
                    </div>
                </div>

                {/* Low health pulse animation border */}
                {isLow && (
                    <div className={cls(
                        "absolute inset-0 rounded-lg border-2 animate-pulse",
                        isCrit ? "border-red-500/60" : "border-orange-500/40"
                    )} />
                )}
            </div>

            {/* Bottom decoration line */}
            <div className="w-16 h-[2px] rounded-full bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />
        </div>
    );
}