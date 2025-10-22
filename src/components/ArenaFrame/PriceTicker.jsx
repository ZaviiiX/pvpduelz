// PriceTicker.jsx - FIXED WITH NULL/ZERO PROTECTION
import React, { useState, useEffect, useRef } from "react";
import { cls } from "./utils/index.js";

export function PriceTicker({ token, price, change, marketCap, volume24h, address }) {
    const isPositive = change >= 0;
    const [isUpdating, setIsUpdating] = useState(false);
    const [copied, setCopied] = useState(false);

    // 🆕 CACHE LAST VALID VALUES
    const lastValidRef = useRef({
        price: price || 0,
        marketCap: marketCap || 0,
        change: change || 0,
    });

    // 🆕 USE CACHED VALUES IF CURRENT ARE INVALID
    const validPrice = price && price > 0 ? price : lastValidRef.current.price;
    const validMC =
        marketCap && marketCap > 0 ? marketCap : lastValidRef.current.marketCap;
    const validChange =
        change !== null && change !== undefined
            ? change
            : lastValidRef.current.change;

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
        if (!mc || mc === 0) return { value: "N/A", unit: "", isError: true };
        if (mc >= 1e9)
            return { value: (mc / 1e9).toFixed(2), unit: "B", isError: false };
        if (mc >= 1e6)
            return { value: (mc / 1e6).toFixed(2), unit: "M", isError: false };
        if (mc >= 1e3)
            return { value: (mc / 1e3).toFixed(2), unit: "K", isError: false };
        return { value: mc.toFixed(0), unit: "", isError: false };
    };

    const mc = formatMC(validMC);

    // 🆕 DETECT IF DATA IS STALE/INVALID
    const isDataStale = !marketCap || marketCap === 0;

    return (
        <div className="price-ticker-wrapper" style={{ minWidth: "220px" }}>
            <div
                className={cls(
                    "price-ticker transition-all duration-300",
                    isUpdating && !isDataStale && "scale-105",
                    isDataStale && "opacity-50" // 🆕 Show when data is stale
                )}
                style={{ padding: "12px 16px" }}
            >
                {/* 🆕 STALE DATA WARNING */}
                {isDataStale && (
                    <div className="absolute top-1 right-1 z-10">
                        <div
                            className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
                            title="Using cached data"
                        />
                    </div>
                )}

                <div className="mb-3 mx-auto text-center">
                    <div className="text-[12px] text-bold text-stone-500 uppercase tracking-widest mb-2 opacity-80">
                        {isDataStale ? "Market Cap" : "Market Cap"}
                    </div>
                    <div
                        className={cls(
                            "flex items-baseline justify-center gap-1 transition-all duration-300",
                            isUpdating && !isDataStale && "animate-pulse"
                        )}
                    >
                        {mc.isError ? (
                            <span className="text-base text-red-400 font-bold">
                API Error
              </span>
                        ) : (
                            <>
                <span className="text-2xl gold-text font-bold tracking-tight leading-none">
                  {mc.value}
                </span>
                                <span className="text-base gold-text opacity-80 font-semibold">
                  {mc.unit}
                </span>
                            </>
                        )}
                    </div>

                    {/* Token address (optional) */}
                    <div className="mt-1 text-xs text-center break-words max-w-[220px] mx-auto flex items-center justify-center gap-2">
                        <span className="text-[10px] text-amber-300 mr-1 font-semibold">CA:</span>
                        <span
                            title={address || 'N/A'}
                            className={cls(
                                'select-all',
                                !address ? 'text-stone-400 italic' : 'text-amber-100 font-medium drop-shadow-[0_0_6px_rgba(250,204,21,0.18)]'
                            )}
                        >
              {address ? (address.length > 28 ? `${address.slice(0, 12)}...${address.slice(-8)}` : address) : 'N/A'}
            </span>

                        {/* Copy button */}
                        {address && (
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(address);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 1400);
                                    } catch (e) {
                                        console.error('Copy failed', e);
                                    }
                                }}
                                className="ml-1 text-[10px] px-2 py-1 rounded bg-amber-700/30 hover:bg-amber-700/50 text-amber-50"
                                title="Copy contract address"
                            >
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-amber-900/40 to-transparent mb-2" />
            </div>
        </div>
    );
}
