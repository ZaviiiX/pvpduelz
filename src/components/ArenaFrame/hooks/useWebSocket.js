// useWebSocket-DEBUG.js - Enhanced with detailed logging
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
    const [attackReason, setAttackReason] = useState({
        attacker: null,
        attackerChange: null,
        defenderChange: null,
        mcDifference: null
    });
    const [roundVictory, setRoundVictory] = useState({
        winner: null,
        currentRound: null
    });

    // 🆕 DEBUG STATE
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [lastError, setLastError] = useState(null);
    const [connectionHistory, setConnectionHistory] = useState([]);

    const socketRef = useRef(null);
    const timeoutsRef = useRef([]);

    const logConnection = (event, details = {}) => {
        const timestamp = new Date().toISOString();
        const log = { event, details, timestamp };

        console.log(`🔌 [${timestamp}] ${event}:`, details);

        setConnectionHistory(prev => [
            log,
            ...prev.slice(0, 49) // Keep last 50 events
        ]);
    };

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
        if (!syncMode) {
            console.log('⏸️ WebSocket disabled (syncMode: false)');
            logConnection('disabled', { syncMode });
            return;
        }

        if (!hasJoined) {
            console.log('⏸️ Waiting for user to join...');
            logConnection('waiting', { hasJoined });
            return;
        }

        console.log('🌍 Initializing WebSocket connection...');
        console.log('   Server URL:', serverUrl);
        console.log('   Sync Mode:', syncMode);
        console.log('   Has Joined:', hasJoined);

        logConnection('initializing', { serverUrl, syncMode, hasJoined });

        // 🆕 PRE-CONNECTION CHECK
        const preCheck = async () => {
            try {
                console.log('🔍 Pre-connection health check...');
                const response = await fetch(`${serverUrl}/health`, {
                    method: 'GET',
                    timeout: 5000
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Server is reachable:', data);
                    logConnection('health_check_ok', data);
                } else {
                    console.warn('⚠️ Server returned:', response.status);
                    logConnection('health_check_failed', { status: response.status });
                    setLastError(`Server returned ${response.status}`);
                }
            } catch (error) {
                console.error('❌ Pre-check failed:', error.message);
                logConnection('health_check_error', { error: error.message });
                setLastError(`Cannot reach server: ${error.message}`);
            }
        };

        preCheck();

        const socket = io(serverUrl, {
            transports: ['websocket', 'polling'], // 🆕 Try both
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            timeout: 20000,
            forceNew: true
        });

        socketRef.current = socket;

        // 🆕 DETAILED EVENT LOGGING
        socket.on('connect', () => {
            console.log('✅ WebSocket CONNECTED');
            console.log('   Socket ID:', socket.id);
            console.log('   Transport:', socket.io.engine.transport.name);

            setIsConnected(true);
            setConnectionAttempts(0);
            setLastError(null);

            logConnection('connected', {
                id: socket.id,
                transport: socket.io.engine.transport.name
            });
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket DISCONNECTED');
            console.log('   Reason:', reason);

            setIsConnected(false);

            logConnection('disconnected', { reason });

            if (reason === 'io server disconnect') {
                console.log('🔄 Server disconnected us, reconnecting...');
                socket.connect();
            }
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Connection ERROR:', error.message);
            console.error('   Description:', error.description);
            console.error('   Type:', error.type);

            setConnectionAttempts(prev => prev + 1);
            setLastError(error.message);

            logConnection('error', {
                message: error.message,
                type: error.type,
                attempt: connectionAttempts + 1
            });
        });

        socket.on('reconnect_attempt', (attempt) => {
            console.log(`🔄 Reconnect attempt #${attempt}`);
            logConnection('reconnect_attempt', { attempt });
        });

        socket.on('reconnect', (attempt) => {
            console.log(`✅ Reconnected after ${attempt} attempts`);
            logConnection('reconnected', { attempt });
        });

        socket.on('reconnect_failed', () => {
            console.error('❌ Reconnection FAILED after all attempts');
            logConnection('reconnect_failed', {});
            setLastError('Reconnection failed after all attempts');
        });

        // 🆕 TRANSPORT CHANGE LOGGING
        socket.io.engine.on('upgrade', (transport) => {
            console.log('⬆️ Transport upgraded to:', transport.name);
            logConnection('transport_upgrade', { transport: transport.name });
        });

        socket.io.engine.on('close', (reason) => {
            console.log('🔒 Engine closed:', reason);
            logConnection('engine_close', { reason });
        });

        // REGULAR EVENT HANDLERS
        socket.on('initial_state', (state) => {
            console.log('📦 Initial state received');
            logConnection('initial_state', { round: state.currentRound });

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

        socket.on('battle_update', (update) => {
            console.log('⚔️ Battle update:', update.scenario);
            logConnection('battle_update', { scenario: update.scenario, damage: update.damage });

            setHealth(update.health);
            setMarketData(update.marketData);
            setCombo(update.combo);
            setScore(update.score);
            setLastDamage(update.lastDamage);
            setRound(update.currentRound);

            if (update.attackerChange !== undefined && update.defenderChange !== undefined) {
                setAttackReason({
                    attacker: update.attacker,
                    attackerChange: update.attackerChange,
                    defenderChange: update.defenderChange,
                    mcDifference: update.mcDifference
                });
            }

            if (update.scenario) {
                updateScenario(update.scenario, 'websocket');
            }

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

            setFlashEffect({ active: true, color: 'red' });
            setSafeTimeout(() => {
                setFlashEffect({ active: false, color: 'red' });
            }, 300);
        });

        socket.on('round_end', (data) => {
            console.log('🏆 Round end:', data.winner);
            logConnection('round_end', { winner: data.winner, round: data.currentRound });

            setScore(data.score);
            setRoundVictory({
                winner: data.winner,
                currentRound: data.currentRound
            });
        });

        socket.on('game_over', (data) => {
            console.log('👑 GAME OVER:', data.winner);
            logConnection('game_over', { winner: data.winner });

            setGameOver(data.winner);
            setScore(data.score);
            setRoundVictory({
                winner: null,
                currentRound: null
            });
        });

        socket.on('round_start', (data) => {
            console.log('🔔 Round start:', data.currentRound);
            logConnection('round_start', { round: data.currentRound });

            setHealth(data.health);
            setRound(data.currentRound);
            setScore(data.score);
            setCombo({ tokenA: 0, tokenB: 0 });
            setGameOver(null);
            setRoundVictory({
                winner: null,
                currentRound: null
            });
            setAttackReason({
                attacker: null,
                attackerChange: null,
                defenderChange: null,
                mcDifference: null
            });
            updateScenario('idle', 'websocket');
        });

        socket.on('game_reset', (data) => {
            console.log('🔄 Game reset');
            logConnection('game_reset', {});

            setHealth(data.health);
            setRound(data.currentRound);
            setScore(data.score);
            setGameOver(null);
            setCombo(INITIAL_COMBO);
            setRoundVictory({
                winner: null,
                currentRound: null
            });
            setAttackReason({
                attacker: null,
                attackerChange: null,
                defenderChange: null,
                mcDifference: null
            });
            updateScenario('idle', 'websocket');
        });

        socket.on('scenario_change', ({ scenario }) => {
            console.log('🎬 Scenario change:', scenario);
            logConnection('scenario_change', { scenario });
            updateScenario(scenario, 'websocket');
        });

        socket.on('user_count', (count) => {
            setUserCount(count);
            logConnection('user_count', { count });
        });

        return () => {
            console.log('🧹 Cleaning up WebSocket connection');
            logConnection('cleanup', {});
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
        roundVictory,
        // 🆕 DEBUG INFO
        connectionAttempts,
        lastError,
        connectionHistory
    };
}