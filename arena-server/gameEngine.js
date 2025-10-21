// gameEngine.js - COMPLETE FINAL VERSION with All Fixes
const config = require('./config');

class GameEngine {
    constructor() {
        this.state = {
            currentRound: 1,
            maxRounds: config.game.roundsToWin * 2 - 1,
            score: { tokenA: 0, tokenB: 0 },
            health: {
                tokenA: config.game.maxHealth,
                tokenB: config.game.maxHealth
            },
            marketCap: { tokenA: 0, tokenB: 0 },
            lastMarketCap: { tokenA: 0, tokenB: 0 },
            currentScenario: 'idle',
            lastAttacker: null,
            combo: { tokenA: 0, tokenB: 0 },
            lastDamage: { tokenA: 0, tokenB: 0 },
            lastAttackTime: 0,
            isRoundActive: true,
            isGameOver: false,
            winner: null
        };

        console.log('🎮 Game Engine initialized (BALANCED MODE with VIDEO SYNC)');
        console.log(`   Max rounds: ${this.state.maxRounds}`);
        console.log(`   Rounds to win: ${config.game.roundsToWin}`);
        console.log(`   Max damage per hit: ${config.game.maxHealth * 0.4} HP`);
        console.log(`   Attack cooldown: ${(config.game.attackCooldown || 8000) / 1000}s`);
    }

    updateMarketData(data) {
        if (!data) return;
        this.state.marketCap.tokenA = data.tokenA.marketCap;
        this.state.marketCap.tokenB = data.tokenB.marketCap;
    }

    // ⚖️ BALANCED DAMAGE CALCULATION
    calculateBalancedDamage(mcDifference) {
        // Bazni damage
        let damage = mcDifference * config.game.damageMultiplier;

        // 🛡️ DAMAGE CAP - Max 40% health po napadu
        const maxDamagePerHit = config.game.maxHealth * 0.4;

        if (damage > maxDamagePerHit) {
            console.log(`⚠️ Damage capped: ${damage.toFixed(1)} → ${maxDamagePerHit} HP`);
            damage = maxDamagePerHit;
        }

        // 📉 LOGARITHMIC SCALING za EKSTREMNE skokove
        if (mcDifference > 50) {
            const logScale = Math.log10(mcDifference / 10) / Math.log10(5);
            const scaledDamage = maxDamagePerHit * logScale;
            damage = Math.min(damage, scaledDamage);
            console.log(`📉 Logarithmic scaling applied: ${mcDifference.toFixed(2)}% → ${damage.toFixed(1)} HP`);
        }

        return damage;
    }

