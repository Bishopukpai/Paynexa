// ==========================================
// 📍 BASE NETWORK CONTRACT CONFIGURATIONS (2026)
// ==========================================

export interface NetworkConfig {
  CHAIN_ID: number;
  GATEWAY_ADDRESS: `0x${string}`;
  USDT_ADDRESS: `0x${string}`;
  TOKEN_DECIMALS: number;
}

// 🧪 BASE SEPOLIA TESTNET CONFIGURATION
export const TESTNET_CONFIG: NetworkConfig = {
  CHAIN_ID: 84532, 
  GATEWAY_ADDRESS: "0xA17F5ad4056e531E2E0F51485FF8fabf7602592A",
  // Ensure your test users are using this exact faucet variant
  USDT_ADDRESS: "0x036cbd53842c5426634e7929541ec2318f3dcf7e", 
  TOKEN_DECIMALS: 6,
};

// 🚀 BASE PRODUCTION MAINNET CONFIGURATION
export const MAINNET_CONFIG: NetworkConfig = {
  CHAIN_ID: 8453, 
  GATEWAY_ADDRESS: "0xYourActualBaseMainnetGatewayContractAddressHere",
  // 🪙 Updated to standard Native USDT on Base Mainnet for maximum user compatibility
  USDT_ADDRESS: "0xfb9186570add009a657a436526c5210038df13ed", 
  TOKEN_DECIMALS: 6,
};

export const getActiveConfig = (mode: 'testnet' | 'production'): NetworkConfig => {
  return mode === 'production' ? MAINNET_CONFIG : TESTNET_CONFIG;
};

// ==========================================
// 📄 COMPREHENSIVE SMART CONTRACT ABIs
// ==========================================

export const GATEWAY_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "customer", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "merchant", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "totalAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256" }
    ],
    "name": "PaymentProcessed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "FEE_PERCENT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" },
      { "internalType": "address", "name": "_merchant", "type": "address" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "payMerchant",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformWallet",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  // ➕ Added Administrative Owner check capacity
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const USDT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;