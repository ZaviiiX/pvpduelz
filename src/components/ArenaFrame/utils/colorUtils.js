export const rgb2hsv = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const M = Math.max(r, g, b);
    const m = Math.min(r, g, b);
    const d = M - m;
    const v = M;
    const s = M ? d / M : 0;

    let h = 0;
    if (d) {
        switch (M) {
            case r: h = (g - b) / d % 6; break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4;
        }
        h *= 60;
        if (h < 0) h += 360;
    }

    return { h, s, v };
};

export const getFlashColor = (color) => {
    const colors = {
        red: 'rgba(255, 0, 0, 0.3)',
        green: 'rgba(0, 255, 0, 0.2)',
        yellow: 'rgba(255, 255, 0, 0.2)'
    };
    return colors[color] || colors.red;
};
