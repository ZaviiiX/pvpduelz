import React from 'react';
import ArenaFrame from './components/ArenaFrame';
import './components/App.css';

function App() {
    return (
        <ArenaFrame
            devMode={false}
            syncMode={true}
            serverUrl="https://arena-server-ua44.onrender.com"
        />
    );
}

export default App;
