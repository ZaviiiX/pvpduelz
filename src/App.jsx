// App.jsx
import "./index.css";
import ArenaFrame from "./components/ArenaFrame";
import arenaImg from '/images/arena.png'

export default function App() {
    return (
        <div className="min-h-screen bg-[#0b0d10] text-white">
            <ArenaFrame
                arenaImage={arenaImg}
                arenaOpacity={0.8}
                arenaFit="cover"
                aspect="16/9"
                testingMode={true}
                syncMode={true}
                serverUrl="http://localhost:3001"  // ✅ Dodaj ovo!

                videos={{
                    // ✅ UPDATED KEYS - MORAJU ODGOVARATI SERVER SCENARIO
                    idle: "/videos/solana-vs-bnb.mp4",

                    // Token A videos (SOLKILL)
                    tokenAPump: "/videos/sol-winning.mp4",
                    tokenACombo: "/videos/sol-winning.mp4",
                    tokenAVictory: "/videos/sol-winning.mp4",

                    // Token B videos (PUMPSUP)
                    tokenBPump: "/videos/bnb-winning.mp4",
                    tokenBCombo: "/videos/bnb-winning.mp4",
                    tokenBVictory: "/videos/bnb-winning.mp4",

                    // Back to stance (opciono)
                    tokenABack: "/videos/solana-vs-bnb.mp4",
                    tokenBBack: "/videos/bnb-winning-backto-stance.mp4",
                }}

                cryptoConfig={{
                    enabled: false,
                }}
            />
        </div>
    );
}
