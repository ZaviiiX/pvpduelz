import React from 'react';
import ArenaFrame from './components/ArenaFrame';
import './components/App.css';

function App() {
    return (
        <ArenaFrame
            devMode={false}
            syncMode={true}
            serverUrl="https://arena-server-gh2h.onrender.com"
        />
    );
}

export default App;