    // ⚔️ MAIN BATTLE LOGIC with ATTACK COOLDOWN
    processBattle(emitCallback) {
        if (!this.state.isRoundActive || this.state.isGameOver) {
            return null;
        }

        // Initialize on first run
        if (this.state.lastMarketCap.tokenA === 0) {
            this.state.lastMarketCap.tokenA = this.state.marketCap.tokenA;
            this.state.lastMarketCap.tokenB = this.state.marketCap.tokenB;
            return null;
        }

        // ═══════════════════════════════════════════════════════════
        // 🆕 CHECK ATTACK COOLDOWN (daj vreme video sekvenci!)
        // ═══════════════════════════════════════════════════════════
        const now = Date.now();
        const timeSinceLastAttack = now - this.state.lastAttackTime;
        const cooldown = config.game.attackCooldown || 8000;

        if (timeSinceLastAttack < cooldown) {
            const remainingCooldown = Math.ceil((cooldown - timeSinceLastAttack) / 1000);

            // Log samo svake 3 sekunde da ne spamuje
            if (remainingCooldown % 3 === 0) {
                console.log(`⏳ Attack cooldown: ${remainingCooldown}s remaining (video sequence playing)...`);
            }

            return {
                type: 'cooldown',
                remainingSeconds: remainingCooldown
            };
        }

        // Calculate MC changes (percentage)
        const tokenAChange = ((this.state.marketCap.tokenA - this.state.lastMarketCap.tokenA) / this.state.lastMarketCap.tokenA) * 100;
        const tokenBChange = ((this.state.marketCap.tokenB - this.state.lastMarketCap.tokenB) / this.state.lastMarketCap.tokenB) * 100;

        console.log(`\n🔥 ═══════════════════════════════════════════`);
        console.log(`🔥 BATTLE CHECK - Round ${this.state.currentRound}`);
        console.log(`🔥 ═══════════════════════════════════════════`);
        console.log(`   ${config.tokens.tokenA.symbol}: ${tokenAChange >= 0 ? '+' : ''}${tokenAChange.toFixed(4)}%`);
        console.log(`   ${config.tokens.tokenB.symbol}: ${tokenBChange >= 0 ? '+' : ''}${tokenBChange.toFixed(4)}%`);

        const mcDifference = Math.abs(tokenAChange - tokenBChange);
        console.log(`   MC Difference: ${mcDifference.toFixed(4)}% (threshold: ${config.game.minMcDiffForAttack}%)`);

        // Too close - no attack
        if (mcDifference < config.game.minMcDiffForAttack) {
            console.log(`   ⏸️ Too close to call - staying idle\n`);

            if (this.state.currentScenario !== 'idle') {
                this.state.currentScenario = 'idle';
            }
            this.state.lastMarketCap.tokenA = this.state.marketCap.tokenA;
            this.state.lastMarketCap.tokenB = this.state.marketCap.tokenB;
            return { type: 'idle' };
        }

        let attacker, defender, damage, scenario;

        // ═══════════════════════════════════════════════════════════
        // 🥊 DETERMINE ATTACKER
        // ═══════════════════════════════════════════════════════════
        if (tokenAChange > tokenBChange) {
            attacker = 'tokenA';
            defender = 'tokenB';
            damage = this.calculateBalancedDamage(mcDifference);

            // Combo system
            if (this.state.lastAttacker === 'tokenA') {
                this.state.combo.tokenA++;
                scenario = this.state.combo.tokenA >= 3 ? 'tokenACombo' : 'tokenAPump';
                if (this.state.combo.tokenA >= 3) {
                    damage *= 1.2;
                    console.log(`🔥 COMBO x${this.state.combo.tokenA}! Bonus damage: +20%`);
                }
            } else {
                this.state.combo = { tokenA: 1, tokenB: 0 };
                scenario = 'tokenAPump';
            }
            this.state.lastAttacker = 'tokenA';

        } else {
            attacker = 'tokenB';
            defender = 'tokenA';
            damage = this.calculateBalancedDamage(mcDifference);

            // Combo system
            if (this.state.lastAttacker === 'tokenB') {
                this.state.combo.tokenB++;
                scenario = this.state.combo.tokenB >= 3 ? 'tokenBCombo' : 'tokenBPump';
                if (this.state.combo.tokenB >= 3) {
                    damage *= 1.2;
                    console.log(`🔥 COMBO x${this.state.combo.tokenB}! Bonus damage: +20%`);
                }
            } else {
                this.state.combo = { tokenA: 0, tokenB: 1 };
                scenario = 'tokenBPump';
            }
            this.state.lastAttacker = 'tokenB';
        }

        // ═══════════════════════════════════════════════════════════
        // 💥 APPLY DAMAGE
        // ═══════════════════════════════════════════════════════════
        this.state.health[defender] = Math.max(0, this.state.health[defender] - damage);
        this.state.lastDamage[defender] = Date.now();
        this.state.currentScenario = scenario;

        // 🆕 UPDATE LAST ATTACK TIME (start cooldown)
        this.state.lastAttackTime = now;

        console.log(`\n⚔️ ${config.tokens[attacker].symbol} ATTACKS ${config.tokens[defender].symbol}!`);
        console.log(`   💥 Damage: ${damage.toFixed(1)} HP`);
        console.log(`   💚 ${config.tokens[attacker].symbol}: ${this.state.health[attacker].toFixed(1)} HP`);
        console.log(`   💔 ${config.tokens[defender].symbol}: ${this.state.health[defender].toFixed(1)} HP`);
        console.log(`   ⏰ Next attack available in ${cooldown / 1000}s (video sequence time)`);
        console.log(`═══════════════════════════════════════════\n`);

        // ═══════════════════════════════════════════════════════════
        // 🏆 CHECK FOR ROUND WINNER
        // ═══════════════════════════════════════════════════════════
        if (this.state.health[defender] <= 0) {
            this.endRound(attacker, emitCallback);
            scenario = `${attacker}Victory`;
        }

        // Update last MC
        this.state.lastMarketCap.tokenA = this.state.marketCap.tokenA;
        this.state.lastMarketCap.tokenB = this.state.marketCap.tokenB;

        return {
            type: 'battle',
            attacker,
            defender,
            damage: Math.round(damage),
            scenario,
            health: { ...this.state.health },
            combo: { ...this.state.combo },
            currentRound: this.state.currentRound,
            score: { ...this.state.score },
            attackerChange: attacker === 'tokenA' ? tokenAChange : tokenBChange,
            defenderChange: attacker === 'tokenA' ? tokenBChange : tokenAChange,
            mcDifference: mcDifference
        };
    }

