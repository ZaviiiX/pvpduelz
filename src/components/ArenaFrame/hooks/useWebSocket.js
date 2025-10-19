// useWebSocket.js - FIXED VERSION with Memory Leak Prevention
import { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import {
    INITIAL_TOKEN_CONFIG,
    INITIAL_HEALTH,
    INITIAL_MARKET_DATA,
    INITIAL_COMBO,
    INITIAL_SCORE,
    INITIAL_DAMAGE,
} from '../constants/index.js';

export function useWebSocket(syncMode, serverUrl, hasJoined, setCurrentScenario) {
    const [isConnected, setIsConnected] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [tokenConfig, setTokenConfig] = useState(INITIAL_TOKEN_CONFIG);
    const [health, setHealth] = useState(INITIAL_HEALTH);
    const [marketData, setMarketData] = useState(INITIAL_MARKET_DATA);
    const [combo, setCombo] = useState(INITIAL_COMBO);
    const [score, setScore] = useState(INITIAL_SCORE);
    const [round, setRound] = useState(1);
    const [lastDamage, setLastDamage] = useState(INITIAL_DAMAGE);
    const [damagePopup, setDamagePopup] = useState({ tokenA: null, tokenB: null });
    const [flashEffect, setFlashEffect] = useState({ active: false, color: 'red' });
    const [gameOver, setGameOver] = useState(null);

    const socketRef = useRef(null);

    // ✅ NEW: Track timeouts for cleanup
    const timeoutsRef = useRef([]);

    // ✅ NEW: Helper to manage timeouts
    const setSafeTimeout = (callback, delay) => {
        const id = setTimeout(callback, delay);
        timeoutsRef.current.push(id);
        return id;
    };

    // ✅ IMPROVED: Direct scenario update (no local state duplication)
    const updateScenario = (scenario, source = 'websocket') => {
        if (setCurrentScenario) {
            setCurrentScenario(scenario, source);
        }
    };

    useEffect(() => {
        if (!syncMode || !hasJoined) return;

        console.log('🌐 Connecting to WebSocket:', serverUrl);

        const socket = io(serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });

        socketRef.current = socket;

        // ═══════════════════════════════════════════════════════════════
        // 🔌 CONNECTION EVENTS
        // ═══════════════════════════════════════════════════════════════

        socket.on('connect', () => {
            console.log('✅ Connected to Battle Server');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from Battle Server');
            setIsConnected(false);
        });

        // ═══════════════════════════════════════════════════════════════
        // 📦 INITIAL STATE
        // ═══════════════════════════════════════════════════════════════

        socket.on('initial_state', (state) => {
            console.log('📦 Initial state received');

            if (state.config) {
                setTokenConfig({
                    tokenA: state.config.tokenA,
                    tokenB: state.config.tokenB,
                    roundsToWin: state.config.roundsToWin
                });
            }

            setHealth(state.health);
            setCombo(state.combo);
            setRound(state.currentRound);
            setScore(state.score);
            setMarketData(state.marketData);
            updateScenario(state.scenario, 'websocket');
            setLastDamage(state.lastDamage);
        });

        // ═══════════════════════════════════════════════════════════════
        // ⚔️ BATTLE UPDATE
        // ═══════════════════════════════════════════════════════════════

        socket.on('battle_update', (update) => {
            console.log('⚔️ Battle update received:', update.scenario);

            setHealth(update.health);
            setMarketData(update.marketData);
            setCombo(update.combo);
            setScore(update.score);
            setLastDamage(update.lastDamage);
            setRound(update.currentRound);

            // ✅ FIXED: Damage popup with safe timeout
            if (update.defender === 'tokenA') {
                setDamagePopup(prev => ({ ...prev, tokenA: update.damage }));
                setSafeTimeout(() => {
                    setDamagePopup(prev => ({ ...prev, tokenA: null }));
                }, 1500);
            } else if (update.defender === 'tokenB') {
                setDamagePopup(prev => ({ ...prev, tokenB: update.damage }));
                setSafeTimeout(() => {
                    setDamagePopup(prev => ({ ...prev, tokenB: null }));
                }, 1500);
            }

            // Scenario update
            if (update.scenario) {
                updateScenario(update.scenario, 'websocket');
                if (update.scenario.includes('Victory')) {
                    setGameOver(update.attacker);
                }
            }

            // ✅ FIXED: Flash effect with safe timeout
            setFlashEffect({ active: true, color: 'red' });
            setSafeTimeout(() => {
                setFlashEffect({ active: false, color: 'red' });
            }, 300);
        });

        // ═══════════════════════════════════════════════════════════════
        // 🔄 GAME RESET
        // ═══════════════════════════════════════════════════════════════

        socket.on('game_reset', (data) => {
            console.log('🔄 Game reset received');
            setHealth(data.health);
            setRound(data.currentRound);
            setScore(data.score);
            setGameOver(null);
            setCombo(INITIAL_COMBO);
            updateScenario('idle', 'websocket');
        });

        // ═══════════════════════════════════════════════════════════════
        // 🎬 SCENARIO CHANGE
        // ═══════════════════════════════════════════════════════════════

        socket.on('scenario_change', ({ scenario }) => {
            console.log('🎬 Scenario change received:', scenario);
            updateScenario(scenario, 'websocket');
        });

        // ═══════════════════════════════════════════════════════════════
        // 👥 USER COUNT
        // ═══════════════════════════════════════════════════════════════

        socket.on('user_count', (count) => {
            setUserCount(count);
        });

        // ═══════════════════════════════════════════════════════════════
        // 🧹 CLEANUP
        // ═══════════════════════════════════════════════════════════════

        return () => {
            console.log('🧹 Cleaning up WebSocket connection');
            socket.disconnect();

            // ✅ FIXED: Clear all timeouts to prevent memory leaks
            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];
        };
    }, [syncMode, serverUrl, hasJoined, setCurrentScenario]);

    return {
        socketRef,
        isConnected,
        userCount,
        tokenConfig,
        health,
        marketData,
        combo,
        score,
        round,
        lastDamage,
        damagePopup,
        flashEffect,
        gameOver,
    };
}
