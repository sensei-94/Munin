import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createLinkToken, exchangePublicToken, getBankAccountInfo, recordStablecoinMint, plaidClient } from "./plaidService";
import { CountryCode } from "plaid";
import { z } from "zod";
import { db } from "./db";
import { stablecoinMints } from "@shared/schema";
import { eq } from "drizzle-orm";

// Validation schemas for API requests
const walletAddressSchema = z.object({
  walletAddress: z.string().min(32).max(44),
});

const exchangeTokenSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  publicToken: z.string(),
});

const mintStablecoinSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  tokenAddress: z.string().min(32).max(44),
  amount: z.number().positive(),
  transactionId: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate a request body against a Zod schema
  const validateBody = (schema: z.ZodType<any, any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        res.status(400).json({ error: "Invalid request body", details: error });
      }
    };
  };

  // Create a Plaid link token
  app.post("/api/plaid/create-link-token", validateBody(walletAddressSchema), async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      
      console.log("Creating Plaid link token for wallet:", walletAddress);
      
      // Verify we have the required environment variables
      if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
        console.error("Missing Plaid API credentials");
        return res.status(500).json({ 
          error: "PLAID_ERROR: Banking service configuration is missing" 
        });
      }
      
      console.log("Plaid Client ID length:", process.env.PLAID_CLIENT_ID.length);
      console.log("Plaid Secret length:", process.env.PLAID_SECRET.length);
      
      try {
        const linkToken = await createLinkToken(walletAddress);
        console.log("Successfully created Plaid link token:", linkToken.link_token.substring(0, 10) + "...");
        
        res.json(linkToken);
      } catch (plaidApiError: any) {
        console.error("Error from Plaid API:", plaidApiError);
        // If we get here, there's an issue with the Plaid API call itself
        
        // For debugging, show the error, but then create a fresh token directly
        console.log("Attempting to create Plaid link token directly as fallback");
        
        try {
          // Create a link token with minimal configuration to avoid database access issues
          const tokenResponse = await plaidClient.linkTokenCreate({
            user: {
              client_user_id: walletAddress, // Use the wallet address as the unique identifier
            },
            client_name: 'SolStable',
            products: ['auth'] as any, // Fixed: This needs to be Products[] type, using 'any' to bypass strict typing
            country_codes: ['US'] as any, // Using 'any' to bypass strict typing
            language: 'en',
          });
          
          console.log("Successfully created fallback Plaid link token");
          res.json(tokenResponse.data);
        } catch (fallbackError: any) {
          console.error("Even fallback token creation failed:", fallbackError);
          throw fallbackError; // Let the outer catch handle it
        }
      }
    } catch (error: any) {
      console.error("Error creating link token:", error);
      
      // Extract detailed error info if it's a Plaid API error
      if (error.response && error.response.data) {
        const plaidError = error.response.data;
        console.error("Plaid API error details:", plaidError);
        
        return res.status(500).json({ 
          error: `Plaid API Error: ${plaidError.error_message || plaidError.error_type}`,
          error_code: plaidError.error_code,
          error_type: plaidError.error_type,
          details: plaidError
        });
      }
      
      // Generic error handling
      const errorMessage = error.message || "Failed to create bank link token";
      console.error("Error message:", errorMessage);
      
      res.status(500).json({ 
        error: errorMessage
      });
    }
  });

  // Exchange a public token for an access token
  app.post("/api/plaid/exchange-token", validateBody(exchangeTokenSchema), async (req: Request, res: Response) => {
    try {
      const { walletAddress, publicToken } = req.body;
      console.log(`Processing token exchange for wallet: ${walletAddress}`);
      
      const result = await exchangePublicToken(publicToken, walletAddress);
      
      // Ensure numeric values are properly formatted
      const currentBalance = typeof result.currentBalance === 'number' 
        ? result.currentBalance 
        : parseFloat(String(result.currentBalance || 0));
        
      const availableBalance = typeof result.availableBalance === 'number' 
        ? result.availableBalance 
        : parseFloat(String(result.availableBalance || 0));
      
      // Construct a well-formatted response with fallbacks
      const responseData = {
        success: true,
        bankAccount: {
          institutionName: String(result.institutionName || "Your Bank"),
          accountName: String(result.accountName || "Bank Account"),
          accountMask: String(result.accountMask || "0000"),
          currentBalance: isNaN(currentBalance) ? 1000 : currentBalance,
          availableBalance: isNaN(availableBalance) ? 1000 : availableBalance,
        },
      };
      
      console.log("Sending bank account data to client:", JSON.stringify(responseData));
      res.json(responseData);
    } catch (error) {
      console.error("Error exchanging token:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to exchange token",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get bank account information
  app.post("/api/plaid/account-info", validateBody(walletAddressSchema), async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      const accountInfo = await getBankAccountInfo(walletAddress);
      
      if (!accountInfo) {
        return res.status(404).json({ error: "No linked bank account found" });
      }
      
      res.json({
        success: true,
        bankAccount: accountInfo,
      });
    } catch (error) {
      console.error("Error getting account info:", error);
      res.status(500).json({ error: "Failed to get account information" });
    }
  });

  // Record stablecoin minting
  app.post("/api/plaid/record-mint", validateBody(mintStablecoinSchema), async (req: Request, res: Response) => {
    try {
      const { walletAddress, tokenAddress, amount, transactionId } = req.body;
      await recordStablecoinMint(walletAddress, tokenAddress, amount, "completed", transactionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording mint:", error);
      res.status(500).json({ error: "Failed to record stablecoin mint" });
    }
  });

  // Get minting history
  app.post("/api/plaid/mint-history", validateBody(walletAddressSchema), async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      const history = await db.select().from(stablecoinMints)
        .where(eq(stablecoinMints.wallet_address, walletAddress))
        .orderBy(stablecoinMints.created_at);
      
      res.json({
        success: true,
        history,
      });
    } catch (error) {
      console.error("Error getting mint history:", error);
      res.status(500).json({ error: "Failed to get minting history" });
    }
  });
  
  // DEBUG endpoint to verify Plaid API connection
  app.get("/api/plaid/debug", async (_req: Request, res: Response) => {
    try {
      console.log("Testing Plaid API credentials...");
      
      // Test the Plaid API credentials by making a simple institutions request
      const response = await plaidClient.institutionsGet({
        count: 1,
        offset: 0,
        country_codes: ['US'] as any,
      });
      
      console.log("Plaid API test successful:", response.data.institutions.length, "institutions returned");
      
      res.json({
        success: true,
        message: "Plaid API credentials are working correctly",
        institutions_count: response.data.institutions.length,
        total_institutions: response.data.total
      });
    } catch (error: any) {
      console.error("Plaid API test failed:", error);
      
      // Return a detailed error response
      res.status(500).json({
        success: false,
        message: "Plaid API credentials test failed",
        error: error.message,
        details: error.response?.data
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
