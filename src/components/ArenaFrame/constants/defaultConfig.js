export const DEFAULT_CONFIG = {
    aspect: "16/9",
    fullHeight: true,
    devMode: false,
    syncMode: true,
    serverUrl: "http://localhost:3001",

    tokenIcons: {
        tokenA: null,
        tokenB: null
    },

    videos: {
        idle: "/videos/solana-vs-bnb.mp4",
        tokenAPump: "/videos/sol-winning.mp4",
        tokenBPump: "/videos/bnb-winning.mp4",
        tokenACombo: "/videos/sol-winning.mp4",
        tokenBCombo: "/videos/bnb-winning.mp4",
        tokenAVictory: "/videos/sol-winning.mp4",
        tokenBVictory: "/videos/bnb-winning.mp4",
        tokenABack: "/videos/sol-winning-backto-stance.mp4",
        tokenBBack: "/videos/bnb-winning-backto-stance.mp4",
    },

    portalVideos: {
        intro: "/video/intro.mp4",
        portalEntrance: "/video/portal-entrance.mp4",
        endframe: "/images/endframe.png",
        endframeHover: "/images/endframe-hover.png"
    },

    portalConfig: {
        enabled: true,
        detectButton: true,
        knownButton: {
            cx_norm: 0.50,
            cy_norm: 0.88,
            r_norm: 0.12
        },
        hsvDetect: {
            HMIN: 170,
            HMAX: 205,
            SMIN: 0.25,
            VMIN: 0.55,
            STEP: 2,
            MIN_AREA: 1200,
            ASPECT_TOL: 0.40
        }
    }
};

export const INITIAL_TOKEN_CONFIG = {
    tokenA: { name: "Token A", symbol: "TKA", isMock: false, icon: null },
    tokenB: { name: "Token B", symbol: "TKB", isMock: false, icon: null },
    roundsToWin: 3
};

export const INITIAL_HEALTH = { tokenA: 100, tokenB: 100 };
export const INITIAL_DAMAGE = { tokenA: 0, tokenB: 0 };
export const INITIAL_COMBO = { tokenA: 0, tokenB: 0 };
export const INITIAL_SCORE = { tokenA: 0, tokenB: 0 };

export const INITIAL_MARKET_DATA = {
    tokenA: { price: 0.05, change24h: 0, marketCap: 5000000 },
    tokenB: { price: 0.08, change24h: 0, marketCap: 8000000 },
};
