// useVideoPlayer.js - FIXED VERSION with Queue System
import { useState, useRef, useEffect, useCallback } from 'react';

export function useVideoPlayer(hasJoined, videos) {
    const video1Ref = useRef(null);
    const video2Ref = useRef(null);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [currentScenario, setCurrentScenario] = useState('idle');

    // Refs for state tracking
    const lastScenarioRef = useRef('idle');
    const isLoadingRef = useRef(false);
    const loadingScenarioRef = useRef(null);
    const currentScenarioRef = useRef('idle');
    const isPlayingSequenceRef = useRef(false);

    // ✅ NEW: Queue system for scenarios during sequences
    const scenarioQueueRef = useRef([]);

    // ✅ IMPROVED: setCurrentScenario with queue support
    const setCurrentScenarioSafe = useCallback((newScenario, source = 'unknown') => {
        console.log('🔴 setCurrentScenario:', {
            from: currentScenarioRef.current,
            to: newScenario,
            source,
            isPlayingSequence: isPlayingSequenceRef.current,
            queueLength: scenarioQueueRef.current.length
        });

        // Block WebSocket updates during video sequences
        if (isPlayingSequenceRef.current && source === 'websocket') {
            console.log('📋 Queued scenario from WebSocket:', newScenario);
            // Only queue if not already in queue
            if (!scenarioQueueRef.current.includes(newScenario)) {
                scenarioQueueRef.current.push(newScenario);
            }
            return;
        }

        setCurrentScenario(newScenario);
    }, []);

    // ═══════════════════════════════════════════════════════════════
    // 🎬 INITIAL VIDEO SETUP
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!hasJoined) return;

        console.log('🎮 Arena joined, setting up initial video');

        const timer = setTimeout(() => {
            if (video1Ref.current && videos.idle) {
                video1Ref.current.src = videos.idle;
                video1Ref.current.loop = true;
                video1Ref.current.preload = "auto";
                video1Ref.current.load();

                video1Ref.current.addEventListener('canplaythrough', () => {
                    video1Ref.current.style.opacity = '1';
                    video1Ref.current.style.zIndex = '2';
                    video1Ref.current.play()
                        .then(() => console.log('✅ Arena initial video started'))
                        .catch(e => console.error("❌ Initial play error:", e));
                }, { once: true });
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [hasJoined, videos.idle]);

    // ═══════════════════════════════════════════════════════════════
    // 🎬 VIDEO SWITCHING LOGIC
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!hasJoined) return;

        const previousScenario = currentScenarioRef.current;
        currentScenarioRef.current = currentScenario;

        console.log('🔄 Scenario change:', {
            from: previousScenario,
            to: currentScenario
        });

        const videoSrc = videos[currentScenario];
        if (!videoSrc) {
            console.warn('❌ No video source for scenario:', currentScenario);
            return;
        }

        const currentVideo = activeVideoIndex === 0 ? video1Ref.current : video2Ref.current;
        const nextVideo = activeVideoIndex === 0 ? video2Ref.current : video1Ref.current;

        if (!nextVideo || !currentVideo) {
            console.warn('❌ Video refs not ready');
            return;
        }

        // Skip if first render
        if (currentScenario === "idle" && !currentVideo.src) {
            console.log('✅ First render - skip video switching');
            lastScenarioRef.current = currentScenario;
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🔵 IDLE SCENARIO HANDLING
        // ═══════════════════════════════════════════════════════════════

        if (currentScenario === "idle") {
            const isIdleAlreadyPlaying = currentVideo.src &&
                currentVideo.src.includes(videoSrc) &&
                !currentVideo.paused &&
                currentVideo.loop;

            if (isIdleAlreadyPlaying && lastScenarioRef.current === "idle") {
                console.log('✅ Idle already playing correctly');
                return;
            }

            if (currentVideo.src && currentVideo.src.includes(videoSrc)) {
                console.log('🔄 Restarting idle on current player');
                currentVideo.loop = true;
                currentVideo.currentTime = 0;

                if (currentVideo.paused) {
                    currentVideo.play()
                        .then(() => {
                            console.log('✅ Idle video resumed');
                            lastScenarioRef.current = currentScenario;
                        })
                        .catch(e => console.error("❌ Idle resume error:", e));
                } else {
                    lastScenarioRef.current = currentScenario;
                }
                return;
            }
        }

        // Check if same video already playing
        if (currentScenario !== "idle" &&
            currentVideo.src &&
            currentVideo.src.includes(videoSrc) &&
            lastScenarioRef.current === currentScenario) {
            console.log('❌ Same video already playing, skip');
            return;
        }

        // Check if already loading
        if (isLoadingRef.current) {
            console.log('❌ Already loading video (' + loadingScenarioRef.current + '), blocking');
            return;
        }

        console.log('✅ Proceeding with video switch to:', currentScenario);

        // ═══════════════════════════════════════════════════════════════
        // 🎬 MARK ATTACK SCENARIOS AS SEQUENCE START
        // ═══════════════════════════════════════════════════════════════

        const attackScenarios = [
            'tokenAPump', 'tokenBPump', 'tokenACombo', 'tokenBCombo',
            'tokenAVictory', 'tokenBVictory'
        ];

        if (attackScenarios.includes(currentScenario)) {
            console.log('🎬 Starting video sequence for:', currentScenario);
            isPlayingSequenceRef.current = true;
        }

        isLoadingRef.current = true;
        loadingScenarioRef.current = currentScenario;

        // ═══════════════════════════════════════════════════════════════
        // 📹 LOAD AND SWITCH VIDEO
        // ═══════════════════════════════════════════════════════════════

        nextVideo.src = videoSrc;
        nextVideo.loop = currentScenario === "idle";
        nextVideo.preload = "auto";

        const handleError = (e) => {
            console.error('❌ Video load error:', e);
            console.error('❌ Failed src:', nextVideo.src);
            isLoadingRef.current = false;
            loadingScenarioRef.current = null;
        };

        nextVideo.addEventListener('error', handleError);
        nextVideo.load();

        const handleCanPlay = () => {
            console.log('✅ Video ready to play:', currentScenario);

            nextVideo.currentTime = 0;
            nextVideo.play().then(() => {
                console.log('✅ Play started, fading videos');

                // Fade transition
                currentVideo.style.opacity = '0';
                currentVideo.style.zIndex = '1';
                nextVideo.style.opacity = '1';
                nextVideo.style.zIndex = '2';

                // ✅ FIXED: Set active index without triggering dependency
                setActiveVideoIndex(prev => prev === 0 ? 1 : 0);

                setTimeout(() => {
                    currentVideo.pause();
                    currentVideo.currentTime = 0;
                }, 100);

                lastScenarioRef.current = currentScenario;
                isLoadingRef.current = false;
                loadingScenarioRef.current = null;
                console.log('✅ Switch complete:', currentScenario);
            }).catch(e => {
                console.error("❌ Play error:", e);
                isLoadingRef.current = false;
                loadingScenarioRef.current = null;
            });
        };

        nextVideo.addEventListener('canplaythrough', handleCanPlay, { once: true });

        return () => {
            nextVideo.removeEventListener('canplaythrough', handleCanPlay);
            nextVideo.removeEventListener('error', handleError);
        };
    }, [currentScenario, hasJoined, videos]); // ✅ FIXED: Removed activeVideoIndex

    // ═══════════════════════════════════════════════════════════════
    // 🎬 VIDEO ENDED HANDLER WITH QUEUE PROCESSING
    // ═══════════════════════════════════════════════════════════════

    const handleVideoEnded = useCallback(() => {
        const scenario = currentScenarioRef.current;
        console.log('\n🎥 VIDEO ENDED:', scenario);

        const attackScenarios = [
            'tokenAPump', 'tokenBPump', 'tokenACombo', 'tokenBCombo',
            'tokenAVictory', 'tokenBVictory'
        ];
        const backScenarios = ['tokenABack', 'tokenBBack'];

        if (attackScenarios.includes(scenario)) {
            const backScenario = scenario.includes('tokenA') ? 'tokenABack' : 'tokenBBack';
            console.log('⚔️ Attack ended, going to:', backScenario);
            isPlayingSequenceRef.current = true;
            setCurrentScenarioSafe(backScenario, 'video-sequence');

        } else if (backScenarios.includes(scenario)) {
            console.log('🔙 Back animation ended, returning to idle');
            setCurrentScenarioSafe('idle', 'video-sequence');
            isPlayingSequenceRef.current = false;

            // ✅ NEW: Process queued scenarios
            if (scenarioQueueRef.current.length > 0) {
                const nextScenario = scenarioQueueRef.current.shift();
                console.log('📋 Processing queued scenario:', nextScenario,
                    '| Remaining in queue:', scenarioQueueRef.current.length);
                setTimeout(() => {
                    setCurrentScenarioSafe(nextScenario, 'queued');
                }, 200); // Small delay for smooth transition
            } else {
                console.log('✅ Queue empty, staying at idle');
            }

        } else {
            console.log('⚠️ Unknown scenario ended:', scenario);
            isPlayingSequenceRef.current = false;
        }
    }, [setCurrentScenarioSafe]);

    // ═══════════════════════════════════════════════════════════════
    // 🎧 ATTACH EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!hasJoined) return;

        const video1 = video1Ref.current;
        const video2 = video2Ref.current;

        console.log('🎧 Attaching ended event listeners');

        if (video1) video1.addEventListener('ended', handleVideoEnded);
        if (video2) video2.addEventListener('ended', handleVideoEnded);

        return () => {
            console.log('🔇 Removing event listeners');
            if (video1) video1.removeEventListener('ended', handleVideoEnded);
            if (video2) video2.removeEventListener('ended', handleVideoEnded);
        };
    }, [hasJoined, handleVideoEnded]);

    // ═══════════════════════════════════════════════════════════════
    // 📦 VIDEO PRELOADING
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!hasJoined) return;

        const preloadList = [
            videos.tokenAPump,
            videos.tokenBPump,
            videos.tokenABack,
            videos.tokenBBack,
            videos.tokenACombo,
            videos.tokenBCombo
        ];

        console.log('📦 Preloading videos...');
        preloadList.forEach(src => {
            if (src) {
                const video = document.createElement('video');
                video.preload = 'auto';
                video.src = src;
            }
        });
    }, [hasJoined, videos]);

    return {
        video1Ref,
        video2Ref,
        currentScenario,
        setCurrentScenario: setCurrentScenarioSafe,
    };
}
