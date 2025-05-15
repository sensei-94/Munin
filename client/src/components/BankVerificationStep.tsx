import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlaidLink } from 'react-plaid-link';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, Building2, Shield, AlertTriangle, Building } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { TokenFormData } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BankVerificationStepProps {
  tokenFormData: TokenFormData;
  onBankVerified: (bankInfo: BankAccount) => void;
  onBack: () => void;
}

export interface BankAccount {
  institutionName: string;
  accountName: string;
  accountMask: string;
  currentBalance: number;
  availableBalance: number;
}

export default function BankVerificationStep({
  tokenFormData,
  onBankVerified,
  onBack
}: BankVerificationStepProps) {
  const { publicKey } = useSolanaWallet();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to check if a bank account is already linked
  const checkExistingBankAccount = useCallback(async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For a new user, there will be no linked bank account, which is normal
      // We'll handle the 404 response in the catch block
      const response = await apiRequest<{ success: boolean; bankAccount: BankAccount }>('/api/plaid/account-info', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: publicKey.toString()
        })
      });
      
      if (response && response.success && response.bankAccount) {
        console.log('Successfully fetched existing bank account:', response.bankAccount.institutionName);
        setBankAccount(response.bankAccount);
        onBankVerified(response.bankAccount);
      } else {
        // Should not reach here, but just in case
        console.log('No bank account data in response, requesting link token');
        await requestLinkToken();
      }
    } catch (err: any) {
      console.log('Bank account check result:', err);
      
      // If we get a 404, no linked account was found - this is expected for new users
      if (err.status === 404) {
        console.log('No linked account found (404) - this is normal for new users');
        setError(null); // Clear any previous errors
        
        // Request link token for bank connection
        await requestLinkToken();
      } else {
        // Only show error for unexpected issues
        console.error('Unexpected error checking bank account:', err);
        setError('Could not connect to banking service. Please try again later.');
        toast({
          title: 'Connection Issue',
          description: 'There was a problem connecting to the banking service. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, toast, onBankVerified]);

  // Function to request a Plaid link token
  const requestLinkToken = useCallback(async () => {
    if (!publicKey) {
      console.log('No public key available, cannot request link token');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    console.log('Requesting Plaid link token for wallet:', publicKey.toString());
    
    try {
      // Make the API request to create a link token
      const response = await apiRequest<{ link_token: string }>('/api/plaid/create-link-token', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: publicKey.toString()
        })
      });
      
      // Check if we have a valid link token
      if (response && response.link_token) {
        console.log('Successfully received link token');
        setLinkToken(response.link_token);
      } else {
        throw new Error('Invalid response from create-link-token endpoint');
      }
    } catch (err: any) {
      console.error('Failed to create link token:', err);
      
      // Provide helpful error message
      if (err.message?.includes('INVALID_API_KEYS') || err.message?.includes('PLAID_ERROR')) {
        setError('The banking service is not properly configured. Please contact support.');
      } else {
        setError('Unable to connect to banking service. Please try again later.');
      }
      
      toast({
        title: 'Banking Service Error',
        description: 'Could not establish connection with your bank. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, toast]);

  // Skip account check and directly get a link token to display Connect Bank button
  useEffect(() => {
    let isMounted = true;
    
    const initializeComponent = async () => {
      if (!publicKey || !isMounted) return;
      
      try {
        console.log("Initializing Bank Verification Step");
        // Skip database checks and go directly to requesting a link token
        setIsLoading(true);
        if (isMounted) {
          try {
            await requestLinkToken();
            console.log("Link token requested successfully on init");
          } catch (tokenErr) {
            console.error("Failed to get initial link token:", tokenErr);
            setError("Could not establish connection with banking service. Please click Connect Bank to try again.");
          } finally {
            if (isMounted) {
              setIsLoading(false);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing bank verification step:', err);
        if (isMounted) {
          setIsLoading(false);
          setError("Could not initialize banking verification. Please try again.");
        }
      }
    };
    
    initializeComponent();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [publicKey]); // Only re-run if publicKey changes

  // Handler for successful Plaid Link flow
  const onSuccess = useCallback(async (publicToken: string, metadata: any) => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<{ success: boolean; bankAccount: BankAccount }>('/api/plaid/exchange-token', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          publicToken
        })
      });
      
      if (response.success && response.bankAccount) {
        setBankAccount(response.bankAccount);
        onBankVerified(response.bankAccount);
        
        toast({
          title: 'Bank Account Linked',
          description: `Successfully connected to ${response.bankAccount.institutionName}`,
        });
      } else {
        throw new Error('Failed to link bank account');
      }
    } catch (err: any) {
      setError('Failed to complete bank account linking');
      toast({
        title: 'Error',
        description: 'Could not link your bank account. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, toast, onBankVerified]);

  // Configure Plaid Link with more robust integration
  const config = {
    token: linkToken || '',
    onSuccess,
    onExit: (err: any, metadata: any) => {
      console.log("Plaid Link exit", err, metadata);
      // Only set error if it's an actual error, not a user-initiated exit
      if (err && err.error_code) {
        setError(`Bank linking was interrupted: ${err.error_code}`);
        console.error("Plaid exit with error:", err);
      }
    },
    onEvent: (eventName: string, metadata: any) => {
      console.log(`Plaid Link Event: ${eventName}`, metadata);
    },
    // Essential: Ensure these settings work in the sandbox environment
    receivedRedirectUri: window.location.href,
  };

  const { open, ready, error: plaidError } = usePlaidLink(config);
  
  // Log and handle Plaid Link initialization errors
  useEffect(() => {
    if (plaidError) {
      console.error("Plaid Link initialization error:", plaidError);
      setError("Failed to initialize the banking connection interface.");
      // Request a new link token after a short delay
      setTimeout(() => requestLinkToken(), 1000);
    }
  }, [plaidError, requestLinkToken]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Determine if user can mint the requested amount
  const canMintRequestedAmount = bankAccount && 
    parseFloat(tokenFormData.tokenSupply) <= bankAccount.availableBalance;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h3 className="text-lg font-medium mb-2">Setting Up Banking Connection</h3>
        <p className="text-muted-foreground text-center max-w-md">
          We're preparing your secure bank connection. This allows us to verify your available 
          balance for 1:1 USD backing of your stablecoin.
        </p>
      </div>
    );
  }

  if (error) {
    // Special handling for the INVALID_FIELD error which is a common Plaid API error in sandbox
    const isInvalidFieldError = error.includes("INVALID_FIELD");
    
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Banking Connection Setup</h3>
        
        {isInvalidFieldError ? (
          <div className="text-center mb-6 max-w-md">
            <p className="text-muted-foreground mb-3">
              We experienced a minor configuration issue with the banking connection.
            </p>
            <div className="bg-blue-500/10 p-4 rounded-md border border-blue-500/20 text-blue-400 text-left">
              <p className="font-medium mb-2">For Sandbox Testing:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click "Try Again" below to restart the connection</li>
                <li>When Plaid opens, select <strong>any bank</strong> (e.g., Chase)</li>
                <li>Use these test credentials:
                  <ul className="list-disc list-inside ml-5 mt-1">
                    <li>Username: <span className="font-mono bg-blue-900/30 px-1 rounded">user_good</span></li>
                    <li>Password: <span className="font-mono bg-blue-900/30 px-1 rounded">pass_good</span></li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            {error}
            <br />
            <span className="text-sm mt-2 inline-block">
              This is a sandbox environment. For testing, you can use any bank from the Plaid sandbox interface.
            </span>
          </p>
        )}
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack}>
            Go Back
          </Button>
          <Button onClick={() => {
            setIsLoading(true);
            setError(null);
            
            // For sandbox testing, we'll use a direct approach to get a link token and launch Plaid
            fetch('/api/plaid/create-link-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                walletAddress: publicKey?.toString() || ''
              })
            })
            .then(res => res.json())
            .then(data => {
              if (data.link_token) {
                console.log("Got fresh link token on retry");
                setLinkToken(data.link_token);
                
                // Short delay then try to open Plaid
                setTimeout(() => {
                  setIsLoading(false);
                  // Note: At this point, the Plaid Link component should re-render with the new token
                  // and call the 'open' function, but we'll try to trigger it here as well
                  try {
                    console.log("Attempting to open Plaid Link after retry");
                    open();
                  } catch (e) {
                    console.error("Error opening Plaid after retry:", e);
                    // We won't show an error here, as the user can just click "Try Again" again
                  }
                }, 500);
              } else {
                throw new Error("No link token in response");
              }
            })
            .catch(err => {
              console.error("Failed to get link token on retry:", err);
              setIsLoading(false);
              setError("Still having trouble connecting to the banking service. Please try again.");
            });
          }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (bankAccount) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-100 dark:bg-green-900/30 h-16 w-16 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-center mb-4">Bank Account Verified</h3>
          
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-muted p-4 border-b">
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-primary" />
                  <h4 className="font-semibold">{bankAccount.institutionName}</h4>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {bankAccount.accountName} (••••{bankAccount.accountMask})
                </p>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Current Balance:</span>
                  <span className="font-semibold">{formatCurrency(bankAccount.currentBalance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">Available Balance:</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help">
                            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">You can mint stablecoins up to this amount to maintain a 1:1 USD peg.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-semibold text-primary">{formatCurrency(bankAccount.availableBalance)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 rounded-lg bg-muted/50 mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Amount to mint:</span>
              <span className="font-semibold">{formatCurrency(parseFloat(tokenFormData.tokenSupply))}</span>
            </div>
            
            {canMintRequestedAmount ? (
              <div className="mt-2 flex items-center text-green-600 dark:text-green-400">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-sm">Sufficient funds available</span>
              </div>
            ) : (
              <div className="mt-2 flex items-center text-destructive">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-sm">Insufficient funds for requested amount</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button 
              disabled={!canMintRequestedAmount} 
              onClick={() => onBankVerified(bankAccount)}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Verify Your Bank Account</h3>
          <p className="text-muted-foreground mb-6">
            Connect your bank account to maintain a 1:1 USD peg for your stablecoin. This ensures your token is fully backed by your available bank balance.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-5">
            <h4 className="font-medium text-base mb-3">How it works:</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="h-3 w-3 rounded-full bg-primary"></span>
                </div>
                <span className="text-sm">Securely connect your bank through Plaid's trusted service</span>
              </li>
              <li className="flex items-start">
                <div className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="h-3 w-3 rounded-full bg-primary"></span>
                </div>
                <span className="text-sm">Your available balance sets your maximum token supply</span>
              </li>
              <li className="flex items-start">
                <div className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="h-3 w-3 rounded-full bg-primary"></span>
                </div>
                <span className="text-sm">No funds are moved or held—this is only for verification</span>
              </li>
            </ul>
            
            {/* Sandbox testing info */}
            <div className="mt-4 bg-blue-500/10 p-3 rounded-md border border-blue-500/20">
              <p className="text-xs text-blue-400">
                <strong>Testing Info:</strong> In sandbox mode, use any institution and the credentials:
                <br />
                • Username: <span className="font-mono bg-blue-900/30 px-1 rounded">user_good</span>
                <br />
                • Password: <span className="font-mono bg-blue-900/30 px-1 rounded">pass_good</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={() => {
              console.log("Connect Bank button clicked");
              console.log("Link token ready:", ready);
              console.log("Link token exists:", !!linkToken);
              
              if (ready && linkToken) {
                console.log("Opening Plaid Link with token");
                try {
                  // Force open the Plaid Link interface
                  open();
                  console.log("Plaid Link open() called");
                } catch (err) {
                  console.error("Error opening Plaid Link:", err);
                  setError("Failed to open banking interface. Refreshing connection...");
                  // If open fails, request a new token
                  setIsLoading(true);
                  requestLinkToken()
                    .finally(() => setIsLoading(false));
                }
              } else {
                console.log("Link token not ready, requesting new one");
                setIsLoading(true);
                
                // Request a completely fresh link token
                fetch('/api/plaid/create-link-token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    walletAddress: publicKey?.toString() || ''
                  })
                })
                .then(res => res.json())
                .then(data => {
                  if (data.link_token) {
                    console.log("Got new link token directly:", data.link_token.substring(0, 10) + "...");
                    setLinkToken(data.link_token);
                    // Use a short timeout to ensure the token is set before opening
                    setTimeout(() => {
                      try {
                        open(); // Try to open immediately after setting token
                        console.log("Attempted to open Plaid Link after token refresh");
                      } catch (e) {
                        console.error("Failed to open after refresh:", e);
                        toast({
                          title: "Ready to connect",
                          description: "Banking connection ready. Click 'Connect Bank' again to proceed.",
                          duration: 3000
                        });
                      }
                    }, 500);
                  } else {
                    throw new Error("No link token in response");
                  }
                })
                .catch(err => {
                  console.error("Failed to get link token:", err);
                  setError("Could not establish connection with banking service. Please try again.");
                })
                .finally(() => {
                  setIsLoading(false);
                });
              }
            }} 
            disabled={isLoading}
            className="flex-1"
            variant="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Connection...
              </>
            ) : (
              'Connect Bank'
            )}
          </Button>
        </div>
        
        {/* Show hint if link token is not available */}
        {!linkToken && !isLoading && (
          <p className="mt-4 text-xs text-muted-foreground text-center">
            The Connect Bank button will initiate a secure bank connection process.
          </p>
        )}
      </div>
    </div>
  );
}