import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from 'plaid';
import { db } from './db';
import { plaidItems, stablecoinMints, insertPlaidItemSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Configure Plaid client
console.log("Setting up Plaid client with environment:", process.env.NODE_ENV);
console.log("PLAID_CLIENT_ID exists:", !!process.env.PLAID_CLIENT_ID);
console.log("PLAID_SECRET exists:", !!process.env.PLAID_SECRET);

// Fix potential issues with keys (trimming whitespace)
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID?.trim();
const PLAID_SECRET = process.env.PLAID_SECRET?.trim();

console.log("Cleaned Plaid Client ID length:", PLAID_CLIENT_ID?.length);
console.log("Cleaned Plaid Secret length:", PLAID_SECRET?.length);

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use sandbox for development
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

/**
 * Creates a Plaid link token for a user to connect their bank account
 * @param walletAddress - The user's Solana wallet address
 * @returns A link token that can be used to initialize Plaid Link
 */
export async function createLinkToken(walletAddress: string) {
  try {
    console.log(`Creating Plaid link token for wallet: ${walletAddress}`);
    
    // Create a simplified link token configuration specifically for sandbox
    // with minimal required fields to avoid type issues
    const tokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: walletAddress, // Use the wallet address as the unique identifier
      },
      client_name: 'SolStable',
      products: ['auth'] as any, // Using 'auth' only and 'any' type to prevent type errors
      country_codes: ['US'] as any,
      language: 'en'
    });

    if (tokenResponse.data && tokenResponse.data.link_token) {
      console.log('Link token created successfully:', tokenResponse.data.link_token.slice(0, 10) + '...');
      return tokenResponse.data;
    } else {
      throw new Error('Invalid link token response');
    }
  } catch (error: any) {
    console.error('Error creating link token:', error);
    console.error('Error details:', error.response?.data);
    throw error;
  }
}

/**
 * Exchanges a public token for an access token and gets bank account info
 * @param publicToken - The public token received from Plaid Link
 * @param walletAddress - The user's Solana wallet address
 * @returns The Plaid item ID and access token
 */
export async function exchangePublicToken(publicToken: string, walletAddress: string) {
  try {
    console.log(`Exchanging public token for wallet: ${walletAddress}`);
    
    // Exchange the public token for an access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;
    
    console.log(`Successfully exchanged public token for access token: ${accessToken.substring(0, 5)}...`);

    // Get the institution information
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });
    const institutionId = itemResponse.data.item.institution_id;

    // Get institution name
    let institutionName = 'Sandbox Bank';
    if (institutionId) {
      try {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ['US'] as any,
        });
        institutionName = institutionResponse.data.institution.name;
      } catch (instErr) {
        console.log('Could not get institution name, using default');
      }
    }

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Get the first checking or savings account
    const account = accountsResponse.data.accounts.find(
      (acc) => acc.type === 'depository' && 
      (acc.subtype === 'checking' || acc.subtype === 'savings')
    ) || accountsResponse.data.accounts[0]; // Fallback to first account

    if (!account) {
      throw new Error('No suitable account found');
    }

    // Get the account balance
    const balanceResponse = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
      options: {
        account_ids: [account.account_id],
      },
    });

    const accountBalance = balanceResponse.data.accounts[0].balances;
    
    // Try to store in database but handle errors gracefully
    try {
      // Store the Plaid item information in the database
      const plaidItem = {
        wallet_address: walletAddress,
        item_id: itemId,
        access_token: accessToken,
        institution_id: institutionId || null,
        institution_name: institutionName || null,
        account_id: account.account_id,
        account_name: account.name,
        account_mask: account.mask,
        current_balance: accountBalance.current ? accountBalance.current.toString() : null,
        available_balance: accountBalance.available ? 
          accountBalance.available.toString() : 
          (accountBalance.current ? accountBalance.current.toString() : null),
      };

      // First, check if there's an existing item for this wallet
      const existingItem = await db.select().from(plaidItems)
        .where(eq(plaidItems.wallet_address, walletAddress))
        .limit(1);

      if (existingItem.length > 0) {
        // Update the existing item
        await db.update(plaidItems)
          .set(plaidItem)
          .where(eq(plaidItems.id, existingItem[0].id));
      } else {
        // Insert a new item
        await db.insert(plaidItems).values(plaidItem);
      }
      
      console.log('Successfully stored Plaid item in database');
    } catch (dbError) {
      // If database operations fail, log the error but continue
      console.error('Database error when storing Plaid item - continuing anyway:', dbError);
    }

    // Always return account info even if database operations fail
    // Convert all values to clean, valid formats
    const responseData = {
      itemId: String(itemId || ""),
      accessToken: String(accessToken || ""),
      institutionName: String(institutionName || "Your Bank"),
      accountName: String(account.name || "Bank Account"),
      accountMask: String(account.mask || "0000"),
      currentBalance: accountBalance.current !== undefined && accountBalance.current !== null
        ? Number(accountBalance.current) // Convert to number
        : 1000, // Sandbox fallback
      availableBalance: accountBalance.available !== undefined && accountBalance.available !== null
        ? Number(accountBalance.available) // Convert to number
        : (accountBalance.current !== undefined && accountBalance.current !== null 
            ? Number(accountBalance.current) 
            : 1000) // Sandbox fallback
    };
    
    // Log the clean data
    console.log("Returning clean account data:", JSON.stringify({
      ...responseData,
      accessToken: responseData.accessToken.substring(0, 5) + "..." // Don't log full token
    }));
    
    return responseData;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
}

