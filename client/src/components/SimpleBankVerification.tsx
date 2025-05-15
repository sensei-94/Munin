import React, { useState, useEffect } from 'react';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, AlertTriangle } from 'lucide-react';
import { TokenFormData } from '@/types';

// Import usePlaidLink at top level
import { usePlaidLink } from 'react-plaid-link';

// Define bank account interface
export interface BankAccount {
  institutionName: string;
  accountName: string;
  accountMask: string;
  currentBalance: number;
  availableBalance: number;
}

// Props interface
interface BankVerificationProps {
  tokenFormData: TokenFormData;
  onBankVerified: (bankInfo: BankAccount) => void;
  onBack: () => void;
}

// Simple component without conditional hook rendering
export default function SimpleBankVerification({
  tokenFormData,
  onBankVerified,
  onBack
}: BankVerificationProps) {
  const { publicKey } = useSolanaWallet();
  const { toast } = useToast();
  
  // State variables - defined at the top level
  const [isLoading, setIsLoading] = useState(true);
  const [linkToken, setLinkToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch a link token
  useEffect(() => {
    const getLinkToken = async () => {
      if (!publicKey) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching link token...');
        
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: publicKey.toString() })
        });
        
        const data = await response.json();
        
        if (data.link_token) {
          console.log('Successfully received link token:', data.link_token.substring(0, 10) + '...');
          setLinkToken(data.link_token);
        } else {
          console.error('No link token in response:', data);
          setError('Could not get bank connection token. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching link token:', err);
        setError('Failed to connect to banking service. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    getLinkToken();
  }, [publicKey]);
  
  // Define success handler - outside of any conditional blocks
  const handleSuccess = async (public_token: string, metadata: any) => {
    if (!publicKey) {
      console.error("No public key available");
      setError("Wallet connection required. Please connect your wallet and try again.");
      return;
    }
    
    console.log('Plaid Link Success! Metadata:', JSON.stringify(metadata));
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Exchanging public token...');
      // Add a delay to ensure the Plaid Link modal is fully closed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          publicToken: public_token
        })
      });
      
      if (!response.ok) {
        console.error(`Server error: ${response.status} ${response.statusText}`);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      if (data.success === true && data.bankAccount) {
        console.log('Bank account data received:', JSON.stringify(data.bankAccount));
        
        // Create a properly formatted account object with fallbacks
        const bankAccount: BankAccount = {
          institutionName: String(data.bankAccount.institutionName || 'Your Bank'),
          accountName: String(data.bankAccount.accountName || 'Bank Account'),
          accountMask: String(data.bankAccount.accountMask || '****'),
          currentBalance: 0,
          availableBalance: 0
        };
        
        // Safely parse numeric values
        try {
          if (data.bankAccount.currentBalance !== undefined) {
            bankAccount.currentBalance = typeof data.bankAccount.currentBalance === 'number'
              ? data.bankAccount.currentBalance
              : parseFloat(String(data.bankAccount.currentBalance));
          }
          
          if (data.bankAccount.availableBalance !== undefined) {
            bankAccount.availableBalance = typeof data.bankAccount.availableBalance === 'number'
              ? data.bankAccount.availableBalance
              : parseFloat(String(data.bankAccount.availableBalance));
          }
        } catch (numberError) {
          console.error('Error parsing numeric values:', numberError);
          // Use defaults if parsing fails
        }
        
        // Ensure we have valid numbers (not NaN)
        if (isNaN(bankAccount.currentBalance)) bankAccount.currentBalance = 0;
        if (isNaN(bankAccount.availableBalance)) bankAccount.availableBalance = 0;
        
        console.log('Final processed bank account data:', bankAccount);
        
        toast({
          title: 'Bank Account Linked',
          description: `Successfully connected to ${bankAccount.institutionName}`,
        });
        
        // Send the properly formatted bank account data to parent
        onBankVerified(bankAccount);
      } else {
        console.error('Invalid response data structure:', data);
        throw new Error(data.error || 'Failed to exchange token - missing or invalid bank account data');
      }
    } catch (err: any) {
      console.error('Error exchanging token:', err);
      setError(err.message || 'Failed to complete bank account linking. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Define exit handler - outside of any conditional blocks
  const handleExit = (err: any) => {
    console.log('Plaid Link exit:', err);
    if (err && err.error_code) {
      setError(`Bank connection interrupted: ${err.error_code}`);
    }
  };
  
  // Always define the configuration object - no conditionals
  const config = {
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit
  };
  
  // Always call usePlaidLink unconditionally with full logging
  console.log("Initializing Plaid Link with config:", { 
    token: config.token ? `${config.token.substring(0, 10)}...` : 'undefined',
    onSuccess: config.onSuccess ? 'function defined' : 'undefined',
    onExit: config.onExit ? 'function defined' : 'undefined'
  });
  
  const { open, ready } = usePlaidLink(config);
  
  // Loading state
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
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Banking Connection Setup</h3>
        <div className="text-center mb-6 max-w-md">
          <p className="text-muted-foreground mb-3">
            {error}
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
        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack}>
            Go Back
          </Button>
          <Button onClick={() => {
            setIsLoading(true);
            setError(null);
            
            fetch('/api/plaid/create-link-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress: publicKey?.toString() || '' })
            })
            .then(res => res.json())
            .then(data => {
              if (data.link_token) {
                setLinkToken(data.link_token);
                setIsLoading(false);
              } else {
                throw new Error(data.error || 'Failed to get link token');
              }
            })
            .catch(err => {
              console.error('Error fetching link token:', err);
              setError('Could not connect to banking service. Please try again.');
              setIsLoading(false);
            });
          }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Main UI
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Verify Your Bank Account</h3>
          <p className="text-muted-foreground mb-6">
            Connect your bank account to maintain a 1:1 USD peg for your stablecoin. 
            This ensures your token is fully backed by your available bank balance.
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
              if (ready && linkToken) {
                console.log('Opening Plaid Link with token:', linkToken.substring(0, 10) + '...');
                open();
              } else {
                console.log('Link token not ready yet');
                toast({
                  title: "Banking Connection",
                  description: "Preparing connection. Please try again in a moment."
                });
              }
            }}
            disabled={!ready || !linkToken}
            className="flex-1"
          >
            Connect Bank
          </Button>
        </div>
      </div>
    </div>
  );
}