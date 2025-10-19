// helpers.js - FULLY FIXED VERSION
// ✅ Conditional logging based on environment
const isDev = import.meta.env.DEV;
export const log = isDev ? console.log.bind(console) : () => {};
export const warn = isDev ? console.warn.bind(console) : () => {};
export const error = console.error.bind(console); // Always log errors

export const cls = (...classes) => classes.filter(Boolean).join(" ");

export const getHealthColor = (healthPercent) => {
    if (healthPercent > 60) return 'health-bar-high';
    if (healthPercent > 30) return 'health-bar-medium';
    return 'health-bar-low';
};

export const isRecentDamage = (lastDamageTime, threshold = 300) => {
    if (!lastDamageTime) return false; // ✅ FIXED: Handle undefined
    return Date.now() - lastDamageTime < threshold;
};

export const getTokenStatus = (currentScenario, tokenName) => {
    if (!currentScenario || !tokenName) return { isActive: false }; // ✅ FIXED: Handle undefined
    const scenario = currentScenario.toLowerCase();
    const isRelevantToken = scenario.includes(tokenName.toLowerCase());
    return { isActive: isRelevantToken };
};

// ✅ FIXED: Handle undefined scenario
export const shouldShakeScreen = (scenario) => {
    if (!scenario) return false; // ✅ Guard against undefined/null
    return scenario.includes('Pump') || scenario.includes('Combo');
};
