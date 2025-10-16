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
        // Video sources za različite scenarije
        videos={{
          idle: "/videos/solana-vs-bnb.mp4",
          solPump: "/videos/sol-winning.mp4",
          bnbPump: "/videos/bnb-winning.mp4",
          solDump: "/videos/sol-losing.mp4",
          bnbDump: "/videos/bnb-losing.mp4",
          bothPump: "/videos/both-pumping.mp4",
          bothDump: "/videos/both-dumping.mp4",
          // 🧪 PLACEHOLDER - koristi idle video dok ne napraviš prave back videe
          solBack: "/videos/solana-vs-bnb.mp4",
          bnbBack: "/videos/solana-vs-bnb.mp4",
          bothBack: "/videos/solana-vs-bnb.mp4",
        }}
        // Crypto config - ZASAD ISKLJUČENO, uključit ćeš kasnije
        cryptoConfig={{
          enabled: false,
          solanaTokenAddress: "",
          bnbTokenAddress: "",
          checkInterval: 30000,
          pumpThreshold: 5,
          dumpThreshold: -5,
        }}
      />
    </div>
  );
}