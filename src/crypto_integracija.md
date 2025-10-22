🚀 Crypto Integration Upute
Trenutno stanje

✅ Video sistem spreman (idle video se vrti u loopu)
✅ Struktura za različite video scenarije postavljena
✅ API integracija pripremljena (samo treba uključiti)

Kad launchaš tokene, napravi sljedeće:
1. Dodaj video fajlove u /public/videos/
Trebat će ti ovih 7 videa:
/public/videos/
  ├── solana-vs-bnb.mp4        (IDLE - default video)
  ├── sol-winning.mp4           (Sol pumpa +5%+)
  ├── bnb-winning.mp4           (BNB pumpa +5%+)
  ├── sol-losing.mp4            (Sol dump -5%+)
  ├── bnb-losing.mp4            (BNB dump -5%+)
  ├── both-pumping.mp4          (Oba pumpa)
  └── both-dumping.mp4          (Oba dump)
2. Uključi crypto config u App.jsx
javascriptcryptoConfig={{
  enabled: true, // ← PROMIJENI U TRUE!
  solanaTokenAddress: "TVOJ_PUMPFUN_TOKEN_ADDRESS",
  bnbTokenAddress: "TVOJ_BNB_TOKEN_ADDRESS",
  checkInterval: 30000, // Provjera svakih 30s
  pumpThreshold: 5,     // Video se mijenja na +5%
  dumpThreshold: -5,    // Video se mijenja na -5%
}}
3. Implementiraj API pozive
U ArenaFrame.jsx zamijeni TODO komentar sa pravim API pozivom:
javascript// Umjesto placeholder logike, dodaj:
import { fetchTokenData, determineScenario } from '../utils/cryptoAPI';

const checkMarketData = async () => {
  const solData = await fetchTokenData(
    cryptoConfig.solanaTokenAddress, 
    "solana"
  );
  const bnbData = await fetchTokenData(
    cryptoConfig.bnbTokenAddress, 
    "bsc"
  );

  if (solData && bnbData) {
    setMarketData({
      sol: solData,
      bnb: bnbData
    });

    const scenario = determineScenario(
      solData.change24h,
      bnbData.change24h,
      cryptoConfig
    );
    setCurrentScenario(scenario);
  }
};
4. API Opcije
DexScreener (preporučeno - besplatno):
javascriptconst response = await fetch(
  `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
);
CoinGecko (treba API key):
javascriptconst response = await fetch(
  `https://api.coingecko.com/api/v3/coins/solana/contract/${address}`,
  { headers: { 'x-cg-demo-api-key': 'YOUR_KEY' } }
);
Jupiter (samo Solana):
javascriptconst response = await fetch(
  `https://price.jup.ag/v4/price?ids=${tokenAddress}`
);
5. Testiranje prije launcha
Možeš testirati sa random token adresama:
javascript// Test sa postojećim tokenima
solanaTokenAddress: "So11111111111111111111111111111111111111112", // SOL
bnbTokenAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
6. Rate Limiting
DexScreener ima rate limit:

300 requests/minute
Preporuka: provjera svakih 30-60 sekundi

7. WebSocket za real-time (advanced)
Ako želiš instant reakciju:
javascript// Birdeye WebSocket
const ws = new WebSocket('wss://public-api.birdeye.so/socket');
Video Scenariji
ScenarioUvjetVideoidleNormal stanjesolana-vs-bnb.mp4solPumpSol +5%+sol-winning.mp4bnbPumpBNB +5%+bnb-winning.mp4solDumpSol -5%+sol-losing.mp4bnbDumpBNB -5%+bnb-losing.mp4bothPumpOba +5%+both-pumping.mp4bothDumpOba -5%+both-dumping.mp4
Prilagodbe
Možeš mijenjati threshold vrijednosti:
javascriptpumpThreshold: 10,   // Video se mijenja na +10%
dumpThreshold: -10,  // Video se mijenja na -10%
checkInterval: 60000 // Provjera svake minute
Troubleshooting
Video se ne mijenja:

Provjeri da li je enabled: true
Provjeri da li API vraća podatke (console.log)
Provjeri da li video fajlovi postoje

Rate limit error:

Povećaj checkInterval na 60000 (1 minuta)
Koristi WebSocket umjesto polling

CORS error:

DexScreener dozvoljava CORS
Za produkciju, napravi backend proxy


Kada launchaš tokene, samo:

Dodaj token addresses
Postavi enabled: true
Upload videe
Ready to go! 🚀