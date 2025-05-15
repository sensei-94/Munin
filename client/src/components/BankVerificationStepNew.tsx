import React, { useState, useEffect } from 'react';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Building2, AlertTriangle } from 'lucide-react';
import { TokenFormData } from '@/types';
import { usePlaidLink } from 'react-plaid-link';

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

export default function BankVerificationStepNew({
  tokenFormData,
  onBankVerified,
  onBack
}: BankVerificationStepProps) {
  const { publicKey } = useSolanaWallet();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch a link token on component mount
  useEffect(() => {
    const fetchLinkToken = async () => {
      if (!publicKey) return;
      
      try {
        setIsLoading(true);
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
          throw new Error(data.error || 'Failed to get link token');
        }
      } catch (err) {
        console.error('Error fetching link token:', err);
        setError('Could not connect to banking service. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLinkToken();
  }, [publicKey]);
  
  // Handler for successful Plaid Link completion
  const handleSuccess = async (publicToken: string, metadata: any) => {
    if (!publicKey) return;
    
    console.log('Plaid Link Success!', metadata);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          publicToken
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.bankAccount) {
        toast({
          title: 'Bank Account Linked',
          description: `Successfully connected to ${data.bankAccount.institutionName}`,
        });
        
        onBankVerified(data.bankAccount);
      } else {
        throw new Error(data.error || 'Failed to exchange token');
      }
    } catch (err) {
      console.error('Error exchanging token:', err);
      setError('Failed to complete bank account linking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler for Plaid Link exit
  const handleExit = (err: any) => {
    if (err) {
      console.error('Plaid Link exit with error:', err);
      setError(`Bank connection interrupted: ${err.error_code || 'Unknown error'}`);
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
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
              } else {
                throw new Error(data.error || 'Failed to get link token');
              }
            })
            .catch(err => {
              console.error('Error fetching link token:', err);
              setError('Could not connect to banking service. Please try again.');
            })
            .finally(() => {
              setIsLoading(false);
            });
          }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Set up Plaid Link hook - ensuring hooks are always called unconditionally 
  const config = {
    token: linkToken || '',
    onSuccess: handleSuccess,
    onExit: handleExit
  };
  
  const { open, ready } = usePlaidLink(config);

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
              if (linkToken && ready) {
                console.log('Opening Plaid Link...');
                open();
              } else {
                console.log('Link token not ready, fetching new one');
                setIsLoading(true);
                fetch('/api/plaid/create-link-token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ walletAddress: publicKey?.toString() || '' })
                })
                .then(res => res.json())
                .then(data => {
                  if (data.link_token) {
                    console.log('Got new link token:', data.link_token.substring(0, 10) + '...');
                    setLinkToken(data.link_token);
                    toast({
                      title: 'Banking Connection Ready',
                      description: 'Please click Connect Bank again to continue.',
                    });
                  } else {
                    throw new Error(data.error || 'Failed to get link token');
                  }
                })
                .catch(err => {
                  console.error('Error fetching link token:', err);
                  setError('Could not connect to banking service. Please try again.');
                })
                .finally(() => {
                  setIsLoading(false);
                });
              }
            }}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              'Connect Bank'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}