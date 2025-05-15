import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BankAccount {
  institutionName: string;
  accountName: string;
  accountMask: string;
  currentBalance: number;
  availableBalance: number;
}

interface Props {
  onComplete: (bankInfo: BankAccount) => void;
  onCancel: () => void;
}

export default function EmergencySkipStep({ onComplete, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  
  // Hardcoded bank account data for demonstration
  const sampleBankAccount: BankAccount = {
    institutionName: "Bank of America",
    accountName: "Checking Account",
    accountMask: "1234",
    currentBalance: 5000,
    availableBalance: 5000
  };
  
  const handleVerify = () => {
    setLoading(true);
    
    // Simulate a verification process
    setTimeout(() => {
      setVerified(true);
      setLoading(false);
      
      // Complete after showing success message briefly
      setTimeout(() => {
        onComplete(sampleBankAccount);
      }, 1500);
    }, 1500);
  };
  
  if (verified) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Verification Complete!</h3>
        <p className="text-muted-foreground mb-4">
          Your bank account has been successfully verified.
        </p>
        <p className="text-sm mb-4">Proceeding to next step...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full mx-auto text-center mb-8">
        <h3 className="text-xl font-semibold mb-3">Verify Bank Account</h3>
        <p className="text-muted-foreground mb-6">
          Verify your bank account to ensure your stablecoin has a 1:1 backing with USD.
        </p>
      </div>
      
      <Card className="max-w-md w-full mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            {loading ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p>Verifying your bank account...</p>
              </>
            ) : (
              <>
                <p className="mb-6 text-center">
                  Click the button below to verify your bank account for stablecoin creation.
                </p>
                <div className="flex gap-4 w-full">
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    Go Back
                  </Button>
                  <Button onClick={handleVerify} className="flex-1">
                    Verify Account
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      <p className="text-sm text-muted-foreground max-w-md text-center">
        Note: This is a simulation for development purposes. In production, this would connect to a real banking service for verification.
      </p>
    </div>
  );
}