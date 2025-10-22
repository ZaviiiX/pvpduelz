// PriceTicker.jsx - RESPONSIVE VERSION
import React, { useState, useEffect } from 'react';
import { cls } from './utils/index.js';

export function PriceTicker({ token, price, change, marketCap, volume24h }) {
    const isPositive = change >= 0;
    const [isUpdating, setIsUpdating] = useState(false);

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
        <div className="price-ticker-wrapper w-full sm:w-auto sm:min-w-[180px] md:min-w-[220px]">
            <div className={cls(
                "price-ticker transition-all duration-300",
                isUpdating && "scale-105"
            )} style={{ padding: '8px 12px' }}>
                <div className="mb-2">
                    <div className="text-[8px] sm:text-[9px] text-stone-500 uppercase tracking-widest mb-1 opacity-80">
                        Capitalizatio
                    </div>
                    <div className={cls(
                        "flex items-baseline gap-0.5 sm:gap-1 transition-all duration-300",
                        isUpdating && "animate-pulse"
                    )}>
                        <span className="text-[8px] sm:text-[10px] gold-text opacity-70">$</span>
                        <span className="text-lg sm:text-xl md:text-2xl gold-text font-bold tracking-tight leading-none">
                            {mc.value}
                        </span>
                        <span className="text-sm sm:text-base gold-text opacity-80 font-semibold">
                            {mc.unit}
                        </span>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-amber-900/40 to-transparent" />
            </div>
        </div>
    );
}