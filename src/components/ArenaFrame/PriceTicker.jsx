// PriceTicker.jsx - FIXED WITH NULL/ZERO PROTECTION
import React, { useState, useEffect, useRef } from 'react';
import { cls } from './utils/index.js';

export function PriceTicker({ token, price, change, marketCap, volume24h }) {
    const isPositive = change >= 0;
    const [isUpdating, setIsUpdating] = useState(false);

    // 🆕 CACHE LAST VALID VALUES
    const lastValidRef = useRef({
        price: price || 0,
        marketCap: marketCap || 0,
        change: change || 0
    });

    // 🆕 USE CACHED VALUES IF CURRENT ARE INVALID
    const validPrice = (price && price > 0) ? price : lastValidRef.current.price;
    const validMC = (marketCap && marketCap > 0) ? marketCap : lastValidRef.current.marketCap;
    const validChange = (change !== null && change !== undefined) ? change : lastValidRef.current.change;

    // 🆕 UPDATE CACHE WHEN WE GET VALID DATA
    useEffect(() => {
        if (price && price > 0) {
            lastValidRef.current.price = price;
        }
        if (marketCap && marketCap > 0) {
            lastValidRef.current.marketCap = marketCap;
        }
        if (change !== null && change !== undefined) {
            lastValidRef.current.change = change;
        }
    }, [price, marketCap, change]);

    // ✅ Trigger pulse on MC change (only if valid)
    useEffect(() => {
        if (marketCap && marketCap > 0) {
            setIsUpdating(true);
            const timer = setTimeout(() => setIsUpdating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [marketCap]);

    const formatMC = (mc) => {
        if (!mc || mc === 0) return { value: 'N/A', unit: '', isError: true };
        if (mc >= 1e9) return { value: (mc / 1e9).toFixed(2), unit: 'B', isError: false };
        if (mc >= 1e6) return { value: (mc / 1e6).toFixed(2), unit: 'M', isError: false };
        if (mc >= 1e3) return { value: (mc / 1e3).toFixed(2), unit: 'K', isError: false };
        return { value: mc.toFixed(0), unit: '', isError: false };
    };

    const mc = formatMC(validMC);

    // 🆕 DETECT IF DATA IS STALE/INVALID
    const isDataStale = !marketCap || marketCap === 0;

    return (
        <div className="price-ticker-wrapper" style={{ minWidth: '220px' }}>
            <div className={cls(
                "price-ticker transition-all duration-300",
                isUpdating && !isDataStale && "scale-105",
                isDataStale && "opacity-50"  // 🆕 Show when data is stale
            )} style={{ padding: '12px 16px' }}>
                {/* 🆕 STALE DATA WARNING */}
                {isDataStale && (
                    <div className="absolute top-1 right-1 z-10">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
                             title="Using cached data" />
                    </div>
                )}

                <div className="mb-3">
                    <div className="text-[9px] text-stone-500 uppercase tracking-widest mb-1.5 opacity-80">
                        {isDataStale ? 'Capitalizatio (Cached)' : 'Capitalizatio'}
                    </div>
                    <div className={cls(
                        "flex items-baseline gap-1 transition-all duration-300",
                        isUpdating && !isDataStale && "animate-pulse"
                    )}>
                        {mc.isError ? (
                            <span className="text-base text-red-400 font-bold">
                                API Error
                            </span>
                        ) : (
                            <>
                                <span className="text-[10px] gold-text opacity-70">$</span>
                                <span className="text-2xl gold-text font-bold tracking-tight leading-none">
                                    {mc.value}
                                </span>
                                <span className="text-base gold-text opacity-80 font-semibold">
                                    {mc.unit}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-amber-900/40 to-transparent mb-2" />
            </div>
        </div>
    );
}