    // 🏁 END ROUND - COMPLETE FIXED VERSION
    endRound(winner, emitCallback) {
        console.log(`\n🏆 ═══════════════════════════════════════════`);
        console.log(`🏆 Round ${this.state.currentRound} WINNER: ${config.tokens[winner].symbol}!`);
        console.log(`🏆 ═══════════════════════════════════════════`);

        this.state.score[winner]++;
        this.state.isRoundActive = false;

        console.log(`📊 Score: ${config.tokens.tokenA.symbol} ${this.state.score.tokenA} - ${this.state.score.tokenB} ${config.tokens.tokenB.symbol}`);

        // 🆕 EMIT ROUND END EVENT
        if (emitCallback) {
            emitCallback({
                type: 'round_end',
                winner,
                currentRound: this.state.currentRound,
                score: { ...this.state.score },
                health: { ...this.state.health }
            });
        }

        // ═══════════════════════════════════════════════════════════
        // 👑 CHECK FOR GAME WINNER
        // ═══════════════════════════════════════════════════════════
        if (this.state.score[winner] >= config.game.roundsToWin) {
            this.state.isGameOver = true;
            this.state.winner = winner;
            const loser = winner === 'tokenA' ? 'tokenB' : 'tokenA';

            console.log(`\n👑 ═══════════════════════════════════════════`);
            console.log(`👑 🎉🎉🎉 GAME OVER! 🎉🎉🎉`);
            console.log(`👑 ═══════════════════════════════════════════`);
            console.log(`👑 ${config.tokens[winner].symbol} WINS THE GAME!`);
            console.log(`📊 Final Score: ${this.state.score[winner]} - ${this.state.score[loser]}`);
            console.log(`═══════════════════════════════════════════\n`);

            // 🆕 EMIT GAME OVER EVENT TO FRONTEND!
            if (emitCallback) {
                emitCallback({
                    type: 'game_over',
                    winner,
                    score: { ...this.state.score },
                    isGameOver: true
                });
            }

            // 🆕 AUTO RESTART AFTER 10 SECONDS
            console.log('⏱️ Game will auto-restart in 10 seconds...');
            setTimeout(() => {
                console.log('🔄 Auto-restarting game...');
                this.resetGame();

                // 🆕 EMIT GAME RESET TO FRONTEND
                if (emitCallback) {
                    emitCallback({
                        type: 'game_reset',
                        currentRound: 1,
                        health: { ...this.state.health },
                        score: { tokenA: 0, tokenB: 0 },
                        scenario: 'idle'
                    });
                }
            }, 10000); // 10s

        } else {
            // ➡️ PREPARE NEXT ROUND (not game over)
            console.log(`⏱️ Next round starts in 5 seconds...\n`);
            setTimeout(() => this.startNextRound(emitCallback), 5000);
        }
    }

