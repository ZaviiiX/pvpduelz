// utils/cryptoAPI.js
// 🔥 Template za crypto API integraciju

/**
 * Fetch token data from CoinGecko / DexScreener / Jupiter
 * @param {string} tokenAddress - Contract address tokena
 * @param {string} chain - "solana" ili "bsc"
 */
export async function fetchTokenData(tokenAddress, chain = "solana") {
  try {
    // OPCIJA 1: DexScreener API (besplatno, ali ima rate limit)
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0]; // Uzmi najlikvidniji par
      return {
        price: parseFloat(pair.priceUsd),
        change24h: parseFloat(pair.priceChange.h24),
        marketCap: parseFloat(pair.fdv || 0),
        volume24h: parseFloat(pair.volume.h24),
        liquidity: parseFloat(pair.liquidity?.usd || 0),
      };
    }

    // OPCIJA 2: CoinGecko API (treba API key za više requesta)
    // const response = await fetch(
    //   `https://api.coingecko.com/api/v3/coins/${chain}/contract/${tokenAddress}`,
    //   {
    //     headers: {
    //       'x-cg-demo-api-key': 'YOUR_API_KEY'
    //     }
    //   }
    // );

    // OPCIJA 3: Jupiter API (samo za Solana)
    // if (chain === "solana") {
    //   const response = await fetch(
    //     `https://price.jup.ag/v4/price?ids=${tokenAddress}`
    //   );
    //   const data = await response.json();
    //   // ...
    // }

    throw new Error("No data found");
  } catch (error) {
    console.error(`Error fetching ${chain} token data:`, error);
    return null;
  }
}

/**
 * Helper funkcija za određivanje scenarija na temelju market data
 */
export function determineScenario(solChange, bnbChange, config) {
  const { pumpThreshold, dumpThreshold } = config;

  // Oba pumpa
  if (solChange > pumpThreshold && bnbChange > pumpThreshold) {
    return "bothPump";
  }
  
  // Oba dump
  if (solChange < dumpThreshold && bnbChange < dumpThreshold) {
    return "bothDump";
  }
  
  // Sol pumpa
  if (solChange > pumpThreshold) {
    return "solPump";
  }
  
  // BNB pumpa
  if (bnbChange > pumpThreshold) {
    return "bnbPump";
  }
  
  // Sol dump
  if (solChange < dumpThreshold) {
    return "solDump";
  }
  
  // BNB dump
  if (bnbChange < dumpThreshold) {
    return "bnbDump";
  }
  
  // Idle (bez značajnih promjena)
  return "idle";
}

/**
 * WebSocket stream za real-time price updates (advanced)
 */
export function createPriceStream(tokenAddress, chain, onUpdate) {
  // Za production možeš koristiti WebSocket za real-time data
  // Ovo je placeholder za WebSocket implementaciju
  
  // Primjer: Birdeye WebSocket za Solana
  // const ws = new WebSocket('wss://public-api.birdeye.so/socket');
  // ws.onmessage = (event) => {
  //   const data = JSON.parse(event.data);
  //   onUpdate(data);
  // };
  
  console.log(`WebSocket stream created for ${tokenAddress} on ${chain}`);
  return () => console.log("WebSocket closed");
}

// Export all
export default {
  fetchTokenData,
  determineScenario,
  createPriceStream,
};