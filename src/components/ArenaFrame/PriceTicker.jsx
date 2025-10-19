import React from 'react';
import { cls } from './utils/index.js';

export function PriceTicker({ token, price, change }) {
    const isPositive = change >= 0;

    return (
        <div className="price-ticker">
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-semibold">{token}</span>
                <span className="text-sm text-white font-bold">${price.toFixed(6)}</span>
                <span className={cls(
                    "text-xs font-bold",
                    isPositive ? "text-green-400" : "text-red-400"
                )}>
          {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </span>
            </div>
        </div>
    );
}
