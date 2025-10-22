import { useState, useRef, useCallback, useEffect } from 'react';
import { useButtonDetection } from './useButtonDetection.js';

export function usePortal(portalConfig, portalVideos) {
    const [portalPhase, setPortalPhase] = useState('intro');
    const [showCTA, setShowCTA] = useState(false);
    const [ctaPosition, setCtaPosition] = useState({ x: '50%', y: '90%', size: 180 });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);

    const portalIntroRef = useRef(null);
    const portalEntranceRef = useRef(null);
    const canvasRef = useRef(null);
    const ctaRef = useRef(null);

    const { calculateCTAPosition } = useButtonDetection(portalConfig, canvasRef);

    // Auto-play intro video
    useEffect(() => {
        console.log('🎬 Portal config:', portalConfig);

        if (!portalConfig.enabled) {
            console.log('❌ Portal disabled, skipping to arena');
            setHasJoined(true);
            return;
        }

        const introVid = portalIntroRef.current;
        if (!introVid) {
            console.log('❌ Intro video ref not found!');
            return;
        }

        console.log('📹 Video src:', portalVideos.intro);
        setPortalPhase('intro');

        introVid.muted = true;
        introVid.playsInline = true;
        introVid.load();

        introVid.addEventListener('loadeddata', () => {
            console.log('✅ Video loaded successfully');
            setPortalPhase('intro');
        });

        introVid.addEventListener('error', (e) => {
            console.error('❌ Video load error:', e);
        });

        const playPromise = introVid.play();
        if (playPromise) {
            playPromise
                .then(() => {
                    console.log('✅ Video playing');
                    setPortalPhase('intro');
                })
                .catch((error) => {
                    console.log('❌ Autoplay blocked:', error);
                    setPortalPhase('endframe');
                    setShowCTA(true);
                });
        }
    }, [portalConfig.enabled, portalVideos.intro]);

    // Preload portal entrance video
    useEffect(() => {
        if (portalConfig.enabled && portalEntranceRef.current) {
            portalEntranceRef.current.load();
        }
    }, [portalConfig.enabled]);

    const handleIntroEnded = useCallback(async () => {
        const introVid = portalIntroRef.current;
        const stage = introVid?.parentElement;

        console.log('🎬 Intro video ended');

        if (introVid) {
            try { introVid.pause(); } catch (e) { }
        }

        setPortalPhase('endframe');
        await new Promise(resolve => setTimeout(resolve, 50));

        if (introVid && stage) {
            await calculateCTAPosition(introVid, stage, setCtaPosition);
        }

        setShowCTA(true);
        console.log('✅ CTA shown');
    }, [calculateCTAPosition]);

    const handleCTAClick = useCallback(async (e) => {
        e.preventDefault();
        if (isTransitioning) return;

        console.log('🎯 CTA clicked, starting transition...');

        setIsHovering(false);
        setIsTransitioning(true);
        setPortalPhase('transition');
        setShowCTA(false);

        const portalVid = portalEntranceRef.current;
        if (!portalVid) return;

        if (portalVid.readyState < 3) {
            console.log('⏳ Waiting for portal video to load...');
            await new Promise(resolve => {
                portalVid.addEventListener('canplay', resolve, { once: true });
            });
        }

        setTimeout(() => {
            portalVid.currentTime = 0;
            portalVid.play().catch(e => console.error('Portal video play error:', e));
            console.log('▶️ Portal video playing');
        }, 600);
    }, [isTransitioning]);

    const handlePortalEnded = useCallback(() => {
        console.log('🌀 Portal entrance complete, entering arena...');
        setPortalPhase('complete');
        setTimeout(() => {
            setHasJoined(true);
        }, 500);
    }, []);

    return {
        portalPhase,
        showCTA,
        ctaPosition,
        isHovering,
        setIsHovering,
        hasJoined,
        portalIntroRef,
        portalEntranceRef,
        canvasRef,
        ctaRef,
        handleIntroEnded,
        handleCTAClick,
        handlePortalEnded,
    };
}
