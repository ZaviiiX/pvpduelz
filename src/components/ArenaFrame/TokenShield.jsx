import React from "react";
// import { cls } from "./utils/index.js"; // nije korišteno

export function TokenShield({
                                label = "SOL",
                                tone = "#14F195",
                                isActive = false,
                                marketChange = 0,
                                icon = null,
                            }) {
    const isMoving = Math.abs(marketChange) > 0.5; // trenutno ne koristiš, ali ok

    return (
        <div className="relative">
            {isActive && (
                <div
                    className="absolute inset-0 blur-3xl opacity-60 animate-pulse"
                    style={{
                        background: `radial-gradient(circle, ${tone} 0%, transparent 70%)`,
                        transform: "scale(1.5)",
                    }}
                />
            )}

            <div className="relative token-shield-inner flex items-center justify-center">
                {icon ? (
                    <img src={icon} alt={label} className="w-40 h-40 object-contain" />
                ) : label && label.toUpperCase().includes("SOL") ? (
                    <img src="/images/solana_logo.png" alt="SOL" className="w-16 h-16 object-contain" />
                ) : label && label.toUpperCase().includes("BNB") ? (
                    <img src="/images/bnb_logo.png" alt="BNB" className="w-16 h-16 object-contain" />
                ) : (
                    <span className="text-white text-xl font-bold">{label?.slice(0, 3)}</span>
                )}
            </div>
        </div>
    );
}
