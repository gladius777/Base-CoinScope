const ROOT_URL = "https://base-coin-scope.vercel.app"; 

export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },

  miniapp: {
    version: "1",
    name: "CoinScope",
    subtitle: "Coin price tracker",
    description:
      "Coin price checker, shows current prices, market cap, volume, percentage price changes by coin, and the fear and greed index.",

    homeUrl: ROOT_URL,

    iconUrl: `${ROOT_URL}/icon.png`,
    screenshotUrls: [`${ROOT_URL}/screenshot1.png`],

    primaryCategory: "finance",
    tags: ["base", "crypto", "tracker"]
  }
};

