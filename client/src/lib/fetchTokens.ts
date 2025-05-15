import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout, getMint } from '@solana/spl-token';

export interface TokenData {
  name: string;
  symbol: string;
  address: string;
  totalSupply: string;
  decimals: number;
  createdAt: string; // Since we can't get the exact creation date from the blockchain
}

/**
 * Fetches all SPL tokens owned by a wallet
 */
export async function fetchWalletTokens(
  connection: Connection,
  walletAddress: PublicKey
): Promise<TokenData[]> {
  try {
    console.log('Fetching tokens for wallet:', walletAddress.toString());
    
    // Get all token accounts owned by the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletAddress, {
      programId: TOKEN_PROGRAM_ID,
    });
    
    console.log(`Found ${tokenAccounts.value.length} token accounts`);

    // Process each token account
    const tokenPromises = tokenAccounts.value
      .filter(account => {
        // Filter out empty token accounts
        const amount = account.account.data.parsed.info.tokenAmount;
        return amount && amount.uiAmount > 0;
      })
      .map(async (account) => {
        const parsedInfo = account.account.data.parsed.info;
        const tokenMint = new PublicKey(parsedInfo.mint);
        const tokenAmount = parsedInfo.tokenAmount;
        
        // Get metadata for the token mint
        try {
          const mintInfo = await getMint(connection, tokenMint);
          
          // Attempt to get a more user-friendly name for the token
          // For tokens we've created ourselves, we can store info about them
          // in local storage and retrieve it here
          const storedTokensStr = localStorage.getItem('created_tokens');
          const storedTokens = storedTokensStr ? JSON.parse(storedTokensStr) : {};
          
          let name, symbol;
          
          // Check if we have info for this token
          if (storedTokens[tokenMint.toString()]) {
            name = storedTokens[tokenMint.toString()].name;
            symbol = storedTokens[tokenMint.toString()].symbol;
          } else {
            // If we don't know the token, use a more human-friendly format
            const shortAddr = tokenMint.toString().substring(0, 6) + '...' + tokenMint.toString().substring(tokenMint.toString().length - 4);
            name = `SPL Token ${shortAddr}`;
            symbol = `SPL${shortAddr.substring(0, 4)}`;
          }
          
          return {
            name: name,
            symbol: symbol,
            address: tokenMint.toString(),
            totalSupply: tokenAmount.uiAmountString || '0',
            decimals: mintInfo.decimals,
            createdAt: new Date().toISOString().split('T')[0], // Today's date as fallback
          };
        } catch (error) {
          console.error('Error fetching token mint info:', error);
          return null;
        }
      });
    
    // Wait for all promises to resolve
    const tokensWithNulls = await Promise.all(tokenPromises);
    
    // Filter out nulls and return valid tokens
    const tokens: TokenData[] = tokensWithNulls.filter((token): token is TokenData => token !== null);
    
    return tokens;
  } catch (error) {
    console.error('Error fetching wallet tokens:', error);
    throw error;
  }
}

/**
 * Fetches metadata for a specific token mint
 */
export async function fetchTokenMetadata(
  connection: Connection,
  mintAddress: string
): Promise<TokenData | null> {
  try {
    const mint = new PublicKey(mintAddress);
    const mintInfo = await getMint(connection, mint);
    
    // Check if we have stored metadata for this token
    const storedTokensStr = localStorage.getItem('created_tokens');
    const storedTokens = storedTokensStr ? JSON.parse(storedTokensStr) : {};
    
    let name, symbol, createdAt;
    
    if (storedTokens[mintAddress]) {
      // Use our stored metadata for tokens we created
      name = storedTokens[mintAddress].name;
      symbol = storedTokens[mintAddress].symbol;
      createdAt = storedTokens[mintAddress].createdAt;
    } else {
      // For unknown tokens, use a friendly format
      const shortAddr = mintAddress.substring(0, 6) + '...' + mintAddress.substring(mintAddress.length - 4);
      name = `SPL Token ${shortAddr}`;
      symbol = `SPL${mintAddress.substring(0, 4)}`;
      createdAt = new Date().toISOString().split('T')[0]; // Today's date as fallback
    }
    
    return {
      name: name,
      symbol: symbol,
      address: mintAddress,
      totalSupply: mintInfo.supply.toString(),
      decimals: mintInfo.decimals,
      createdAt: createdAt
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return null;
  }
}