// HealthBar.jsx — ROMAN GLADIUS EDITION
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

    // 12 segmenta kao štitovi
    const segments = useMemo(() => {
        const count = 12;
        const per = 100 / count;
        return new Array(count).fill(0).map((_, i) => ({
            fill: pct >= (i + 1) * per
        }));
    }, [pct]);

    return (
        <div
            className={cls(
                "hb-roman",
                side === "left" ? "hb-left" : "hb-right",
                isLow && "hb-low",
                isCrit && "hb-crit",
                tookRecentHit && "hb-dmg"
            )}
            aria-label={`Health ${Math.round(pct)}%`}
        >
            {/* Zlatna kapica s lovorom i etiketom */}
            <div className="hb-cap">
                <div className="hb-cap-in">
                    <span className="hb-cap-badge" />
                    <span className="hb-label">{label}</span>
                </div>
            </div>

            {/* Mramorni postament */}
            <div className="hb-plinth" />

            {/* Glavni okvir od bronze */}
            <div className="hb-track">
                {/* Rimski brojni indikator */}
                <div className="hb-roman-numeral">{romanPercent(pct)}</div>

                {/* Štit segmenti */}
                <div className="hb-shields">
                    {segments.map((s, i) => (
                        <div
                            key={i}
                            className={cls("hb-shield", s.fill && "filled")}
                            style={{ "--i": i }}
                        >
                            <span className="hb-rivet tl" />
                            <span className="hb-rivet tr" />
                            <span className="hb-rivet bl" />
                            <span className="hb-rivet br" />
                        </div>
                    ))}
                </div>

                {/* Unutarnja traka koja se skraćuje */}
                <div className="hb-fill" style={{ width: `${pct}%` }} />

                {/* Krv kapljice kada je kritično */}
                {isCrit && <div className="hb-blood" />}
            </div>
        </div>
    );
}
