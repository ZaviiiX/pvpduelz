import React from 'react';
import ArenaFrame from './components/ArenaFrame';
import './components/App.css';

function App() {
    return (
        <ArenaFrame
            devMode={false}
            syncMode={true}
            serverUrl="http://localhost:3001"
        />
    );
}

export default App;
