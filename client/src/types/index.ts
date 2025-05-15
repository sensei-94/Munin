export interface TokenFormData {
  tokenName: string;
  tokenSymbol: string;
  tokenDescription?: string;
  tokenSupply: string;
  tokenDecimals: string;
  mintAuthority: 'keep' | 'transfer';
  recipientAddress: string;
  freezeAuthority: boolean;
}

export interface TokenDetails {
  tokenAddress: string;
  mintAuthority: string;
  freezeAuthority: string | null;
  supply: string;
  decimals: number;
  transactionId: string;
}

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export interface TokenCreationResponse {
  success: boolean;
  tokenAddress: string;
  transactionId: string;
}
