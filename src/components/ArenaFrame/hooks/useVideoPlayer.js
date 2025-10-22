// useVideoPlayer.js - FIXED: Proper sequence locking to prevent video freezing
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

    // Queue system for scenarios during sequences
    const scenarioQueueRef = useRef([]);

    // 🔥 FIX: setCurrentScenario with STRICT queue support
    const setCurrentScenarioSafe = useCallback((newScenario, source = 'unknown') => {
        console.log('🔴 setCurrentScenario:', {
            from: currentScenarioRef.current,
            to: newScenario,
            source,
            isPlayingSequence: isPlayingSequenceRef.current,
            queueLength: scenarioQueueRef.current.length
        });

        // 🔥 STRICT BLOCKING: Block ALL updates during video sequences (except internal)
        if (isPlayingSequenceRef.current && source === 'websocket') {
            console.log('🚫 BLOCKED: Video sequence in progress, queuing:', newScenario);

            // Only queue attack scenarios - ignore idle/back
            const attackScenarios = ['tokenAPump', 'tokenBPump', 'tokenACombo', 'tokenBCombo', 'tokenAVictory', 'tokenBVictory'];
            if (attackScenarios.includes(newScenario) && !scenarioQueueRef.current.includes(newScenario)) {
                scenarioQueueRef.current.push(newScenario);
                console.log('📋 Added to queue. Queue:', scenarioQueueRef.current);
            }
            return; // CRITICAL: Don't update scenario
        }

        setCurrentScenario(newScenario);
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎬 INITIAL VIDEO SETUP
    // ═══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!hasJoined) return;

        console.log('🎮 Arena joined, setting up initial video');

        const video1 = video1Ref.current;
        if (!video1) return;

        video1.src = videos.idle;
        video1.load();

        const handleCanPlay = () => {
            video1.play()
                .then(() => {
                    video1.style.opacity = '1';
                    console.log('✅ Arena initial video started');
                })
                .catch(e => console.error('❌ Initial play error:', e));
        };

        video1.addEventListener('canplay', handleCanPlay, { once: true });

        return () => {
            video1.removeEventListener('canplay', handleCanPlay);
        };
    }, [hasJoined, videos.idle]);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔄 SCENARIO CHANGE HANDLER
    // ═══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!hasJoined) return;
        if (currentScenario === lastScenarioRef.current) {
            console.log('✅ First render - skip video switching');
            return;
        }

        console.log('🔄 Scenario change:', {
            from: lastScenarioRef.current,
            to: currentScenario
        });

        currentScenarioRef.current = currentScenario;

        // 🔥 CRITICAL: Lock sequence for attack scenarios
        const attackScenarios = ['tokenAPump', 'tokenBPump', 'tokenACombo', 'tokenBCombo'];
        if (attackScenarios.includes(currentScenario)) {
            console.log('🔒 LOCKING sequence for attack:', currentScenario);
            isPlayingSequenceRef.current = true;
        }

        if (isLoadingRef.current && loadingScenarioRef.current === currentScenario) {
            console.log('⏭️ Already loading this scenario');
            return;
        }

        if (currentScenario === lastScenarioRef.current) {
            console.log('⏭️ Already on this scenario');
            return;
        }

        console.log('✅ Proceeding with video switch to:', currentScenario);

        isLoadingRef.current = true;
        loadingScenarioRef.current = currentScenario;

        const currentIndex = activeVideoIndex;
        const nextIndex = currentIndex === 0 ? 1 : 0;
        const currentVideo = currentIndex === 0 ? video1Ref.current : video2Ref.current;
        const nextVideo = nextIndex === 0 ? video1Ref.current : video2Ref.current;

        if (!currentVideo || !nextVideo) {
            console.error('❌ Video refs not available');
            isLoadingRef.current = false;
            return;
        }

        console.log('🎬 Starting video sequence for:', currentScenario);

        const videoUrl = videos[currentScenario];
        if (!videoUrl) {
            console.error('❌ No video URL for scenario:', currentScenario);
            isLoadingRef.current = false;
            return;
        }

        nextVideo.src = videoUrl;
        nextVideo.style.opacity = '0';
        nextVideo.style.zIndex = '1';
        nextVideo.load();

        const handleError = (e) => {
            console.error('❌ Video load error:', e);
            isLoadingRef.current = false;
            loadingScenarioRef.current = null;
        };

        nextVideo.addEventListener('error', handleError, { once: true });

        const handleCanPlay = () => {
            console.log('✅ Video ready to play:', currentScenario);

            nextVideo.play().then(() => {
                console.log('✅ Play started, fading videos');

                currentVideo.style.opacity = '0';
                currentVideo.style.zIndex = '1';
                nextVideo.style.opacity = '1';
                nextVideo.style.zIndex = '2';

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
    }, [currentScenario, hasJoined, videos, activeVideoIndex]);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎬 VIDEO ENDED HANDLER WITH QUEUE PROCESSING
    // ═══════════════════════════════════════════════════════════════════════════

    const handleVideoEnded = useCallback(() => {
        const scenario = currentScenarioRef.current;
        console.log('\n🎥 VIDEO ENDED:', scenario);

        const attackScenarios = ['tokenAPump', 'tokenBPump', 'tokenACombo', 'tokenBCombo'];
        const backScenarios = ['tokenABack', 'tokenBBack'];
        const victoryScenarios = ['tokenAVictory', 'tokenBVictory'];

        // 🏆 VICTORY VIDEO ENDED
        if (victoryScenarios.includes(scenario)) {
            console.log('🏆 Victory video ended, returning to idle');
            setCurrentScenarioSafe('idle', 'video-sequence');
            isPlayingSequenceRef.current = false;
            console.log('🔓 UNLOCKED after victory');

            // Process queue
            if (scenarioQueueRef.current.length > 0) {
                const nextScenario = scenarioQueueRef.current.shift();
                console.log('📋 Processing queued scenario:', nextScenario);
                setTimeout(() => {
                    setCurrentScenarioSafe(nextScenario, 'queued');
                }, 500);
            } else {
                console.log('✅ Queue empty');
            }
            return;
        }

        // ⚔️ ATTACK VIDEO ENDED
        if (attackScenarios.includes(scenario)) {
            const backScenario = scenario.includes('tokenA') ? 'tokenABack' : 'tokenBBack';
            console.log('⚔️ Attack ended, going to:', backScenario);
            // Keep sequence locked
            setCurrentScenarioSafe(backScenario, 'video-sequence');
            return;
        }

        // 🔙 BACK VIDEO ENDED
        if (backScenarios.includes(scenario)) {
            console.log('🔙 Back animation ended, returning to idle');
            setCurrentScenarioSafe('idle', 'video-sequence');
            isPlayingSequenceRef.current = false;
            console.log('🔓 UNLOCKED after back animation');

            // 🔥 CRITICAL: Process queue with delay
            if (scenarioQueueRef.current.length > 0) {
                const nextScenario = scenarioQueueRef.current.shift();
                console.log('📋 Processing queued scenario:', nextScenario, '| Remaining:', scenarioQueueRef.current.length);
                setTimeout(() => {
                    setCurrentScenarioSafe(nextScenario, 'queued');
                }, 500); // 500ms delay before next attack
            } else {
                console.log('✅ Queue empty, staying at idle');
            }
            return;
        }

        // ⚠️ UNKNOWN SCENARIO (idle, etc.)
        console.log('⏸️ Non-sequence scenario ended:', scenario);
        isPlayingSequenceRef.current = false;

    }, [setCurrentScenarioSafe]);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎧 ATTACH EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!hasJoined) return;

        const video1 = video1Ref.current;
        const video2 = video2Ref.current;

        if (!video1 || !video2) return;

        console.log('🎧 Attaching ended event listeners');

        video1.addEventListener('ended', handleVideoEnded);
        video2.addEventListener('ended', handleVideoEnded);

        return () => {
            video1.removeEventListener('ended', handleVideoEnded);
            video2.removeEventListener('ended', handleVideoEnded);
        };
    }, [hasJoined, handleVideoEnded]);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎬 VIDEO PRELOADING
    // ═══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!hasJoined) return;

        console.log('📦 Preloading videos...');

        const preloadVideos = [
            videos.tokenAPump,
            videos.tokenBPump,
            videos.tokenABack,
            videos.tokenBBack,
            videos.tokenACombo,
            videos.tokenBCombo,
            videos.tokenAVictory,
            videos.tokenBVictory
        ];

        preloadVideos.forEach(url => {
            if (url) {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.as = 'video';
                link.href = url;
                document.head.appendChild(link);
            }
        });
    }, [hasJoined, videos]);

    return {
        video1Ref,
        video2Ref,
        setCurrentScenario: setCurrentScenarioSafe,
        currentScenario
    };
}