    // ▶️ START NEXT ROUND
    startNextRound(emitCallback) {
        if (this.state.isGameOver) {
            console.log('⚠️ Cannot start next round - game is over');
            return;
        }

        this.state.currentRound++;

        // Reset health for new round
        this.state.health = {
            tokenA: config.game.maxHealth,
            tokenB: config.game.maxHealth
        };

        // Reset battle state
        this.state.combo = { tokenA: 0, tokenB: 0 };
        this.state.lastAttacker = null;
        this.state.currentScenario = 'idle';
        this.state.isRoundActive = true;
        this.state.lastAttackTime = 0;

        console.log(`\n🔔 ═══════════════════════════════════════════`);
        console.log(`🔔 ROUND ${this.state.currentRound} START!`);
        console.log(`🔔 ═══════════════════════════════════════════`);
        console.log(`📊 Score: ${config.tokens.tokenA.symbol} ${this.state.score.tokenA} - ${this.state.score.tokenB} ${config.tokens.tokenB.symbol}`);
        console.log(`💚 Both fighters at ${config.game.maxHealth} HP`);
        console.log(`═══════════════════════════════════════════\n`);

        // 📡 NOTIFY FRONTEND VIA CALLBACK
        if (emitCallback) {
            emitCallback({
                type: 'round_start',
                currentRound: this.state.currentRound,
                health: { ...this.state.health },
                score: { ...this.state.score },
                scenario: 'idle'
            });
        }
    }

    // 🔄 RESET ENTIRE GAME
    resetGame() {
        this.state = {
            currentRound: 1,
            maxRounds: config.game.roundsToWin * 2 - 1,
            score: { tokenA: 0, tokenB: 0 },
            health: {
                tokenA: config.game.maxHealth,
                tokenB: config.game.maxHealth
            },
            marketCap: { tokenA: 0, tokenB: 0 },
            lastMarketCap: { tokenA: 0, tokenB: 0 },
            currentScenario: 'idle',
            lastAttacker: null,
            combo: { tokenA: 0, tokenB: 0 },
            lastDamage: { tokenA: 0, tokenB: 0 },
            lastAttackTime: 0,
            isRoundActive: true,
            isGameOver: false,
            winner: null
        };

        console.log('\n🔄 ═══════════════════════════════════════════');
        console.log('🔄 GAME RESET - Starting fresh!');
        console.log('🔄 ═══════════════════════════════════════════\n');
    }

    // 📋 GET CURRENT STATE
    getState() {
        return this.state;
    }

    // 🎯 FORCE SCENARIO (for testing)
    setScenario(scenario) {
        this.state.currentScenario = scenario;
        console.log(`🎮 Scenario manually set to: ${scenario}`);
    }

    // 💊 FORCE HEALTH CHANGE (for testing)
    setHealth(tokenA, tokenB) {
        this.state.health.tokenA = Math.max(0, Math.min(100, tokenA));
        this.state.health.tokenB = Math.max(0, Math.min(100, tokenB));
        console.log(`💊 Health manually set: ${config.tokens.tokenA.symbol}=${tokenA}, ${config.tokens.tokenB.symbol}=${tokenB}`);
    }

    // 📊 GET BATTLE STATS
    getStats() {
        const totalRounds = this.state.currentRound - (this.state.isGameOver ? 0 : 1);
        return {
            totalRounds,
            score: this.state.score,
            currentRound: this.state.currentRound,
            isGameOver: this.state.isGameOver,
            winner: this.state.winner,
            health: this.state.health,
            lastAttackTime: this.state.lastAttackTime,
            cooldownRemaining: Math.max(0, (config.game.attackCooldown || 8000) - (Date.now() - this.state.lastAttackTime))
        };
    }
}

// Export singleton instance
module.exports = new GameEngine();
