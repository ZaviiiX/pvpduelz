import React from 'react';
import ArenaFrame from './components/ArenaFrame';
import './App.css';

function App() {
    return (
        <ArenaFrame
            devMode={true}
            syncMode={true}
            serverUrl="http://localhost:3001"
        />
    );
}

export default App;
