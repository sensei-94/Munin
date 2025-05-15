import { TokenFormData } from "@/types";

// Token form validation
export const validateTokenName = (name: string): string | null => {
  if (!name.trim()) return "Token name is required";
  if (name.length > 50) return "Token name must be less than 50 characters";
  return null;
};

export const validateTokenSymbol = (symbol: string): string | null => {
  if (!symbol.trim()) return "Token symbol is required";
  if (symbol.length > 10) return "Token symbol must be less than 10 characters";
  // Check for uppercase alphanumeric characters only
  if (!/^[A-Z0-9]+$/.test(symbol)) return "Token symbol must contain only uppercase letters and numbers";
  return null;
};

export const validateTokenSupply = (supply: string): string | null => {
  if (!supply) return "Token supply is required";
  const num = Number(supply.replace(/,/g, ''));
  if (isNaN(num)) return "Supply must be a valid number";
  if (num <= 0) return "Supply must be greater than 0";
  if (num > Number.MAX_SAFE_INTEGER) return "Supply is too high";
  return null;
};

export const validateRecipientAddress = (address: string): string | null => {
  if (!address.trim()) return null; // Optional field, can be empty
  try {
    // Basic Solana address validation - should be 44 characters
    if (!/^[A-Za-z0-9]{32,44}$/.test(address.trim())) {
      return "Invalid Solana address format";
    }
    return null;
  } catch (error) {
    return "Invalid Solana address";
  }
};

export const validateTokenForm = (formData: TokenFormData): Record<string, string | null> => {
  return {
    tokenName: validateTokenName(formData.tokenName),
    tokenSymbol: validateTokenSymbol(formData.tokenSymbol),
    tokenSupply: validateTokenSupply(formData.tokenSupply),
    recipientAddress: validateRecipientAddress(formData.recipientAddress),
  };
};

// Get the number of decimal places based on token type
export const getDefaultDecimals = (tokenType: string): string => {
  switch (tokenType) {
    case "6": // USDC-like
      return "6";
    case "9": // Standard SPL
      return "9";
    case "8": // BTC-like
      return "8";
    case "18": // ETH-like
      return "18";
    case "0": // No decimals
      return "0";
    default:
      return "6";
  }
};
