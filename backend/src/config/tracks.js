const TRACKS = {
  beginner: {
    key: "basic",
    title: "Basic Track",
    requiredSlugs: [
      "crypto-foundations",
      "wallets-keys-self-custody",
      "exchanges-and-your-first-buy",
      "blockchain-bnb-smart-chain",
      "crypto-safety-and-common-scams",
    ],
  },
  intermediate: {
    key: "intermediate",
    title: "Intermediate Track",
    requiredSlugs: [
      "ethereum-smart-contracts-tokens",
      "defi-decentralized-finance",
      "tokenomics-how-coins-are-designed",
      "trading-and-markets",
      "nfts-digital-assets",
      "daos-governance",
    ],
  },
  advanced: {
    key: "advanced",
    title: "Advanced Track",
    requiredSlugs: [
      "web3-architecture",
      "security-specialization",
      "on-chain-research",
      "regulation-and-industry",
      "building-your-own-token",
      "practical-capstone",
    ],
  },
};

module.exports = { TRACKS };