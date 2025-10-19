import { useState, useRef, useEffect, useCallback } from 'react';

export function useVideoPlayer(hasJoined, videos) {
    const video1Ref = useRef(null);
    const video2Ref = useRef(null);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [currentScenario, setCurrentScenario] = useState('idle');
    const lastScenarioRef = useRef('idle');
    const isLoadingRef = useRef(false);
    const loadingScenarioRef = useRef(null);
    const currentScenarioRef = useRef('idle');
    const isPlayingSequenceRef = useRef(false); // Track if we're in a video sequence

    // ✅ Wrapper for setCurrentScenario with logging and sequence protection
    const setCurrentScenarioSafe = useCallback((newScenario, source = 'unknown') => {
        console.log('🔴 setCurrentScenario called:', {
            from: currentScenarioRef.current,
            to: newScenario,
            source,
            isPlayingSequence: isPlayingSequenceRef.current
        });

        // If we're playing a video sequence and this is from WebSocket, ignore it
        if (isPlayingSequenceRef.current && source === 'websocket') {
            console.log('⚠️ BLOCKED: WebSocket tried to change scenario during video sequence');
            return;
        }

        setCurrentScenario(newScenario);
    }, []);

    // Initial video setup
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

    // Video switching
    useEffect(() => {
        console.log('\n🔥🔥🔥 ========== useEffect START ========== 🔥🔥🔥');
        console.log('📍 Dependencies:', { currentScenario, hasJoined, activeVideoIndex });

        if (!hasJoined) {
            console.log('❌ Not joined yet, exiting');
            console.log('🔥🔥🔥 ========== useEffect END ========== 🔥🔥🔥\n');
            return;
        }

        // ✅ Update ref immediately at the start
        const previousScenario = currentScenarioRef.current;
        currentScenarioRef.current = currentScenario;

        console.log('🔄 Scenario tracking:', {
            previousScenario,
            newScenario: currentScenario,
            refUpdated: currentScenarioRef.current
        });

        const videoSrc = videos[currentScenario];
        if (!videoSrc) {
            console.log('❌ No video source for scenario:', currentScenario);
            console.log('🔥🔥🔥 ========== useEffect END ========== 🔥🔥🔥\n');
            return;
        }

        const currentVideo = activeVideoIndex === 0 ? video1Ref.current : video2Ref.current;
        const nextVideo = activeVideoIndex === 0 ? video2Ref.current : video1Ref.current;

        if (!nextVideo || !currentVideo) {
            console.log('❌ Video refs not ready');
            console.log('🔥🔥🔥 ========== useEffect END ========== 🔥🔥🔥\n');
            return;
        }

        // Skip if first render
        if (currentScenario === "idle" && !currentVideo.src) {
            console.log('✅ CHECK: First render - skip video switching, use initial setup');
            lastScenarioRef.current = currentScenario;
            console.log('🔥🔥🔥 ========== useEffect END ========== 🔥🔥🔥\n');
            return;
        }

        // IDLE HANDLING
        if (currentScenario === "idle") {
            console.log('🔵 IDLE SCENARIO DETECTED');

            const isIdleAlreadyPlaying = currentVideo.src &&
                currentVideo.src.includes(videoSrc) &&
                !currentVideo.paused &&
                currentVideo.loop;

            if (isIdleAlreadyPlaying && lastScenarioRef.current === "idle") {
                console.log('✅ Idle already playing correctly');
                console.log('🔥🔥🔥 ========== useEffect END ========== 🔥🔥🔥\n');
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
                console.log('🔥🔥🔥 ========== useEffect END ========== 🔥🔥🔥\n');
                return;
            }
        }

        // Check if same video already playing
        if (currentScenario !== "idle" &&
            currentVideo.src &&
            currentVideo.src.includes(videoSrc) &&
            lastScenarioRef.current === currentScenario) {
            console.log('❌ Same video already playing, skip');
            console.log('🔥🔥🔥 ========== useEffect END ========== 🔥🔥🔥\n');
            return;
        }

        // Check if already loading
        if (isLoadingRef.current) {
            console.log('❌ Already loading video (' + loadingScenarioRef.current + '), blocking');
            console.log('🔥🔥🔥 ========== useEffect END ========== 🔥🔥🔥\n');
            return;
        }

        console.log('✅ ALL CHECKS PASSED - PROCEEDING WITH VIDEO SWITCH');
        console.log('🎬 Switching to:', currentScenario, 'from:', lastScenarioRef.current);

        // Mark attack scenarios as start of sequence
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

        // Load and switch to new video
        console.log('📹 Loading video:', videoSrc);
        nextVideo.src = videoSrc;
        nextVideo.loop = currentScenario === "idle";
        nextVideo.preload = "auto";

        const handleError = (e) => {
            console.error('❌ Video load error:', e);
            console.error('❌ Failed src:', nextVideo.src);
            isLoadingRef.current = false;
            loadingScenarioRef.current = null;
        };

        const handleLoadStart = () => {
            console.log('⏳ Started loading:', currentScenario);
        };

        const handleLoadedData = () => {
            console.log('📦 Video data loaded:', currentScenario);
        };

        nextVideo.addEventListener('error', handleError);
        nextVideo.addEventListener('loadstart', handleLoadStart);
        nextVideo.addEventListener('loadeddata', handleLoadedData);

        nextVideo.load();

        const handleCanPlay = () => {
            console.log('✅ Video ready to play:', currentScenario);

            nextVideo.currentTime = 0;
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
                console.log('✅ SWITCH COMPLETE:', currentScenario);
            }).catch(e => {
                console.error("❌ Play error:", e);
                isLoadingRef.current = false;
                loadingScenarioRef.current = null;
            });
        };

        nextVideo.addEventListener('canplaythrough', handleCanPlay, { once: true });

        console.log('🔥🔥🔥 ========== useEffect END ========== 🔥🔥🔥\n');

        return () => {
            nextVideo.removeEventListener('canplaythrough', handleCanPlay);
            nextVideo.removeEventListener('error', handleError);
            nextVideo.removeEventListener('loadstart', handleLoadStart);
            nextVideo.removeEventListener('loadeddata', handleLoadedData);
        };
    }, [currentScenario, hasJoined, videos, activeVideoIndex]);

    // Handle video ended
    const handleVideoEnded = useCallback(() => {
        const scenario = currentScenarioRef.current;
        console.log('\n🎥 VIDEO ENDED:', scenario);

        const attackScenarios = [
            'tokenAPump',
            'tokenBPump',
            'tokenACombo',
            'tokenBCombo',
            'tokenAVictory',
            'tokenBVictory'
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
        } else {
            console.log('⚠️ Unknown scenario ended:', scenario);
            isPlayingSequenceRef.current = false;
        }
    }, [setCurrentScenarioSafe]);

    // Attach event listeners
    useEffect(() => {
        if (!hasJoined) return;

        const video1 = video1Ref.current;
        const video2 = video2Ref.current;

        console.log('🎧 Attaching event listeners to videos');

        if (video1) video1.addEventListener('ended', handleVideoEnded);
        if (video2) video2.addEventListener('ended', handleVideoEnded);

        return () => {
            console.log('🔇 Removing event listeners');
            if (video1) video1.removeEventListener('ended', handleVideoEnded);
            if (video2) video2.removeEventListener('ended', handleVideoEnded);
        };
    }, [hasJoined, handleVideoEnded]);

    return {
        video1Ref,
        video2Ref,
        currentScenario,
        setCurrentScenario: setCurrentScenarioSafe,
    };
}