/**
 * Gets the bank account information for a user
 * @param walletAddress - The user's Solana wallet address
 * @returns The bank account information
 */
export async function getBankAccountInfo(walletAddress: string) {
  try {
    console.log(`Getting bank account info for wallet: ${walletAddress}`);
    
    // Step 1: Try to get the Plaid item from the database
    try {
      const plaidItem = await db.select().from(plaidItems)
        .where(eq(plaidItems.wallet_address, walletAddress))
        .limit(1);

      if (plaidItem.length === 0) {
        console.log('No linked bank account found for wallet address');
        return null;
      }

      const item = plaidItem[0];

      // Step 2: Refresh the account balance from Plaid API
      const balanceResponse = await plaidClient.accountsBalanceGet({
        access_token: item.access_token,
        options: {
          account_ids: [item.account_id!],
        },
      });

      const accountBalance = balanceResponse.data.accounts[0].balances;

      // Step 3: Try to update the balance in the database, but don't fail if this step fails
      try {
        await db.update(plaidItems)
          .set({
            current_balance: accountBalance.current ? accountBalance.current.toString() : null,
            available_balance: accountBalance.available ? 
              accountBalance.available.toString() : 
              (accountBalance.current ? accountBalance.current.toString() : null),
            last_updated: new Date(),
          })
          .where(eq(plaidItems.id, item.id));
      } catch (dbUpdateError) {
        // If database update fails, log the error but continue with returning the data
        // This way, the user can still see their account info even if the database update fails
        console.error('Failed to update balance in database, but continuing:', dbUpdateError);
      }

      // Return the account information regardless of whether the update succeeded
      return {
        institutionName: item.institution_name,
        accountName: item.account_name,
        accountMask: item.account_mask,
        currentBalance: accountBalance.current,
        availableBalance: accountBalance.available || accountBalance.current,
      };
      
    } catch (dbError) {
      // If database access fails completely, throw an error to be caught by the outer try-catch
      console.error('Database error when getting bank account info:', dbError);
      throw new Error('Database error: Unable to access bank account information');
    }
  } catch (error) {
    console.error('Error getting bank account info:', error);
    throw error;
  }
}

/**
 * Updates the database with minting information
 * @param walletAddress - The user's Solana wallet address
 * @param tokenAddress - The token address that was minted
 * @param amount - The amount of tokens minted
 * @param status - The status of the minting process
 * @param transactionId - The transaction ID (optional)
 */
export async function recordStablecoinMint(
  walletAddress: string,
  tokenAddress: string,
  amount: number,
  status: string,
  transactionId?: string
) {
  try {
    // Get the Plaid item ID
    const plaidItem = await db.select().from(plaidItems)
      .where(eq(plaidItems.wallet_address, walletAddress))
      .limit(1);

    if (plaidItem.length === 0) {
      throw new Error('No Plaid item found for wallet address');
    }

    // Insert the minting record
    await db.insert(stablecoinMints).values({
      wallet_address: walletAddress,
      plaid_item_id: plaidItem[0].id,
      token_address: tokenAddress,
      amount_minted: amount.toString(), // Convert number to string
      status,
      transaction_id: transactionId || null,
      completed_at: status === 'completed' ? new Date() : null,
    });
  } catch (error) {
    console.error('Error recording stablecoin mint:', error);
    throw error;
  }
}