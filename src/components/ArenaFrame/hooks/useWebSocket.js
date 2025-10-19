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
    const [currentScenario, setCurrentScenarioLocal] = useState('idle');
    const [lastDamage, setLastDamage] = useState(INITIAL_DAMAGE);
    const [damagePopup, setDamagePopup] = useState({ tokenA: null, tokenB: null });
    const [flashEffect, setFlashEffect] = useState({ active: false, color: 'red' });
    const [gameOver, setGameOver] = useState(null);

    const socketRef = useRef(null);

    // ✅ Wrapper to update both local state and video player
    const updateScenario = (scenario, source = 'websocket') => {
        setCurrentScenarioLocal(scenario);
        if (setCurrentScenario) {
            setCurrentScenario(scenario, source);
        }
    };

    useEffect(() => {
        if (!syncMode || !hasJoined) return;

        const socket = io(serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ Connected to Battle Server');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from Battle Server');
            setIsConnected(false);
        });

        socket.on('initial_state', (state) => {
            console.log('📦 Initial state:', state);

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
            updateScenario(state.scenario, 'websocket'); // ✅ Use wrapper
            setLastDamage(state.lastDamage);
        });

        socket.on('battle_update', (update) => {
            setHealth(update.health);
            setMarketData(update.marketData);
            setCombo(update.combo);
            setScore(update.score);
            setLastDamage(update.lastDamage);
            setRound(update.currentRound);

            if (update.defender === 'tokenA') {
                setDamagePopup(prev => ({ ...prev, tokenA: update.damage }));
                setTimeout(() => setDamagePopup(prev => ({ ...prev, tokenA: null })), 1500);
            } else if (update.defender === 'tokenB') {
                setDamagePopup(prev => ({ ...prev, tokenB: update.damage }));
                setTimeout(() => setDamagePopup(prev => ({ ...prev, tokenB: null })), 1500);
            }

            if (update.scenario) {
                updateScenario(update.scenario, 'websocket'); // ✅ Use wrapper
                if (update.scenario.includes('Victory')) {
                    setGameOver(update.attacker);
                }
            }

            setFlashEffect({ active: true, color: 'red' });
            setTimeout(() => setFlashEffect({ active: false, color: 'red' }), 300);
        });

        socket.on('game_reset', (data) => {
            setHealth(data.health);
            setRound(data.currentRound);
            setScore(data.score);
            setGameOver(null);
            setCombo(INITIAL_COMBO);
            updateScenario('idle', 'websocket'); // ✅ Use wrapper
        });

        socket.on('scenario_change', ({ scenario }) => {
            if (scenario !== currentScenario) {
                updateScenario(scenario, 'websocket'); // ✅ Use wrapper
            }
        });

        socket.on('user_count', (count) => {
            setUserCount(count);
        });

        return () => socket.disconnect();
    }, [syncMode, serverUrl, hasJoined, setCurrentScenario, currentScenario]);

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
        currentScenario,
        // ✅ No longer returning setCurrentScenario - it comes from video player
        lastDamage,
        damagePopup,
        flashEffect,
        gameOver,
    };
}
