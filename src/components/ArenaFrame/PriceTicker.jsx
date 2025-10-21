// PriceTicker.jsx
import React, { useState, useEffect } from 'react';
import { cls } from './utils/index.js';

export function PriceTicker({ token, price, change, marketCap, volume24h }) {
    const isPositive = change >= 0;
    const [isUpdating, setIsUpdating] = useState(false);

    // ✅ Trigger pulse on MC change
    useEffect(() => {
        setIsUpdating(true);
        const timer = setTimeout(() => setIsUpdating(false), 300);
        return () => clearTimeout(timer);
    }, [marketCap]);

    const formatMC = (mc) => {
        if (!mc || mc === 0) return { value: 'N/A', unit: '' };
        if (mc >= 1e9) return { value: (mc / 1e9).toFixed(2), unit: 'B' };
        if (mc >= 1e6) return { value: (mc / 1e6).toFixed(2), unit: 'M' };
        if (mc >= 1e3) return { value: (mc / 1e3).toFixed(2), unit: 'K' };
        return { value: mc.toFixed(0), unit: '' };
    };

    const mc = formatMC(marketCap);

    return (
        <div className="price-ticker-wrapper" style={{ minWidth: '220px' }}>


            <div className={cls(
                "price-ticker transition-all duration-300",
                isUpdating && "scale-105"  // ✅ Pulse na update!
            )} style={{ padding: '12px 16px' }}>
                <div className="mb-3">
                    <div className="text-[9px] text-stone-500 uppercase tracking-widest mb-1.5 opacity-80">
                        Capitalizatio
                    </div>
                    <div className={cls(
                        "flex items-baseline gap-1 transition-all duration-300",
                        isUpdating && "animate-pulse"  // ✅ Extra pulse!
                    )}>
                        <span className="text-[10px] gold-text opacity-70">$</span>
                        <span className="text-2xl gold-text font-bold tracking-tight leading-none">
                            {mc.value}
                        </span>
                        <span className="text-base gold-text opacity-80 font-semibold">
                            {mc.unit}
                        </span>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-amber-900/40 to-transparent mb-2" />




            </div>
        </div>
    );
}
