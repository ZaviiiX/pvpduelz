export const cls = (...classes) => classes.filter(Boolean).join(" ");

export const getHealthColor = (healthPercent) => {
    if (healthPercent > 60) return 'health-bar-high';
    if (healthPercent > 30) return 'health-bar-medium';
    return 'health-bar-low';
};

export const isRecentDamage = (lastDamageTime, threshold = 300) => {
    return Date.now() - lastDamageTime < threshold;
};

export const getTokenStatus = (currentScenario, tokenName) => {
    const scenario = currentScenario.toLowerCase();
    const isRelevantToken = scenario.includes(tokenName.toLowerCase());
    return { isActive: isRelevantToken };
};

export const shouldShakeScreen = (scenario) => {
    return scenario.includes('Pump') || scenario.includes('Combo');
};
