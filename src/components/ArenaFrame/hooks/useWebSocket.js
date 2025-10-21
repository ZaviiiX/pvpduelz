// useWebSocket.js - COMPLETE WITH ROUND VICTORY
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

    // 🆕 ATTACK REASON STATE
    const [attackReason, setAttackReason] = useState({
        attacker: null,
        attackerChange: null,
        defenderChange: null,
        mcDifference: null
    });

    // 🆕 ROUND VICTORY STATE
    const [roundVictory, setRoundVictory] = useState({
        winner: null,
        currentRound: null
    });

    const socketRef = useRef(null);
    const timeoutsRef = useRef([]);

    const setSafeTimeout = (callback, delay) => {
        const id = setTimeout(callback, delay);
        timeoutsRef.current.push(id);
        return id;
    };

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

        socket.on('connect', () => {
            console.log('✅ Connected to Battle Server');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from Battle Server');
            setIsConnected(false);
        });

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

            if (state.isGameOver) {
                setGameOver(state.winner);
            }
        });

        // ═══════════════════════════════════════════════════════════
        // ⚔️ BATTLE UPDATE
        // ═══════════════════════════════════════════════════════════
        socket.on('battle_update', (update) => {
            console.log('⚔️ Battle update received:', update.scenario);

            // Update states
            setHealth(update.health);
            setMarketData(update.marketData);
            setCombo(update.combo);
            setScore(update.score);
            setLastDamage(update.lastDamage);
            setRound(update.currentRound);

            // Set attack reason
            if (update.attackerChange !== undefined && update.defenderChange !== undefined) {
                setAttackReason({
                    attacker: update.attacker,
                    attackerChange: update.attackerChange,
                    defenderChange: update.defenderChange,
                    mcDifference: update.mcDifference
                });
            }

            // Update scenario
            if (update.scenario) {
                updateScenario(update.scenario, 'websocket');
            }

            // Damage popup
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

            // Flash effect
            setFlashEffect({ active: true, color: 'red' });
            setSafeTimeout(() => {
                setFlashEffect({ active: false, color: 'red' });
            }, 300);
        });

        // ═══════════════════════════════════════════════════════════
        // 🏆 ROUND END EVENT
        // ═══════════════════════════════════════════════════════════
        socket.on('round_end', (data) => {
            console.log('🏆 Round end received:', data);

            // Update score
            setScore(data.score);

            // 🆕 Show round victory screen
            setRoundVictory({
                winner: data.winner,
                currentRound: data.currentRound
            });

            console.log(`✅ Round ${data.currentRound} complete - ${data.winner} wins!`);
        });

        // ═══════════════════════════════════════════════════════════
        // 👑 GAME OVER EVENT
        // ═══════════════════════════════════════════════════════════
        socket.on('game_over', (data) => {
            console.log('👑 GAME OVER received:', data);

            setGameOver(data.winner);
            setScore(data.score);

            // Clear round victory when game over shows
            setRoundVictory({
                winner: null,
                currentRound: null
            });

            console.log(`✅ ${data.winner} wins the ENTIRE GAME!`);
        });

        // ═══════════════════════════════════════════════════════════
        // 🔔 ROUND START
        // ═══════════════════════════════════════════════════════════
        socket.on('round_start', (data) => {
            console.log('🔔 Round start received:', data);

            setHealth(data.health);
            setRound(data.currentRound);
            setScore(data.score);
            setCombo({ tokenA: 0, tokenB: 0 });
            setGameOver(null);

            // Clear round victory screen
            setRoundVictory({
                winner: null,
                currentRound: null
            });

            // Reset attack reason
            setAttackReason({
                attacker: null,
                attackerChange: null,
                defenderChange: null,
                mcDifference: null
            });

            updateScenario('idle', 'websocket');

            console.log(`✅ New round started: Round ${data.currentRound}`);
        });

        // ═══════════════════════════════════════════════════════════
        // 🔄 GAME RESET
        // ═══════════════════════════════════════════════════════════
        socket.on('game_reset', (data) => {
            console.log('🔄 Game reset received');

            setHealth(data.health);
            setRound(data.currentRound);
            setScore(data.score);
            setGameOver(null);
            setCombo(INITIAL_COMBO);

            // Clear round victory screen
            setRoundVictory({
                winner: null,
                currentRound: null
            });

            // Reset attack reason
            setAttackReason({
                attacker: null,
                attackerChange: null,
                defenderChange: null,
                mcDifference: null
            });

            updateScenario('idle', 'websocket');
        });

        socket.on('scenario_change', ({ scenario }) => {
            console.log('🎬 Scenario change received:', scenario);
            updateScenario(scenario, 'websocket');
        });

        socket.on('user_count', (count) => {
            setUserCount(count);
        });

        return () => {
            console.log('🧹 Cleaning up WebSocket connection');
            socket.disconnect();
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
        attackReason,
        roundVictory, // 🆕 EXPORT THIS
    };
}
