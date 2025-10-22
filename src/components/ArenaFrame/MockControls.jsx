import { useState } from 'react';

export function MockControls({ socketRef, setCurrentScenario }) {
    const [intensity, setIntensity] = useState(1);

    const handlePump = (token) => {
        console.log('🎮 Manual PUMP', token);

        // Send to server
        if (socketRef.current) {
            socketRef.current.emit('mock_pump', { token, intensity });
        }

        // Set video scenario - OPTIONAL, can let server handle it via battle_update
        // Uncomment if you want immediate UI response:
        // const scenario = token === 'tokenA' ? 'tokenACombo' : 'tokenBCombo';
        // setCurrentScenario(scenario, 'user-action');
    };

    const handleDump = (token) => {
        console.log('🎮 Manual DUMP', token);

        if (socketRef.current) {
            socketRef.current.emit('mock_dump', { token, intensity });
        }
    };

    const handleTestScenario = (scenario) => {
        console.log('🎮 Test scenario:', scenario);
        setCurrentScenario(scenario, 'user-action'); // ✅ Direct scenario change

        if (socketRef.current) {
            socketRef.current.emit('test_scenario', scenario);
        }
    };

    const handleReset = () => {
        if (socketRef.current) {
            socketRef.current.emit('reset_game');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.8)',
            padding: '20px',
            borderRadius: '10px',
            zIndex: 9999,
            color: 'white',
            minWidth: '300px'
        }}>
            <h3 style={{ marginTop: 0 }}>🎮 Mock Controls</h3>

            <div style={{ marginBottom: '15px' }}>
                <label>Intensity: {intensity}</label>
                <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={intensity}
                    onChange={(e) => setIntensity(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => handlePump('tokenA')} style={buttonStyle}>
                    🚀 Pump Token A
                </button>
                <button onClick={() => handlePump('tokenB')} style={buttonStyle}>
                    🚀 Pump Token B
                </button>
                <button onClick={() => handleDump('tokenA')} style={buttonStyle}>
                    📉 Dump Token A
                </button>
                <button onClick={() => handleDump('tokenB')} style={buttonStyle}>
                    📉 Dump Token B
                </button>
            </div>

            <hr style={{ margin: '15px 0', opacity: 0.3 }} />

            <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '5px' }}>
                    Direct Video Tests:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button onClick={() => handleTestScenario('tokenACombo')} style={buttonStyle}>
                        Test A Combo
                    </button>
                    <button onClick={() => handleTestScenario('tokenBCombo')} style={buttonStyle}>
                        Test B Combo
                    </button>
                    <button onClick={() => handleTestScenario('tokenAVictory')} style={buttonStyle}>
                        Test A Victory
                    </button>
                    <button onClick={() => handleTestScenario('tokenBVictory')} style={buttonStyle}>
                        Test B Victory
                    </button>
                    <button onClick={() => handleTestScenario('idle')} style={buttonStyle}>
                        Back to Idle
                    </button>
                </div>
            </div>

            <button onClick={handleReset} style={{ ...buttonStyle, background: '#dc3545', width: '100%' }}>
                🔄 Reset Game
            </button>
        </div>
    );
}

const buttonStyle = {
    padding: '10px',
    background: '#007bff',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
};
