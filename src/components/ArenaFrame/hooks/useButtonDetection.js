import { useCallback } from 'react';
import { rgb2hsv } from '../utils/index.js';

export function useButtonDetection(portalConfig, canvasRef) {
    const getRenderRect = useCallback((stageEl, videoEl) => {
        const sw = stageEl.clientWidth;
        const sh = stageEl.clientHeight;
        const vw = videoEl.videoWidth;
        const vh = videoEl.videoHeight;

        if (!vw || !vh) return null;

        const s = Math.max(sw / vw, sh / vh);
        const rw = vw * s;
        const rh = vh * s;
        const ox = (sw - rw) / 2;
        const oy = (sh - rh) / 2;

        return { s, rw, rh, ox, oy, sw, sh, vw, vh };
    }, []);

    const mapToScreen = useCallback((rect, x, y) => {
        return { x: rect.ox + x * rect.s, y: rect.oy + y * rect.s };
    }, []);

    const findButtonBox = useCallback((imgData, config) => {
        const { HMIN, HMAX, SMIN, VMIN, STEP, MIN_AREA, ASPECT_TOL } = config;
        const W = imgData.width;
        const H = imgData.height;
        const data = imgData.data;
        const gw = Math.ceil(W / STEP);
        const gh = Math.ceil(H / STEP);
        const mask = new Uint8Array(gw * gh);
        const seen = new Uint8Array(gw * gh);

        for (let gy = 0, y = 0; gy < gh; gy++, y += STEP) {
            for (let gx = 0, x = 0; gx < gw; gx++, x += STEP) {
                const i = ((y * W) + x) * 4;
                const { h, s, v } = rgb2hsv(data[i], data[i + 1], data[i + 2]);
                mask[gy * gw + gx] = (h >= HMIN && h <= HMAX && s >= SMIN && v >= VMIN) ? 1 : 0;
            }
        }

        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        let best = null;

        for (let gy = 0; gy < gh; gy++) {
            for (let gx = 0; gx < gw; gx++) {
                const sidx = gy * gw + gx;
                if (!mask[sidx] || seen[sidx]) continue;

                let stack = [sidx];
                seen[sidx] = 1;
                let minX = gx, maxX = gx, minY = gy, maxY = gy, area = 0;

                while (stack.length) {
                    const cur = stack.pop();
                    area++;
                    const cx = cur % gw;
                    const cy = (cur - cx) / gw;

                    if (cx < minX) minX = cx;
                    if (cx > maxX) maxX = cx;
                    if (cy < minY) minY = cy;
                    if (cy > maxY) maxY = cy;

                    for (const [dx, dy] of dirs) {
                        const nx = cx + dx;
                        const ny = cy + dy;
                        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
                        const ni = ny * gw + nx;
                        if (mask[ni] && !seen[ni]) {
                            seen[ni] = 1;
                            stack.push(ni);
                        }
                    }
                }

                const x = minX * STEP;
                const y = minY * STEP;
                const w = (maxX - minX + 1) * STEP;
                const h = (maxY - minY + 1) * STEP;
                const aspect = w / h;
                const looksCircle = aspect > (1 - ASPECT_TOL) && aspect < (1 + ASPECT_TOL);
                const areaPix = area * (STEP * STEP);

                if (areaPix >= MIN_AREA && looksCircle) {
                    if (!best || areaPix > best.areaPix) {
                        best = { x, y, w, h, areaPix };
                    }
                }
            }
        }
        return best;
    }, []);

    const getLastFrameBox = useCallback(async (videoEl) => {
        return new Promise((resolve) => {
            try {
                videoEl.currentTime = Math.max(0, (videoEl.duration || 0) - 0.03);
            } catch (e) { }

            requestAnimationFrame(() => {
                const vw = videoEl.videoWidth;
                const vh = videoEl.videoHeight;
                if (!vw || !vh) return resolve(null);

                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = vw;
                canvas.height = vh;

                try {
                    ctx.drawImage(videoEl, 0, 0, vw, vh);
                    if (portalConfig.detectButton) {
                        const imgData = ctx.getImageData(0, 0, vw, vh);
                        const box = findButtonBox(imgData, portalConfig.hsvDetect);
                        resolve(box);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });
    }, [portalConfig, findButtonBox, canvasRef]);

    const calculateCTAPosition = useCallback(async (videoEl, stageEl, setCtaPosition) => {
        const rect = getRenderRect(stageEl, videoEl);
        if (!rect) return;

        let box = null;
        if (portalConfig.detectButton) {
            box = await getLastFrameBox(videoEl);
        }

        if (box) {
            const icx = box.x + box.w / 2;
            const icy = box.y + box.h / 2;
            const pt = mapToScreen(rect, icx, icy);
            const size = Math.max(180, Math.max(box.w, box.h) * rect.s * 1.1);
            setCtaPosition({ x: `${pt.x}px`, y: `${pt.y}px`, size });
            console.log('🎯 CTA position (detected):', { x: pt.x, y: pt.y, size });
        } else if (portalConfig.knownButton) {
            const { cx_norm, cy_norm, r_norm } = portalConfig.knownButton;
            const icx = cx_norm * rect.vw;
            const icy = cy_norm * rect.vh;
            const pt = mapToScreen(rect, icx, icy);
            const diameterPx = (r_norm * 2) * rect.rw;
            const size = Math.max(180, diameterPx * 1.1);
            setCtaPosition({ x: `${pt.x}px`, y: `${pt.y}px`, size });
            console.log('🎯 CTA position (known):', { x: pt.x, y: pt.y, size });
        } else {
            setCtaPosition({ x: '50%', y: '90%', size: 180 });
            console.log('🎯 CTA position (fallback):', { x: '50%', y: '90%', size: 180 });
        }
    }, [getRenderRect, getLastFrameBox, mapToScreen, portalConfig]);

    return {
        calculateCTAPosition
    };
}
