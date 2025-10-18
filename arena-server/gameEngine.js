// gameEngine.js - BATTLE GAME ENGINE
const config = require('./config');

class GameEngine {
    constructor() {
        this.state = {
            // Round system
            currentRound: 1,
            maxRounds: config.game.roundsToWin * 2 - 1, // Best of 5 = max 5 rounds
            score: { tokenA: 0, tokenB: 0 },

            // Health
            health: {
                tokenA: config.game.maxHealth,
                tokenB: config.game.maxHealth
            },

            // Market tracking
            marketCap: { tokenA: 0, tokenB: 0 },
            lastMarketCap: { tokenA: 0, tokenB: 0 },

            // Battle state
            currentScenario: 'idle',
            lastAttacker: null,
            combo: { tokenA: 0, tokenB: 0 },
            lastDamage: { tokenA: 0, tokenB: 0 },

            // Game status
            isRoundActive: true,
            isGameOver: false,
            winner: null
        };

        console.log('🎮 Game Engine initialized');
        console.log(`   Max rounds: ${this.state.maxRounds}`);
        console.log(`   Rounds to win: ${config.game.roundsToWin}`);
    }

    // 📊 UPDATE MARKET DATA FROM MARKET SERVICE
    updateMarketData(data) {
        if (!data) return;

        this.state.marketCap.tokenA = data.tokenA.marketCap;
        this.state.marketCap.tokenB = data.tokenB.marketCap;
    }

    // ⚔️ MAIN BATTLE LOGIC
    processBattle() {
        if (!this.state.isRoundActive || this.state.isGameOver) {
            return null;
        }

        // Initialize on first run
        if (this.state.lastMarketCap.tokenA === 0) {
            this.state.lastMarketCap.tokenA = this.state.marketCap.tokenA;
            this.state.lastMarketCap.tokenB = this.state.marketCap.tokenB;
            return null;
        }

        // Calculate MC changes (percentage)
        const tokenAChange = ((this.state.marketCap.tokenA - this.state.lastMarketCap.tokenA) / this.state.lastMarketCap.tokenA) * 100;
        const tokenBChange = ((this.state.marketCap.tokenB - this.state.lastMarketCap.tokenB) / this.state.lastMarketCap.tokenB) * 100;

        console.log(`🔥 Battle Check - Round ${this.state.currentRound}`);
        console.log(`   ${config.tokens.tokenA.symbol}: ${tokenAChange.toFixed(4)}%`);
        console.log(`   ${config.tokens.tokenB.symbol}: ${tokenBChange.toFixed(4)}%`);

        const mcDifference = Math.abs(tokenAChange - tokenBChange);

        // Too close - no attack
        if (mcDifference < config.game.minMcDiffForAttack) {
            if (this.state.currentScenario !== 'idle') {
                this.state.currentScenario = 'idle';
            }
            this.state.lastMarketCap.tokenA = this.state.marketCap.tokenA;
            this.state.lastMarketCap.tokenB = this.state.marketCap.tokenB;
            return { type: 'idle' };
        }

        let attacker, defender, damage, scenario;

        // 🥊 DETERMINE ATTACKER (whoever has bigger MC gain)
        if (tokenAChange > tokenBChange) {
            attacker = 'tokenA';
            defender = 'tokenB';
            damage = mcDifference * config.game.damageMultiplier;

            // Combo system
            if (this.state.lastAttacker === 'tokenA') {
                this.state.combo.tokenA++;
                scenario = this.state.combo.tokenA >= 3 ? 'tokenACombo' : 'tokenAPump';
                if (this.state.combo.tokenA >= 3) {
                    damage *= 1.5; // Combo bonus!
                }
            } else {
                this.state.combo = { tokenA: 1, tokenB: 0 };
                scenario = 'tokenAPump';
            }
            this.state.lastAttacker = 'tokenA';

        } else {
            attacker = 'tokenB';
            defender = 'tokenA';
            damage = mcDifference * config.game.damageMultiplier;

            // Combo system
            if (this.state.lastAttacker === 'tokenB') {
                this.state.combo.tokenB++;
                scenario = this.state.combo.tokenB >= 3 ? 'tokenBCombo' : 'tokenBPump';
                if (this.state.combo.tokenB >= 3) {
                    damage *= 1.5;
                }
            } else {
                this.state.combo = { tokenA: 0, tokenB: 1 };
                scenario = 'tokenBPump';
            }
            this.state.lastAttacker = 'tokenB';
        }

        // 💔 APPLY DAMAGE
        this.state.health[defender] = Math.max(0, this.state.health[defender] - damage);
        this.state.lastDamage[defender] = Date.now();
        this.state.currentScenario = scenario;

        console.log(`⚔️  ${config.tokens[attacker].symbol} ATTACKS ${config.tokens[defender].symbol}!`);
        console.log(`   💥 Damage: ${damage.toFixed(1)}`);
        console.log(`   💚 ${config.tokens[attacker].symbol}: ${this.state.health[attacker].toFixed(1)} HP`);
        console.log(`   💔 ${config.tokens[defender].symbol}: ${this.state.health[defender].toFixed(1)} HP`);

        // 🏆 CHECK FOR ROUND WINNER
        if (this.state.health[defender] <= 0) {
            this.endRound(attacker);
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
            score: { ...this.state.score }
        };
    }

    // 🏁 END ROUND
    endRound(winner) {
        console.log(`\n🏆 Round ${this.state.currentRound} WINNER: ${config.tokens[winner].symbol}!`);

        this.state.score[winner]++;
        this.state.isRoundActive = false;

        console.log(`📊 Score: ${config.tokens.tokenA.symbol} ${this.state.score.tokenA} - ${this.state.score.tokenB} ${config.tokens.tokenB.symbol}`);

        // 👑 CHECK FOR GAME WINNER
        if (this.state.score[winner] >= config.game.roundsToWin) {
            this.state.isGameOver = true;
            this.state.winner = winner;
            const loser = winner === 'tokenA' ? 'tokenB' : 'tokenA';
            console.log(`\n🎉🎉🎉 GAME OVER! 🎉🎉🎉`);
            console.log(`👑 ${config.tokens[winner].symbol} WINS THE GAME!`);
            console.log(`📊 Final Score: ${this.state.score[winner]} - ${this.state.score[loser]}\n`);
        } else {
            // ➡️ PREPARE NEXT ROUND
            console.log(`⏱️  Next round starts in 5 seconds...\n`);
            setTimeout(() => this.startNextRound(), 5000);
        }
    }

    // ▶️ START NEXT ROUND
    startNextRound() {
        if (this.state.isGameOver) return;

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

        console.log(`\n🔔 ═══════════════════════════════════════`);
        console.log(`🔔 ROUND ${this.state.currentRound} START!`);
        console.log(`🔔 ═══════════════════════════════════════`);
        console.log(`📊 Score: ${config.tokens.tokenA.symbol} ${this.state.score.tokenA} - ${this.state.score.tokenB} ${config.tokens.tokenB.symbol}`);
        console.log(`💚 Both fighters at ${config.game.maxHealth} HP\n`);
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
            isRoundActive: true,
            isGameOver: false,
            winner: null
        };

        console.log('\n🔄 ═══════════════════════════════════════');
        console.log('🔄 GAME RESET - Starting fresh!');
        console.log('🔄 ═══════════════════════════════════════\n');
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
            health: this.state.health
        };
    }
}

// Export singleton instance
module.exports = new GameEngine();
