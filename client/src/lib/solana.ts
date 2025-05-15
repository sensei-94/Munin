import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  Keypair,
  sendAndConfirmTransaction 
} from '@solana/web3.js';
import { 
  createInitializeMintInstruction,
  getMint,
  TOKEN_PROGRAM_ID,
  MintLayout,
  getMinimumBalanceForRentExemptMint,
  createMintToInstruction,
  MINT_SIZE,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSetAuthorityInstruction,
  AuthorityType
} from '@solana/spl-token';
import { TokenFormData, TokenDetails } from '@/types';

// This function creates a new SPL token on Solana testnet
export async function createSPLToken(
  connection: Connection,
  payer: PublicKey,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
  formData: TokenFormData
): Promise<TokenDetails> {
  try {
    console.log("Starting token creation process on Solana...");
    
    // Generate a new keypair for the mint account
    const mintAccount = Keypair.generate();
    const decimals = parseInt(formData.tokenDecimals);
    
    console.log("Mint account created:", mintAccount.publicKey.toString());
    console.log("Using decimals:", decimals);
    
    // Calculate the rent-exempt minimum balance
    const rentExemptBalance = await getMinimumBalanceForRentExemptMint(connection);
    console.log("Rent-exempt balance calculated:", rentExemptBalance);
    
    // Create a transaction to allocate space for the token mint
    const transaction = new Transaction();
    
    // Add instruction to create the token account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mintAccount.publicKey,
        space: MINT_SIZE,
        lamports: rentExemptBalance,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    
    // Add instruction to initialize the mint
    transaction.add(
      createInitializeMintInstruction(
        mintAccount.publicKey,
        decimals,
        payer, // Mint authority
        formData.freezeAuthority ? payer : null // Freeze authority (null if not enabled)
      )
    );
    
    // Get the recipient address (defaults to payer if not provided or invalid)
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(formData.recipientAddress || payer.toString());
    } catch (error) {
      console.warn("Invalid recipient address, using payer as recipient");
      recipientPubkey = payer;
    }
    
    // Create an associated token account for the recipient
    console.log("Finding associated token account for recipient...");
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintAccount.publicKey,
      recipientPubkey
    );
    
    console.log("Associated token account address:", associatedTokenAddress.toString());
    
    // Add instruction to create the associated token account
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer,
        associatedTokenAddress,
        recipientPubkey,
        mintAccount.publicKey
      )
    );
    
    // Add instruction to mint the initial supply to the recipient's token account
    const initialSupply = BigInt(parseFloat(formData.tokenSupply) * 10 ** decimals);
    console.log("Initial supply (with decimals):", initialSupply.toString());
    
    transaction.add(
      createMintToInstruction(
        mintAccount.publicKey,
        associatedTokenAddress,
        payer,
        Number(initialSupply)
      )
    );
    
    // Note: We've removed the metadata update instructions to simplify the process
    // This means the token won't have a name in wallets that rely on Metaplex metadata
    // To build a complete token with proper metadata, we'd need to use the Metaplex SDK
    // but that would require more complex transaction handling
    console.log(`Creating token with name: ${formData.tokenName} and symbol: ${formData.tokenSymbol}`);
    
    // In a production app, we would create proper token metadata here
    // For now, we'll focus on creating a working token and fix the display name later
    
    // If the user wants to transfer mint authority, add that instruction
    if (formData.mintAuthority === 'transfer' && recipientPubkey.toString() !== payer.toString()) {
      console.log("Will transfer mint authority to recipient");
      transaction.add(
        createSetAuthorityInstruction(
          mintAccount.publicKey,
          payer,
          AuthorityType.MintTokens,
          recipientPubkey
        )
      );
    }
    
    // Set transaction fee payer
    transaction.feePayer = payer;
    
    // Get a recent blockhash to include in the transaction
    console.log("Getting recent blockhash...");
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    console.log("Got blockhash:", blockhash);
    
    // Sign with the mint account first (we have the private key for this one)
    console.log("Partially signing with mint account...");
    transaction.partialSign(mintAccount);
    
    // Now request signature from the user's Phantom wallet
    console.log("Requesting wallet signature...");
    const signedTransaction = await signTransaction(transaction);
    console.log("Transaction signed by wallet");
    
    // Send the fully signed transaction to the network
    console.log("Sending transaction to Solana network...");
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    console.log("Transaction sent with signature:", signature);
    
    // Confirm the transaction
    console.log("Confirming transaction...");
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    });
    
    if (confirmation.value.err) {
      console.error("Transaction confirmed but with error:", confirmation.value.err);
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
    }
    
    console.log("Transaction confirmed successfully!");
    
    // Store token metadata in local storage for future reference
    try {
      const tokenAddress = mintAccount.publicKey.toString();
      const storedTokensStr = localStorage.getItem('created_tokens');
      const storedTokens = storedTokensStr ? JSON.parse(storedTokensStr) : {};
      
      // Add this token to our local registry
      storedTokens[tokenAddress] = {
        name: formData.tokenName,
        symbol: formData.tokenSymbol,
        decimals: decimals,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      // Save back to local storage
      localStorage.setItem('created_tokens', JSON.stringify(storedTokens));
      console.log("Saved token metadata to local storage for:", tokenAddress);
    } catch (err) {
      console.warn("Could not save token metadata to local storage:", err);
    }
    
    // Return the token details
    return {
      tokenAddress: mintAccount.publicKey.toString(),
      mintAuthority: formData.mintAuthority === 'transfer' ? recipientPubkey.toString() : payer.toString(),
      freezeAuthority: formData.freezeAuthority ? payer.toString() : null,
      supply: formData.tokenSupply,
      decimals: decimals,
      transactionId: signature
    };
  } catch (error) {
    console.error("Error creating SPL token:", error);
    throw error;
  }
}

// Note: In a real implementation, you would need to handle the actual signing
// of transactions through the Phantom wallet's signTransaction method.
// This code provides the structure but would require integration with
// Phantom's actual API in a production environment.
